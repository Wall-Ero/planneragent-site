import { performance } from "node:perf_hooks";
import { createConversationalProviderDescriptorV1 } from "../../src/conversation/cognition/conversational.cognition.contracts.v1";
import { hybridDigestV1, hybridSnapshotV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { runOfflineHybridSupervisionV1, type OfflineHybridDependenciesV1 } from "../../src/conversation/cognition/hybrid.conversational.supervision.v1";
import { HYBRID_TEACHER_MODEL_V1, MockHybridTeacherProviderV1, OfflineMockTeacherQuotaV1, type OfflineTeacherConfigurationV1 } from "../../src/conversation/cognition/hybrid.conversational.teacher.v1";
import { OfflineHybridEvidenceRegistryV1 } from "../../src/conversation/learning/hybrid.conversational.evidence.v1";
import { baseline, boundary, curriculum, exercise, producer, qualifications, realize, requestFor, rubric, verifier, type Case } from "./fixtures.v1";

const versions = Object.freeze({ runner: 1, curriculum: 1, hybrid: 1, teacher: 1, student: 1, envelope: 1, evaluator: 1, ledger: 1 });
const before = Object.freeze({ version: 1, preserveUncertainty: false });
const after = Object.freeze({ version: 2, preserveUncertainty: true });
const limitMs = 60_000;
const time = "2026-11-24T00:00:00.000Z";
const configuration: OfflineTeacherConfigurationV1 = {
  mode: "MOCK_ONLY", provider: "CLOUDFLARE_WORKERS_AI", model: HYBRID_TEACHER_MODEL_V1,
  model_revision: "PAM_OFFLINE_FIXTURE", configuration_version: "1",
  free_plan: "CONFIRMED_BY_OFFLINE_FIXTURE", model_free_eligibility: "CONFIRMED_BY_OFFLINE_FIXTURE",
  confirmation_ref: "pam:offline-only", day_utc: time.slice(0, 10), daily_neurons: 5,
  limits: { max_input_bytes: 8192, max_input_tokens: 2048, max_output_tokens: 384, max_neurons_per_attempt: 5, timeout_ms: 100, max_retries: 0 },
};

function checkSplits(splits: typeof curriculum) {
  const rows = [...splits.development, ...splits.holdout];
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return splits.development.length > 0 && splits.holdout.length > 0 &&
    new Set(rows.map(row => row.group)).size === rows.length &&
    new Set(rows.map(row => normalize(row.prompt))).size === rows.length;
}

function independentOracle(row: Case, identity: string): NonNullable<OfflineHybridDependenciesV1["verify"]> {
  return async binding => {
    const answer = "answer" in binding.candidate ? binding.candidate.answer : "";
    const inScope = binding.request_digest === hybridDigestV1(requestFor(row));
    const match = answer === rubric[row.group];
    const approvedBoundary = match || answer === boundary;
    return {
      verifier_id: identity, method: "DETERMINISTIC_POLICY", policy_ref: "pam:exact-rubric-v1",
      qualified_scope_ref: "pam:synthetic-vision-only", evidence_ref: `pam:rubric:${row.group}`,
      request_digest: binding.request_digest, candidate_digest: binding.candidate_digest,
      checks: {
        semantic_fidelity: !inScope ? "INCONCLUSIVE" : match ? "PASS" : "FAIL",
        uncertainty_preservation: !inScope ? "INCONCLUSIVE" : match ? "PASS" : "FAIL",
        authority_boundary: !inScope ? "INCONCLUSIVE" : approvedBoundary ? "PASS" : "FAIL",
        exposure_boundary: !inScope ? "INCONCLUSIVE" : approvedBoundary ? "PASS" : "FAIL",
      },
    };
  };
}

export async function runMaturationV1(options: {
  splits?: typeof curriculum; fault?: "missing-evidence" | "self-review"; elapsed?: () => number;
} = {}) {
  const started = performance.now();
  const elapsed = options.elapsed ?? (() => performance.now() - started);
  const splits = hybridSnapshotV1(options.splits ?? curriculum);
  const registry = new OfflineHybridEvidenceRegistryV1();
  const results: Record<string, { passed: number; total: number; groups: string[] }> = {};
  const regressions: string[] = [];
  const exerciseDigests: string[] = [];
  let remediations = 0;
  let stop = "COMPLETED";
  let verdict: "DEMO_PASS" | "FAIL" | "INCONCLUSIVE" = "INCONCLUSIVE";
  const guardTime = () => { if (elapsed() >= limitMs) throw new Error("TIMEOUT"); };
  const run = async (row: Case, candidate: typeof before | typeof after, phase: string, useTeacher = false) => {
    guardTime();
    const request = requestFor(row);
    const dependencies: OfflineHybridDependenciesV1 = {
      student: {
        descriptor: createConversationalProviderDescriptorV1({
          version: 1, provider_id: producer, adapter_id: "pam-fixture", adapter_version: "1",
          model_id: "pam-vision-fixture", model_version: String(candidate.version), capabilities: ["REALIZATION"],
          deployment_class: "OFFLINE_FIXTURE", retention_privacy_class: "NO_RETENTION",
        }),
        propose: async input => useTeacher ? "{}" : realize(input, candidate.preserveUncertainty),
      },
      now: () => time, student_timeout_ms: 100, verification_timeout_ms: 100,
      registry: options.fault === "missing-evidence" ? { append: async () => { throw new Error("EVIDENCE_UNAVAILABLE"); } } : registry,
      authorize_exposure: async input => hybridDigestV1(input) === hybridDigestV1(request)
        ? { boundary: "CONVERSATIONAL_SURFACE_ONLY", classification: "SYNTHETIC_FIXTURE",
          request_digest: hybridDigestV1(request), evidence_ref: "pam:sealed-input" } : undefined,
      verify: independentOracle(row, options.fault === "self-review" ? producer : verifier),
      ...(useTeacher ? { teacher: {
        provider: new MockHybridTeacherProviderV1(configuration.model_revision, configuration.configuration_version, async input => ({
          candidate: realize(input.surface, true), usage: { input_tokens: 30, output_tokens: 20, neurons: 2 },
        })),
        quota: new OfflineMockTeacherQuotaV1(configuration), configuration,
      } } : {}),
    };
    const result = await runOfflineHybridSupervisionV1({
      request_id: `pam:${phase}:${row.group}`, request, public_response: boundary,
      semantic_family: "VISION_BOUNDARY", evaluation_kind: phase.startsWith("holdout") ? "INDEPENDENT_NEW" : "RUNTIME",
    }, dependencies);
    guardTime();
    if (result.registry_status !== "RECORDED" ||
        !registry.list().some(item => item.observation_digest === result.observation.observation_digest)) throw new Error("MISSING_EVIDENCE");
    if (result.observation.student_state === "TIMEOUT" ||
        result.observation.teacher_attempts.some(attempt => attempt.state === "TIMEOUT")) throw new Error("TIMEOUT");
    if (result.observation.student_gate.critical_violation ||
        result.observation.teacher_attempts.some(attempt => attempt.gate?.critical_violation)) throw new Error("UNEXPECTED_CRITICAL_REGRESSION");
    if (!useTeacher && result.observation.student_gate.status === "INCONCLUSIVE") throw new Error("EVALUATION_INCONCLUSIVE");
    return result.observation;
  };

  async function evaluate(rows: readonly Case[], candidate: typeof before | typeof after, phase: string) {
    const score = { passed: 0, total: rows.length, groups: [] as string[] };
    results[phase] = score;
    for (const row of rows) {
      exerciseDigests.push(exercise(row).exercise_digest);
      const evaluation = await run(row, candidate, phase);
      if (evaluation.student_gate.status === "PASS") score.passed++;
      else score.groups.push(row.group);
    }
    return score;
  }

  const frozen = {
    curriculum: hybridDigestV1(splits),
    development: hybridDigestV1(splits.development),
    holdout: hybridDigestV1(splits.holdout),
    evaluator: hybridDigestV1({ rubric, boundary, implementation: independentOracle.toString(), version: versions.evaluator }),
  };
  try {
    guardTime();
    if (!checkSplits(splits)) throw new Error("SPLIT_CONTAMINATION");
    const seed = splits.development[0];
    const teacher = await run(seed, before, "teacher", true);
    if (teacher.disposition !== "TEACHER_VERIFIED" || !teacher.selected_candidate_digest) throw new Error("TEACHER_EVIDENCE_UNVERIFIED");
    const initial = await evaluate(splits.development, before, "development_before");
    if (initial.groups.length !== 1 || initial.groups[0] !== seed.group) throw new Error("UNEXPECTED_INITIAL_RESULT");
    remediations++;
    const repaired = await evaluate(splits.development, after, "development_after");
    regressions.push(...repaired.groups);
    if (regressions.length) throw new Error("DEVELOPMENT_REGRESSION");
    // Both versions are fixed before any holdout request reaches a candidate.
    await evaluate(splits.holdout, before, "holdout_before");
    const final = await evaluate(splits.holdout, after, "holdout_after");
    regressions.push(...final.groups);
    if (regressions.length) throw new Error("HOLDOUT_FAILURE");
    guardTime();
    verdict = "DEMO_PASS";
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    const failures = ["UNEXPECTED_INITIAL_RESULT", "UNEXPECTED_CRITICAL_REGRESSION", "DEVELOPMENT_REGRESSION", "HOLDOUT_FAILURE", "SPLIT_CONTAMINATION"];
    const inconclusive = ["TIMEOUT", "MISSING_EVIDENCE", "EVALUATION_INCONCLUSIVE", "TEACHER_EVIDENCE_UNVERIFIED"];
    stop = [...failures, ...inconclusive].includes(reason) ? reason : "UNEXPECTED_OFFLINE_ERROR";
    if (failures.includes(stop)) verdict = "FAIL";
  }
  const observations = registry.list();
  return {
    baseline_sha: baseline, versions, verdict, stop_reason: stop, frozen,
    candidates: { before: hybridDigestV1({ ...before, producer: realize.toString(), boundary, qualifications }),
      after: remediations ? hybridDigestV1({ ...after, producer: realize.toString(), boundary, qualifications }) : null },
    results, regressions, exercise_digests: [...new Set(exerciseDigests)], observations,
    budget: { remediations, remediation_limit: 1, elapsed_ms: Math.ceil(elapsed()), limit_ms: limitMs, external_eur: 0,
      mock_neurons: observations.flatMap(item => item.teacher_attempts).reduce((total, attempt) => total + (attempt.usage?.neurons ?? 0), 0) },
    promotion: false, teacher_live: false, limits: ["Synthetic exact-scope oracle", "No training or model qualification", "No production runtime changes"],
  };
}
