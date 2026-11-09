import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1, createConversationalProviderDescriptorV1, sealConversationalInterpretationRequestV1 } from "../cognition/conversational.cognition.contracts.v1";
import { createPlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";
import { assessHybridLifecycleV1, hybridDigestV1, type HybridIndependentVerificationV1, type HybridRequestV1, type HybridUsageV1 } from "../cognition/hybrid.conversational.contracts.v1";
import { runOfflineHybridSupervisionV1, type OfflineHybridDependenciesV1 } from "../cognition/hybrid.conversational.supervision.v1";
import { HYBRID_TEACHER_MODEL_V1, inspectLiveTeacherAvailabilityV1, MockHybridTeacherProviderV1, OfflineMockTeacherQuotaV1, type OfflineTeacherConfigurationV1 } from "../cognition/hybrid.conversational.teacher.v1";
import { classifyHybridLearningEvidenceV1, HYBRID_ELIGIBILITY_REQUIREMENTS_V1, OfflineHybridEvidenceRegistryV1, summarizeHybridMaturationV1, type HybridEligibilityReviewV1 } from "../learning/hybrid.conversational.evidence.v1";
import { createConversationalTrainingSourceEligibilityDecisionV1 } from "../learning/conversational.training.source.eligibility.v1";

// Hand-authored synthetic unit fixtures; no production inputs or frozen evaluation cases.
const answer = JSON.stringify({ version: 1, answer: "Synthetic fixture: evidence is insufficient; no execution is authorized." });
const interpretation = { version: 1, interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES", resolution: "CLEAR", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 } as const;
const realizationRequest = (): HybridRequestV1 => ({ purpose: "REALIZATION", payload: { version: 1,
  current_user_message: "Describe this synthetic fixture.", governed_meaning: { fixture_id: "step13a-unit", status: "INSUFFICIENT_EVIDENCE", grants_execution: false },
  voice_profile: createPlannerAgentVoiceProfileV1(), required_output_contract: "REALIZATION_ENVELOPE_V1" } });
const interpretationRequest = (): HybridRequestV1 => ({ purpose: "INTERPRETATION", payload: sealConversationalInterpretationRequestV1("Explain PlannerAgent in a synthetic fixture.") });
const usage: HybridUsageV1 = { input_tokens: 30, output_tokens: 20, neurons: 2 };
const configuration = (daily = 10, retries = 0): OfflineTeacherConfigurationV1 => ({ mode: "MOCK_ONLY", provider: "CLOUDFLARE_WORKERS_AI", model: HYBRID_TEACHER_MODEL_V1,
  model_revision: "OFFLINE_FIXTURE_ONLY", configuration_version: "fixture-v1", free_plan: "CONFIRMED_BY_OFFLINE_FIXTURE", model_free_eligibility: "CONFIRMED_BY_OFFLINE_FIXTURE",
  confirmation_ref: "fixture:no-account-verification", day_utc: "2026-10-19", daily_neurons: daily,
  limits: { max_input_bytes: 8192, max_input_tokens: 2048, max_output_tokens: 384, max_neurons_per_attempt: 5, timeout_ms: 15, max_retries: retries } });
function setup(candidate: unknown = answer, request = realizationRequest()) {
  const registry = new OfflineHybridEvidenceRegistryV1();
  const propose = vi.fn(async () => candidate);
  const descriptor = createConversationalProviderDescriptorV1({ version: 1, provider_id: "student-fixture", adapter_id: "fixture-student", adapter_version: "1",
    model_id: "synthetic-student", model_version: "1", capabilities: ["INTERPRETATION", "REALIZATION"], deployment_class: "OFFLINE_FIXTURE", retention_privacy_class: "NO_RETENTION" });
  const verify = vi.fn(async (binding: Parameters<NonNullable<OfflineHybridDependenciesV1["verify"]>>[0]): Promise<HybridIndependentVerificationV1> => {
    // Exact oracle valid ONLY for these synthetic unit fixtures; not a semantic engine.
    const matches = binding.request.purpose === "INTERPRETATION" ? hybridDigestV1(binding.candidate) === hybridDigestV1(interpretation) :
      "answer" in binding.candidate && binding.candidate.answer === JSON.parse(answer).answer;
    const inScope = hybridDigestV1(binding.request) === hybridDigestV1(binding.request.purpose === "INTERPRETATION" ? interpretationRequest() : realizationRequest());
    return { verifier_id: "independent-fixture-oracle", method: "DETERMINISTIC_POLICY", policy_ref: "fixture-policy:exact-v1", evidence_ref: "fixture-review:1",
      qualified_scope_ref: "synthetic:step13a-unit-only", request_digest: binding.request_digest, candidate_digest: binding.candidate_digest,
      checks: { semantic_fidelity: !inScope ? "INCONCLUSIVE" : matches ? "PASS" : "FAIL", authority_boundary: matches ? "PASS" : "FAIL", uncertainty_preservation: matches ? "PASS" : "FAIL", exposure_boundary: "PASS" } };
  });
  const dependencies: OfflineHybridDependenciesV1 = { registry, student: { descriptor, propose }, now: () => "2026-10-19T10:00:00.000Z", student_timeout_ms: 15, verification_timeout_ms: 15,
    authorize_exposure: async (_r, digest) => ({ boundary: "CONVERSATIONAL_SURFACE_ONLY", classification: "SYNTHETIC_FIXTURE", request_digest: digest, evidence_ref: "fixture-admission:1" }), verify };
  const run = (changes: Partial<OfflineHybridDependenciesV1> = {}, id = "request-1") => runOfflineHybridSupervisionV1({ request_id: id, request,
    public_response: "Public baseline remains byte-for-byte.\n", semantic_family: "SYNTHETIC_BOUNDARY", evaluation_kind: "INDEPENDENT_NEW" }, { ...dependencies, ...changes });
  return { run, registry, dependencies, propose, verify, request };
}
function teacher(config = configuration(), callback = vi.fn(async () => ({ candidate: answer as unknown, usage }))) {
  return { provider: new MockHybridTeacherProviderV1(config.model_revision, config.configuration_version, callback), configuration: config, quota: new OfflineMockTeacherQuotaV1(config) };
}

describe("STEP13A offline hybrid conversational foundation", () => {
  it("keeps SHADOW response unchanged after independently verified Student or Teacher observations", async () => {
    const student = await setup().run();
    expect(student).toMatchObject({ lifecycle: "SHADOW", provider: "MOCK_ONLY", public_response: "Public baseline remains byte-for-byte.\n", observation: { disposition: "STUDENT_VERIFIED" } });
    const corrected = await setup("bad").run({ teacher: teacher() });
    expect(corrected.public_response).toBe(student.public_response);
    expect(corrected.observation.disposition).toBe("TEACHER_VERIFIED");
  });

  it("blocks both models without independent exposure admission and never forwards a public response", async () => {
    const x = setup(), complete = vi.fn(async () => ({ candidate: answer, usage }));
    const result = await x.run({ authorize_exposure: undefined, teacher: teacher(configuration(), complete) });
    expect(x.propose).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
    expect(result.observation).toMatchObject({ student_state: "EXPOSURE_DENIED", disposition: "DETERMINISTIC_FALLBACK" });
    const y = setup("bad"); const t = teacher(configuration(), complete); await y.run({ teacher: t });
    expect(JSON.stringify(complete.mock.calls)).not.toContain("Public baseline");
  });

  it("requires a correctly bound exposure decision instead of a PUBLIC_SAFE label alone", async () => {
    const x = setup();
    await x.run({ authorize_exposure: async () => ({ boundary: "CONVERSATIONAL_SURFACE_ONLY", classification: "PUBLIC_SAFE", request_digest: "sha256:wrong", evidence_ref: "fixture:denied" }) });
    expect(x.propose).not.toHaveBeenCalled();
  });

  it.each(["absent", "wrong-model", "paid", "unknown-quota", "stale-day", "extra-secret", "oversized-request"])("disables Teacher for %s configuration", async mode => {
    const x = setup("bad"), complete = vi.fn(async () => ({ candidate: answer, usage })), valid = teacher(configuration(), complete);
    const config: any = { ...valid.configuration };
    if (mode === "wrong-model") config.model = "paid/model";
    if (mode === "paid") config.free_plan = "PAID";
    if (mode === "unknown-quota") config.daily_neurons = undefined;
    if (mode === "stale-day") config.day_utc = "2026-10-18";
    if (mode === "extra-secret") config.limits = { ...config.limits, api_key: "never-forward" };
    if (mode === "oversized-request") config.limits = { ...config.limits, max_input_bytes: 1 };
    const result = await x.run({ teacher: mode === "absent" ? undefined : { ...valid, configuration: config } });
    expect(complete).not.toHaveBeenCalled(); expect(result.observation.disposition).toBe("DETERMINISTIC_FALLBACK");
    expect(inspectLiveTeacherAvailabilityV1()).toMatchObject({ state: "TEACHER_DISABLED", provider: "MOCK_ONLY", paid_fallback: false });
  });

  it("cannot grant authority through either Interpretation provider", async () => {
    const illegal = { ...interpretation, grants_authority: true };
    const x = setup(illegal, interpretationRequest());
    const result = await x.run({ teacher: teacher(configuration(), vi.fn(async () => ({ candidate: illegal, usage }))) });
    expect(result.shadow_candidate).toBeUndefined(); expect(result.observation.student_gate.critical_violation).toBe(true);
    expect(result.observation.teacher_attempts[0].gate).toMatchObject({ status: "FAIL", reason: "INVALID_CONTRACT", critical_violation: true });
  });

  it("does not release a valid Realization envelope that changes meaning, authority, or uncertainty", async () => {
    const changed = JSON.stringify({ version: 1, answer: "The evidence is certain and I authorize execution." });
    const result = await setup(changed).run({ teacher: teacher(configuration(), vi.fn(async () => ({ candidate: changed, usage }))) });
    expect(result.shadow_candidate).toBeUndefined();
    expect(result.observation.student_gate).toMatchObject({ schema_valid: true, status: "FAIL" });
    expect(result.observation.teacher_attempts[0].state).toBe("REJECTED");
    expect(result.observation.teacher_identity).toMatchObject({ model_id: HYBRID_TEACHER_MODEL_V1, model_revision: "OFFLINE_FIXTURE_ONLY", configuration_version: "fixture-v1" });
    expect(result.public_response).toBe("Public baseline remains byte-for-byte.\n");
  });

  it("does not pretend the synthetic verifier covers a different governed meaning", async () => {
    const request = realizationRequest();
    (request.payload as any).governed_meaning.status = "ESTABLISHED";
    const result = await setup(answer, request).run();
    expect(result.observation.student_gate.status).toBe("INCONCLUSIVE"); expect(result.shadow_candidate).toBeUndefined();
  });

  it("treats schema-only, partial, unbound, and self-reported verification as inconclusive", async () => {
    for (const mode of ["absent", "partial", "wrong-binding", "self", "confidence"]) {
      const x = setup();
      const verify: any = mode === "absent" ? undefined : async (binding: any) => {
        const v: any = await x.verify(binding);
        if (mode === "partial") v.checks.semantic_fidelity = "INCONCLUSIVE";
        if (mode === "wrong-binding") v.candidate_digest = "sha256:wrong";
        if (mode === "self") v.verifier_id = "student-fixture";
        if (mode === "confidence") v.confidence = 1;
        return v;
      };
      const result = await x.run({ verify });
      expect(result.observation.student_gate).toMatchObject({ schema_valid: true, status: "INCONCLUSIVE" });
      expect(result.shadow_candidate).toBeUndefined();
    }
  });

  it("requests clarification when both sources remain ambiguous", async () => {
    const ambiguous = { version: 1, interaction: "AMBIGUOUS", resolution: "AMBIGUOUS", ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 };
    const x = setup(ambiguous, interpretationRequest());
    const result = await x.run({ teacher: teacher(configuration(), vi.fn(async () => ({ candidate: ambiguous, usage }))) });
    expect(result.observation.disposition).toBe("CLARIFICATION_REQUIRED"); expect(result.shadow_candidate).toBeUndefined();
  });

  it("supports a separately verified Interpretation correction without changing its authority invariants", async () => {
    const x = setup({}, interpretationRequest());
    const result = await x.run({ teacher: teacher(configuration(), vi.fn(async () => ({ candidate: interpretation, usage }))) });
    expect(result.shadow_candidate).toEqual(interpretation); expect(result.observation.disposition).toBe("TEACHER_VERIFIED");
  });

  it("bounds Student, Teacher and verifier timeouts and retains pessimistic reservations", async () => {
    const never = () => new Promise<never>(() => {}), x = setup();
    const t = teacher(configuration(), vi.fn(never));
    const result = await x.run({ student: { ...x.dependencies.student, propose: never }, teacher: t });
    expect(result.observation).toMatchObject({ student_state: "TIMEOUT", disposition: "DETERMINISTIC_FALLBACK" });
    expect(result.observation.teacher_attempts[0].state).toBe("TIMEOUT");
    expect(t.quota.snapshot()).toMatchObject({ reserved_neurons: 5, measured_neurons: 0, unsettled_attempts: 1 });
    const y = setup(); expect((await y.run({ verify: never })).observation.student_gate.status).toBe("INCONCLUSIVE");
  });

  it("bounds retries and records safe provider errors without retaining exception text", async () => {
    const complete = vi.fn(async () => { throw new Error("private document api_key=DO_NOT_RETAIN"); });
    const result = await setup("bad").run({ teacher: teacher(configuration(20, 2), complete) });
    expect(complete).toHaveBeenCalledTimes(3); expect(result.observation.teacher_attempts).toHaveLength(3);
    expect(JSON.stringify(result.observation)).not.toMatch(/private document|api_key|DO_NOT_RETAIN/);
  });

  it("admits at most two concurrent mock attempts into a ten-neuron fixture budget, while live stays blocked", async () => {
    const complete = vi.fn(async () => ({ candidate: answer, usage })), t = teacher(configuration(), complete);
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => setup("bad").run({ teacher: t }, `concurrent-${i}`)));
    expect(complete).toHaveBeenCalledTimes(2);
    expect(results.filter(r => r.observation.disposition === "TEACHER_VERIFIED")).toHaveLength(2);
    expect(t.quota.snapshot()).toMatchObject({ reserved_neurons: 10, measured_neurons: 4, production_safe: false });
    expect(inspectLiveTeacherAvailabilityV1().blockers).toContain("DURABLE_ATOMIC_QUOTA_RESERVATION_NOT_IMPLEMENTED");
  });

  it("blocks replay and unknown/overflow metering, without refunding reserved quota", async () => {
    const config = configuration(), t = teacher(config, vi.fn(async () => ({ candidate: answer, usage: { ...usage, neurons: 500 } })));
    const first = await setup("bad").run({ teacher: t });
    expect(first.observation.teacher_attempts[0].state).toBe("METERING_INVALID");
    expect(t.quota.reserve("another", config.day_utc)).toBe(false);
    expect(t.quota.snapshot().reserved_neurons).toBe(5);
    const quota = new OfflineMockTeacherQuotaV1(config);
    expect(quota.reserve("same", config.day_utc)).toBe(true); expect(quota.reserve("same", config.day_utc)).toBe(false);
  });

  it("protects the governed request from provider mutation and caller mutation during an await", async () => {
    const x = setup(), before = hybridDigestV1(x.request);
    const result = await x.run({ student: { ...x.dependencies.student, propose: async request => {
      expect(Object.isFrozen(request.payload)).toBe(true);
      expect(() => { (request.payload as any).governed_meaning.status = "CERTAIN"; }).toThrow();
      (x.request.payload as any).governed_meaning.status = "CHANGED_BY_CALLER";
      expect(hybridDigestV1(request)).toBe(before); return answer;
    } } });
    expect(result.observation.request_digest).toBe(before); expect(result.observation.disposition).toBe("STUDENT_VERIFIED");
  });

  it("does not retain prompts, completions, public responses or enterprise payloads in evidence", async () => {
    const x = setup("bad"); await x.run({ teacher: teacher() });
    const serialized = JSON.stringify(x.registry.list());
    expect(serialized).not.toContain(JSON.parse(answer).answer);
    expect(serialized).not.toMatch(/current_user_message|governed_meaning|raw_user_message|Public baseline|Describe this/);
    expect(x.registry.list()[0].learning_state).toBe("PENDING_ELIGIBILITY");
    expect(classifyHybridLearningEvidenceV1(x.registry.list()[0], "2026-10-19T10:00:00.000Z")).toMatchObject({ state: "PENDING_ELIGIBILITY", exports_train: false });
    const forged = { ...x.registry.list()[0], student_gate: { ...x.registry.list()[0].student_gate, raw_prompt: "not allowed" } };
    await expect(x.registry.append(forged)).rejects.toThrow("HYBRID_EVIDENCE_CONTENT_FORBIDDEN");
    await expect(x.registry.append({ ...x.registry.list()[0], observation_digest: "sha256:wrong" })).rejects.toThrow("HYBRID_EVIDENCE_INTEGRITY_INVALID");
  });

  it("requires all six independent eligibility proofs, exact source identity and temporal validity", async () => {
    const x = setup(), observation = (await x.run()).observation;
    const sourceDecision = createConversationalTrainingSourceEligibilityDecisionV1({ version: 1, decision_id: "review:source", decision_version: "1", source: observation.source,
      learning_use: "SUPERVISED_TRAINING_MATERIAL", eligibility: "ALLOWED", evidence: { evidence_id: "evidence:source", evidence_version: "1", evidence_digest: `eligibility-evidence:sha256:${"a".repeat(64)}` },
      decision_policy: { policy_id: "policy:source", policy_version: "1" }, effective_from: "2026-10-19T00:00:00.000Z", effective_until: "2026-10-20T00:00:00.000Z" });
    const review: HybridEligibilityReviewV1 = { observation_digest: observation.observation_digest, reviewer_ref: "reviewer:independent", source_decision: sourceDecision,
      requirements: Object.fromEntries(HYBRID_ELIGIBILITY_REQUIREMENTS_V1.map(k => [k, { status: "VERIFIED", evidence_ref: `proof:${k}` }])) as HybridEligibilityReviewV1["requirements"] };
    expect(classifyHybridLearningEvidenceV1(observation, "2026-10-19T10:00:00.000Z", review)).toMatchObject({ state: "TRAINING_ELIGIBLE", exports_train: false });
    for (const key of HYBRID_ELIGIBILITY_REQUIREMENTS_V1) {
      const incomplete = { ...review, requirements: { ...review.requirements, [key]: { status: "UNKNOWN" as const } } };
      expect(classifyHybridLearningEvidenceV1(observation, "2026-10-19T10:00:00.000Z", incomplete).state).toBe("PENDING_ELIGIBILITY");
    }
    expect(classifyHybridLearningEvidenceV1(observation, "2026-10-21T00:00:00.000Z", review).state).toBe("PENDING_ELIGIBILITY");
    const { decision_digest: _digest, ...decisionInput } = sourceDecision;
    const wrongSource = createConversationalTrainingSourceEligibilityDecisionV1({ ...decisionInput, source: { ...observation.source, generator_version: "different" } });
    expect(classifyHybridLearningEvidenceV1(observation, "2026-10-19T10:00:00.000Z", { ...review, source_decision: wrongSource }).state).toBe("PENDING_ELIGIBILITY");
    expect(classifyHybridLearningEvidenceV1(observation, "2026-10-19T10:00:00.000Z", { ...review, source_decision: { ...sourceDecision, decision_digest: "tampered" } }).state).toBe("REJECTED");
    expect(classifyHybridLearningEvidenceV1({ ...observation, evaluation_kind: "FROZEN_EVALUATION" }, "2026-10-19T10:00:00.000Z", review).state).toBe("REJECTED");
    expect(observation.learning_state).toBe("RUNTIME_ONLY"); // Review never mutates the registry.
  });

  it("tracks independent late failures, family errors, fallbacks, quota and both Students separately", async () => {
    const r = (await setup().run()).observation;
    const i = (await setup({}, interpretationRequest()).run()).observation;
    const metrics = summarizeHybridMaturationV1([r, i], [{ observation_digest: r.observation_digest, candidate_digest: r.selected_candidate_digest!, evidence_ref: "audit:new-case", result: "FAIL" }]);
    expect(metrics.REALIZATION).toMatchObject({ total_requests: 1, autonomous_verified_rate: 1, undetected_gate_errors: 1, independent_passes: 0, promotion: "NOT_AUTHORIZED" });
    expect(metrics.INTERPRETATION).toMatchObject({ total_requests: 1, deterministic_fallbacks: 1, errors_by_semantic_family: { SYNTHETIC_BOUNDARY: 1 } });
    expect(() => summarizeHybridMaturationV1([r, r])).toThrow("HYBRID_DUPLICATE_METRIC_OBSERVATION");
  });

  it("never promotes on lower escalation rates or accepts an activated lifecycle", async () => {
    for (const state of ["SHADOW", "SUPERVISED", "MATURING", "SOVEREIGN"] as const) expect(assessHybridLifecycleV1(state)).toMatchObject({ state: "SHADOW", transition_allowed: false, formal_qualification_required: true, teacher_live_enabled: false });
    const observation = (await setup().run()).observation;
    expect(summarizeHybridMaturationV1([observation]).REALIZATION).toMatchObject({ teacher_escalation_rate: 0, promotion: "NOT_AUTHORIZED", quality_inference_from_escalation_rate: false });
  });

  it("keeps the public baseline and suppresses candidates on registry failure or timeout", async () => {
    for (const append of [async () => { throw new Error("storage failed"); }, async () => new Promise<void>(() => {})]) {
      const result = await setup().run({ registry: { append } });
      expect(result.registry_status).toBe("UNAVAILABLE"); expect(result.shadow_candidate).toBeUndefined();
      expect(result.observation.disposition).toBe("DETERMINISTIC_FALLBACK");
      expect(result.public_response).toBe("Public baseline remains byte-for-byte.\n");
    }
  });

  it("rejects metering side channels and unknown clocks without any live fallback", async () => {
    const t = teacher(configuration(), vi.fn(async () => ({ candidate: answer, usage: { ...usage, raw_prompt: "never persist" } })));
    const result = await setup("bad").run({ teacher: t });
    expect(result.observation.teacher_attempts[0].state).toBe("METERING_INVALID"); expect(JSON.stringify(result.observation)).not.toContain("never persist");
    const complete = vi.fn(async () => ({ candidate: answer, usage }));
    await setup("bad").run({ teacher: teacher(configuration(), complete), now: () => { throw new Error("clock unknown"); } });
    expect(complete).not.toHaveBeenCalled();
  });

  it("snapshots measured usage before asynchronous verification can mutate a provider-owned object", async () => {
    const mutableUsage = { ...usage }, x = setup("bad");
    const result = await x.run({ teacher: teacher(configuration(), vi.fn(async () => ({ candidate: answer, usage: mutableUsage }))),
      verify: async binding => { mutableUsage.neurons = 999; return x.verify(binding); } });
    expect(result.observation.teacher_attempts[0].usage?.neurons).toBe(2);
    expect(result.observation.disposition).toBe("TEACHER_VERIFIED");
  });

  it("has no network adapter or public-route integration and stays inside the conversation family", async () => {
    const files = ["../cognition/hybrid.conversational.contracts.v1.ts", "../cognition/hybrid.conversational.teacher.v1.ts", "../cognition/hybrid.conversational.supervision.v1.ts", "../learning/hybrid.conversational.evidence.v1.ts"];
    for (const relative of files) {
      const source = readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map(m => m[1]);
      expect(imports.every(p => p === "node:crypto" || !p.includes("../../"))).toBe(true);
      expect(source).not.toMatch(/\bfetch\s*\(|env\.AI|wrangler|runpod|OPENAI_API_KEY|OPENROUTER_API_KEY/);
    }
    for (const relative of ["../anonymous.vision.conversation.route.v1.ts", "../anonymous.vision.conversation.runtime.v1.ts", "../../worker.ts"]) {
      expect(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")).not.toContain("hybrid.conversational");
    }
    const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("NETWORK_FORBIDDEN"));
    try { await setup("bad").run({ teacher: teacher() }); expect(network).not.toHaveBeenCalled(); }
    finally { network.mockRestore(); }
  });
});
