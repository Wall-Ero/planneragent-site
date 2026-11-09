import { parseConversationalInterpretationResultV1, sealConversationalInterpretationRequestV1 } from "./conversational.cognition.contracts.v1";
import { parseRealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import { createPlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";
import { HYBRID_CHECKS_V1, HYBRID_SURFACE_BOUNDARY_V1, HybridTeacherProviderErrorV1, hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1,
  type HybridCandidateV1, type HybridExposureAdmissionV1, type HybridGateVerdictV1, type HybridIndependentVerificationV1,
  type HybridRequestV1, type HybridStudentV1, type HybridTeacherAttemptV1, type HybridTeacherProviderV1, type HybridTeacherRequestV1 } from "./hybrid.conversational.contracts.v1";
import { HYBRID_TEACHER_MODEL_V1, OfflineMockTeacherQuotaV1, validOfflineTeacherConfigurationV1, type OfflineTeacherConfigurationV1 } from "./hybrid.conversational.teacher.v1";
import { createHybridObservationV1, type HybridEvidenceRegistryV1, type HybridObservationV1 } from "../learning/hybrid.conversational.evidence.v1";
import type { ConversationalTrainingSourceIdentityV1 } from "../learning/conversational.training.source.eligibility.v1";

type Verifier = (input: Readonly<{ request: HybridRequestV1; candidate: HybridCandidateV1; request_digest: string; candidate_digest: string }>, signal: AbortSignal) => Promise<HybridIndependentVerificationV1>;
export type OfflineHybridDependenciesV1 = Readonly<{
  student: HybridStudentV1;
  registry: HybridEvidenceRegistryV1;
  now: () => string;
  student_timeout_ms: number;
  verification_timeout_ms: number;
  // Trusted host policy, not a model assertion or a caller-provided public JSON flag.
  authorize_exposure?: (request: HybridRequestV1, digest: string) => Promise<HybridExposureAdmissionV1 | undefined>;
  verify?: Verifier;
  teacher?: Readonly<{ provider: HybridTeacherProviderV1; configuration: OfflineTeacherConfigurationV1; quota: OfflineMockTeacherQuotaV1 }>;
}>;
export type OfflineHybridResultV1 = Readonly<{
  boundary: "CONVERSATIONAL_SURFACE_ONLY";
  lifecycle: "SHADOW";
  provider: "MOCK_ONLY";
  public_response: string;
  registry_status: "RECORDED" | "UNAVAILABLE";
  shadow_candidate?: HybridCandidateV1;
  observation: HybridObservationV1;
}>;

class HybridTimeout extends Error {}
async function bounded<T>(timeout: number, call: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([Promise.resolve().then(() => call(controller.signal)), new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new HybridTimeout()); }, timeout); })]); }
  finally { if (timer) clearTimeout(timer); controller.abort(); }
}
function requestSnapshot(request: HybridRequestV1): HybridRequestV1 {
  const copy = hybridSnapshotV1(request);
  if (Object.keys(copy).sort().join() !== "payload,purpose") throw new TypeError("HYBRID_REQUEST_EXTRA_FIELDS");
  if (copy.purpose === "INTERPRETATION") {
    if (hybridCanonicalV1(copy.payload) !== hybridCanonicalV1(sealConversationalInterpretationRequestV1(copy.payload.raw_user_message))) throw new TypeError("HYBRID_INTERPRETATION_REQUEST_INVALID");
  } else if (copy.purpose === "REALIZATION") {
    const p = copy.payload;
    const allowed = ["version", "current_user_message", "governed_meaning", "semantic_interpretation", "voice_profile", "required_output_contract"];
    if (Object.keys(p).some(k => !allowed.includes(k)) || p.version !== 1 || !p.governed_meaning || typeof p.current_user_message !== "string" || !p.current_user_message.trim() ||
        p.required_output_contract !== "REALIZATION_ENVELOPE_V1" || hybridCanonicalV1(p.voice_profile) !== hybridCanonicalV1(createPlannerAgentVoiceProfileV1()) ||
        (p.semantic_interpretation !== undefined && !parseConversationalInterpretationResultV1(p.semantic_interpretation))) throw new TypeError("HYBRID_REALIZATION_REQUEST_INVALID");
  } else throw new TypeError("HYBRID_PURPOSE_INVALID");
  return copy;
}
const gate = (status: HybridGateVerdictV1["status"], reason: HybridGateVerdictV1["reason"], schema_valid = false, critical_violation = false, verification?: HybridIndependentVerificationV1): HybridGateVerdictV1 =>
  hybridSnapshotV1({ status, reason, schema_valid, critical_violation, ...(verification ? { verification } : {}) });

async function verifyCandidate(request: HybridRequestV1, raw: unknown, producer: string, dependencies: OfflineHybridDependenciesV1): Promise<{ candidate?: HybridCandidateV1; verdict: HybridGateVerdictV1 }> {
  let candidate: HybridCandidateV1 | undefined;
  try {
    if (hybridCanonicalV1(raw).length > 65_536) return { verdict: gate("FAIL", "INVALID_CONTRACT") };
    candidate = request.purpose === "INTERPRETATION" ? parseConversationalInterpretationResultV1(raw) : typeof raw === "string" ? parseRealizationEnvelopeV1(raw) : undefined;
  } catch { return { verdict: gate("FAIL", "INVALID_CONTRACT") }; }
  if (!candidate) {
    const r = raw as Record<string, unknown> | undefined;
    return { verdict: gate("FAIL", "INVALID_CONTRACT", false, !!r && (r.grants_authority === true || r.grants_execution === true)) };
  }
  if (request.purpose === "INTERPRETATION" && "resolution" in candidate && candidate.resolution !== "CLEAR") return { candidate, verdict: gate("INCONCLUSIVE", "VERIFICATION_INCONCLUSIVE", true) };
  if (!dependencies.verify) return { candidate, verdict: gate("INCONCLUSIVE", "VERIFICATION_UNAVAILABLE", true) };
  try {
    const binding = hybridSnapshotV1({ request, candidate, request_digest: hybridDigestV1(request), candidate_digest: hybridDigestV1(candidate) });
    const v = hybridSnapshotV1(await bounded(dependencies.verification_timeout_ms, signal => dependencies.verify!(binding, signal)));
    const reference = (x: unknown) => typeof x === "string" && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/.test(x);
    const exactKeys = ["verifier_id", "method", "policy_ref", "evidence_ref", "qualified_scope_ref", "request_digest", "candidate_digest", "checks"].sort().join();
    if (Object.keys(v).sort().join() !== exactKeys || !reference(v.verifier_id) || v.verifier_id === producer ||
        !["DETERMINISTIC_POLICY", "INDEPENDENT_REVIEW"].includes(v.method) ||
        ![v.policy_ref, v.evidence_ref, v.qualified_scope_ref].every(reference) || v.request_digest !== binding.request_digest || v.candidate_digest !== binding.candidate_digest ||
        !v.checks || Object.keys(v.checks).sort().join() !== [...HYBRID_CHECKS_V1].sort().join() ||
        HYBRID_CHECKS_V1.some(k => !["PASS", "FAIL", "INCONCLUSIVE"].includes(v.checks[k]))) return { candidate, verdict: gate("INCONCLUSIVE", "VERIFICATION_INCONCLUSIVE", true) };
    const status = HYBRID_CHECKS_V1.some(k => v.checks[k] === "FAIL") ? "FAIL" : HYBRID_CHECKS_V1.every(k => v.checks[k] === "PASS") ? "PASS" : "INCONCLUSIVE";
    return { candidate, verdict: gate(status, status === "PASS" ? "VERIFIED_WITHIN_SCOPE" : status === "FAIL" ? "CONSTRAINT_VIOLATION" : "VERIFICATION_INCONCLUSIVE", true,
      v.checks.authority_boundary === "FAIL" || v.checks.exposure_boundary === "FAIL", v) };
  } catch { return { candidate, verdict: gate("INCONCLUSIVE", "VERIFICATION_UNAVAILABLE", true) }; }
}

export async function runOfflineHybridSupervisionV1(input: Readonly<{
  request_id: string; request: HybridRequestV1; public_response: string; semantic_family: string;
  evaluation_kind: HybridObservationV1["evaluation_kind"];
}>, dependencies: OfflineHybridDependenciesV1): Promise<OfflineHybridResultV1> {
  input = hybridSnapshotV1(input);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/.test(input.request_id) || !/^[A-Z][A-Z0-9_]{0,79}$/.test(input.semantic_family) ||
      !["RUNTIME", "INDEPENDENT_NEW", "FROZEN_EVALUATION"].includes(input.evaluation_kind) || typeof input.public_response !== "string" ||
      ![dependencies.student_timeout_ms, dependencies.verification_timeout_ms].every(v => Number.isSafeInteger(v) && v > 0)) throw new TypeError("HYBRID_OFFLINE_INPUT_INVALID");
  const request = requestSnapshot(input.request), request_digest = hybridDigestV1(request);
  const public_response = input.public_response; // Never forwarded to either model.
  let student_state: HybridObservationV1["student_state"] = "EXPOSURE_DENIED";
  let student_gate = gate("INCONCLUSIVE", "VERIFICATION_UNAVAILABLE");
  let selected: HybridCandidateV1 | undefined, teacher_requested = false;
  const attempts: HybridTeacherAttemptV1[] = [];
  let teacher_identity: HybridObservationV1["teacher_identity"];
  const descriptor = hybridSnapshotV1(dependencies.student.descriptor);
  const currentDay = (): string => {
    try { const at = Date.parse(dependencies.now()); return Number.isFinite(at) ? new Date(at).toISOString().slice(0, 10) : ""; }
    catch { return ""; }
  };
  let source: ConversationalTrainingSourceIdentityV1 = { source_kind: "MODEL", generator_id: descriptor.adapter_id, generator_version: descriptor.adapter_version,
    model: { provider_id: descriptor.provider_id, model_id: descriptor.model_id, model_version: descriptor.model_version, adapter_id: descriptor.adapter_id, adapter_version: descriptor.adapter_version } };
  let admission: HybridExposureAdmissionV1 | undefined;
  try { admission = hybridSnapshotV1(await bounded(dependencies.verification_timeout_ms, () => dependencies.authorize_exposure?.(request, request_digest) ?? Promise.resolve(undefined))); }
  catch { admission = undefined; }
  const admitted = admission && Object.keys(admission).sort().join() === "boundary,classification,evidence_ref,request_digest" &&
    admission.boundary === HYBRID_SURFACE_BOUNDARY_V1 && ["PUBLIC_SAFE", "SYNTHETIC_FIXTURE"].includes(admission.classification) &&
    admission.request_digest === request_digest && /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/.test(admission.evidence_ref);
  let disposition: HybridObservationV1["disposition"] = "DETERMINISTIC_FALLBACK";
  if (admitted) {
    try {
      if (!descriptor.capabilities.includes(request.purpose)) throw new TypeError("STUDENT_CAPABILITY_MISMATCH");
      const raw = await bounded(dependencies.student_timeout_ms, signal => dependencies.student.propose(request, signal));
      const checked = await verifyCandidate(request, raw, descriptor.provider_id, dependencies);
      student_state = "COMPLETED"; student_gate = checked.verdict;
      if (student_gate.status === "PASS") selected = checked.candidate;
    } catch (error) { student_state = error instanceof HybridTimeout ? "TIMEOUT" : "PROVIDER_ERROR"; }
    if (selected) disposition = "STUDENT_VERIFIED";
    else {
      teacher_requested = true;
      const teacher = dependencies.teacher;
      const day = currentDay();
      if (teacher && validOfflineTeacherConfigurationV1(teacher.configuration, day) && teacher.provider.mode === "MOCK_ONLY" &&
          teacher.provider.provider_id === "CLOUDFLARE_WORKERS_AI" && teacher.provider.model === HYBRID_TEACHER_MODEL_V1 &&
          teacher.provider.model_revision === teacher.configuration.model_revision && teacher.provider.configuration_version === teacher.configuration.configuration_version &&
          teacher.quota instanceof OfflineMockTeacherQuotaV1 && teacher.quota.matches(teacher.configuration) &&
          Buffer.byteLength(hybridCanonicalV1(request), "utf8") <= teacher.configuration.limits.max_input_bytes) {
        const configuration = hybridSnapshotV1(teacher.configuration);
        teacher_identity = hybridSnapshotV1({ provider_id: teacher.provider.provider_id, model_id: configuration.model,
          model_revision: configuration.model_revision, configuration_version: configuration.configuration_version });
        for (let attempt = 0; attempt <= configuration.limits.max_retries; attempt++) {
          const reservation = `${input.request_id}:${request.purpose}:${attempt}`;
          if (!teacher.quota.reserve(reservation, currentDay())) { attempts.push({ attempt, state: "BUDGET_DENIED", reserved_neurons: 0 }); break; }
          const reserved_neurons = configuration.limits.max_neurons_per_attempt;
          const teacherRequest: HybridTeacherRequestV1 = hybridSnapshotV1({ version: 1, boundary: HYBRID_SURFACE_BOUNDARY_V1, purpose: request.purpose,
            request_id: input.request_id, request_digest, model: configuration.model, model_revision: configuration.model_revision,
            configuration_version: configuration.configuration_version, contracts: { interpretation: 1, realization: 1, teacher: 1 },
            exposure: admission!, surface: request, limits: configuration.limits, escalation_reason: student_state === "COMPLETED" ? student_gate.reason : student_state,
            attempt, state: "RESERVED" });
          try {
            const response = await bounded(configuration.limits.timeout_ms, signal => teacher.provider.complete(teacherRequest, signal));
            const measuredUsage = hybridSnapshotV1(response.usage);
            if (!teacher.quota.settle(reservation, measuredUsage)) { attempts.push({ attempt, state: "METERING_INVALID", reserved_neurons }); break; }
            const checked = await verifyCandidate(request, response.candidate, teacher.provider.provider_id, dependencies);
            attempts.push({ attempt, state: checked.verdict.status === "PASS" ? "VERIFIED" : "REJECTED", reserved_neurons, usage: measuredUsage, gate: checked.verdict });
            if (checked.verdict.status === "PASS") {
              selected = checked.candidate; disposition = "TEACHER_VERIFIED";
              // Existing source-identity syntax excludes leading '@'; keep a reversible cf/ model alias.
              source = { source_kind: "MODEL", generator_id: "hybrid-offline-teacher", generator_version: "1", model: { provider_id: teacher.provider.provider_id,
                model_id: teacher.provider.model.replace(/^@cf\//, "cf/"), model_version: teacher.provider.model_revision, adapter_id: "hybrid-offline-teacher", adapter_version: configuration.configuration_version } };
            }
            break; // Semantic rejection is never repaired by blind retries.
          } catch (error) {
            const typed = error instanceof HybridTeacherProviderErrorV1 ? error : undefined;
            const usage = typed?.usage;
            if (typed?.consumption_unknown || (usage && !teacher.quota.settle(reservation, usage))) {
              teacher.quota.invalidateAccounting();
              attempts.push({ attempt, state: "METERING_INVALID", reserved_neurons, ...(typed ? { failure_code: typed.code } : {}) });
              break;
            }
            attempts.push({ attempt, state: error instanceof HybridTimeout || typed?.code === "TIMEOUT" ? "TIMEOUT" : "PROVIDER_ERROR",
              reserved_neurons, ...(usage ? { usage } : {}), ...(typed ? { failure_code: typed.code } : {}) });
            if (typed && !typed.retryable) break;
          }
        }
      }
      if (!selected && request.purpose === "INTERPRETATION" && student_state === "COMPLETED" && student_gate.schema_valid) disposition = "CLARIFICATION_REQUIRED";
    }
  }
  let observation = createHybridObservationV1({ request_id: input.request_id, request_digest, purpose: request.purpose,
    semantic_family: input.semantic_family, evaluation_kind: input.evaluation_kind, student_identity: { provider_id: descriptor.provider_id, model_id: descriptor.model_id, model_version: descriptor.model_version },
    student_state, student_gate, teacher_requested, teacher_attempts: attempts, disposition, source,
    ...(teacher_identity ? { teacher_identity } : {}),
    ...(selected ? { selected_candidate_digest: hybridDigestV1(selected) } : {}) });
  let registry_status: OfflineHybridResultV1["registry_status"] = "RECORDED";
  try { await bounded(dependencies.verification_timeout_ms, () => dependencies.registry.append(observation)); }
  catch {
    registry_status = "UNAVAILABLE"; selected = undefined;
    const { version: _v, boundary: _b, lifecycle: _l, learning_state: _s, observation_digest: _d, selected_candidate_digest: _c, ...content } = observation;
    observation = createHybridObservationV1({ ...content, disposition: "DETERMINISTIC_FALLBACK" });
  }
  return hybridSnapshotV1({ boundary: HYBRID_SURFACE_BOUNDARY_V1, lifecycle: "SHADOW", provider: "MOCK_ONLY", public_response, registry_status,
    ...(selected ? { shadow_candidate: selected } : {}), observation });
}
