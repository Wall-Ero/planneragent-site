import { describe, expect, expectTypeOf, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { createCanonicalDecisionPressureDimensionV1, type CanonicalDecisionPressureDimensionIdentityV1 } from "../canonical.decision.pressure.dimension.v1";
import { createCanonicalDecisionPressureProducerCertificationV1, ordinalVocabularyForDimensionV1,
  type CanonicalDecisionPressureProjectionModeV1 } from "../canonical.decision.pressure.normalization.policy.v1";

const times = { evidence_as_of: "2026-08-13T10:00:00Z", evaluated_at: "2026-08-13T10:01:00Z" };
type ScopeKind = "REQUEST_DATASET" | "ENTITY" | "PATH";

async function binding(scope_type: ScopeKind = "ENTITY", domain = "operations") {
  const common = { version: 1 as const, scope_type, request_id: "request:1", company_id: "company:1",
    domain, evidence_selection_ref: "selection:1", source_snapshot_ref: "snapshot:1" };
  const scoped = scope_type === "ENTITY" ? { ...common, entity: { entity_type: "SKU" as const, entity_ref: "sku:1" } }
    : scope_type === "PATH" ? { ...common, path: { subgraph_ref: "path:1", seed_refs: ["subject:1"] } } : common;
  const scope = await createOperationalSignalEvaluationScopeV1(scoped);
  return bindOperationalSignalsToScopeV1({ scope, request_id: "request:1", company_id: "company:1", ...times });
}

async function certification(dimension: CanonicalDecisionPressureDimensionIdentityV1, mode: CanonicalDecisionPressureProjectionModeV1,
  domain = "operations", scopes: ScopeKind[] = ["REQUEST_DATASET", "ENTITY", "PATH"]) {
  const base = { version: 1 as const, dimension, producer_id: `producer:${domain}-${dimension.toLowerCase()}`,
    producer_version: "1", normalization_policy_id: `normalization-policy:${dimension.toLowerCase()}`,
    normalization_policy_version: "1", domain_profile_id: `domain-profile:${domain}`, domain_profile_version: "1",
    supported_scope_kinds: scopes, endpoint_semantics: "CANONICAL_PRESSURE_DIMENSION_ENDPOINTS_V1" as const,
    monotonicity: "NON_DECREASING_CANONICAL_MAGNITUDE" as const,
    reference_basis_semantics: `governing scoped ${dimension.toLowerCase()} basis`,
    evidence_requirement_refs: ["requirement:evidence"], qualification_requirement_refs: ["requirement:qualification"],
    composition_restriction: "DOMAIN_SCOPED_PROJECTION_NO_GENERIC_CHILD_COMPOSITION" as const,
    provenance_required: true as const, causal_lineage_required: true as const };
  return mode === "CONTINUOUS"
    ? createCanonicalDecisionPressureProducerCertificationV1({ ...base, projection_mode: mode,
      precision_policy: { kind: "DECIMAL_PLACES", decimal_places: 2 } })
    : createCanonicalDecisionPressureProducerCertificationV1({ ...base, projection_mode: mode,
      ordinal_vocabulary: ordinalVocabularyForDimensionV1(dimension) });
}

async function continuous(dimension: CanonicalDecisionPressureDimensionIdentityV1 = "IMPACT", value = 0.5,
  scope_type: ScopeKind = "ENTITY", domain = "operations") {
  return { version: 1 as const, dimension, projection_mode: "CONTINUOUS" as const, value,
    request_id: "request:1", company_id: "company:1", evaluation_scope: await binding(scope_type, domain), ...times,
    producer_certification: await certification(dimension, "CONTINUOUS", domain),
    numerator_ref: "normalization-input:numerator", denominator_ref: "normalization-input:denominator",
    precision_decimal_places: 2, normalization_input_refs: ["normalization-input:1"], evidence_refs: ["evidence:1"],
    provenance_refs: ["provenance:source-neutral"], causal_lineage_refs: ["lineage:1"],
    qualification_refs: ["qualification:1"],
    ...(dimension === "URGENCY" ? { decision_opportunity_status: "USEFUL_DECISION_REMAINS" as const } : {}) };
}

async function ordinal(dimension: CanonicalDecisionPressureDimensionIdentityV1, ordinal_state: string,
  scope_type: ScopeKind = "ENTITY", domain = "operations") {
  return { version: 1 as const, dimension, projection_mode: "ORDINAL" as const, ordinal_state: ordinal_state as any,
    request_id: "request:1", company_id: "company:1", evaluation_scope: await binding(scope_type, domain), ...times,
    producer_certification: await certification(dimension, "ORDINAL", domain),
    normalization_input_refs: ["normalization-input:1"], evidence_refs: ["evidence:1"],
    provenance_refs: ["provenance:source-neutral"], causal_lineage_refs: ["lineage:1"], qualification_refs: ["qualification:1"],
    ...(dimension === "URGENCY" ? { decision_opportunity_status: "USEFUL_DECISION_REMAINS" as const } : {}) };
}

describe("PRESSURE-V1-DIMENSION-NORMALIZATION-ANCHORS-WU1", () => {
  it.each(["IMPACT", "URGENCY", "COST_OF_WAITING"] as const)("represents continuous endpoints for %s", async dimension => {
    await expect(createCanonicalDecisionPressureDimensionV1(await continuous(dimension, 0))).resolves.toMatchObject({ value: 0 });
    await expect(createCanonicalDecisionPressureDimensionV1(await continuous(dimension, 1))).resolves.toMatchObject({ value: 1 });
  });

  it.each([["IMPACT","LOW"],["IMPACT","MODERATE"],["IMPACT","HIGH"],["IMPACT","CRITICAL"],
    ["URGENCY","LOW"],["URGENCY","MODERATE"],["URGENCY","HIGH"],["URGENCY","CRITICAL"],
    ["COST_OF_WAITING","NEGLIGIBLE"],["COST_OF_WAITING","LIMITED"],["COST_OF_WAITING","MATERIAL"],["COST_OF_WAITING","SEVERE"]] as const)
  ("preserves canonical ordinal anchor %s/%s without a number", async (dimension, state) => {
    const value = await createCanonicalDecisionPressureDimensionV1(await ordinal(dimension, state));
    expect(value).toMatchObject({ projection_mode: "ORDINAL", ordinal_state: state }); expect(value).not.toHaveProperty("value");
  });

  it("keeps ordinal and continuous projections distinct", async () => {
    const c = await createCanonicalDecisionPressureDimensionV1(await continuous());
    const o = await createCanonicalDecisionPressureDimensionV1(await ordinal("IMPACT", "MODERATE"));
    expect(c.projection_mode).toBe("CONTINUOUS"); expect(o.projection_mode).toBe("ORDINAL"); expect(c.dimension_digest).not.toBe(o.dimension_digest);
  });

  it("distinguishes missing value from grounded continuous zero", async () => {
    const zero = await createCanonicalDecisionPressureDimensionV1(await continuous("IMPACT", 0)); expect(zero.value).toBe(0);
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await continuous(), value: undefined } as any))
      .rejects.toThrow("PRESSURE_DIMENSION_VALUE_INVALID");
  });

  it("forbids fabricated numeric anchors on ordinal projections", async () => {
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await ordinal("IMPACT", "HIGH"), value: 0.75 } as any))
      .rejects.toThrow("PRESSURE_ORDINAL_NUMERIC_VALUE_FORBIDDEN");
  });

  it("requires certified reference basis and precision for continuous projections", async () => {
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await continuous(), numerator_ref: "" }))
      .rejects.toThrow("PRESSURE_DIMENSION_NUMERATOR_REQUIRED");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await continuous(), precision_decimal_places: 3 }))
      .rejects.toThrow("PRESSURE_DIMENSION_PRECISION_POLICY_MISMATCH");
  });

  it("rejects precision exceeding the certified decimal policy", async () => {
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await continuous(), value: 0.555 }))
      .rejects.toThrow("PRESSURE_DIMENSION_PRECISION_INVALID");
  });

  it("binds producer and normalization-policy identity into deterministic identity", async () => {
    const base = await continuous(), a = await createCanonicalDecisionPressureDimensionV1(base);
    const changedProducer = await certification("IMPACT", "CONTINUOUS", "finance");
    const b = await createCanonicalDecisionPressureDimensionV1({ ...base, producer_certification: changedProducer });
    expect(a.dimension_digest).not.toBe(b.dimension_digest);
    const changedPolicy = await createCanonicalDecisionPressureProducerCertificationV1({ ...base.producer_certification,
      normalization_policy_id: "normalization-policy:impact-v2" } as any);
    const c = await createCanonicalDecisionPressureDimensionV1({ ...base, producer_certification: changedPolicy });
    expect(a.dimension_digest).not.toBe(c.dimension_digest);
  });

  it("fails closed on request, company, scope digest, and evidence time substitution", async () => {
    const base = await continuous();
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base, request_id: "request:other" })).rejects.toThrow("SCOPE_REQUEST_MISMATCH");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base, company_id: "company:other" })).rejects.toThrow("SCOPE_COMPANY_MISMATCH");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base, evidence_as_of: "2026-08-13T09:00:00Z" })).rejects.toThrow("PRESSURE_DIMENSION_TIME_BINDING_MISMATCH");
    const forged = { ...base, evaluation_scope: { ...base.evaluation_scope, scope: { ...base.evaluation_scope.scope, scope_digest: "0".repeat(64) } } };
    await expect(createCanonicalDecisionPressureDimensionV1(forged)).rejects.toThrow("SCOPE_DIGEST_MISMATCH");
  });

  it.each(["operations", "project-management", "finance"])("certifies cross-domain universal shape for %s", async domain => {
    const value = await createCanonicalDecisionPressureDimensionV1(await continuous("IMPACT", 0.5, "REQUEST_DATASET", domain));
    expect(value.dimension).toBe("IMPACT"); expect(value.producer_certification.domain_profile_id).toBe(`domain-profile:${domain}`);
    expect(JSON.stringify(value)).not.toMatch(/inventory|milestone|cash|ERP|MES|SAP|email|chat|telephone/i);
  });

  it.each(["ENTITY", "PATH", "REQUEST_DATASET"] as const)("binds normalization locally to %s", async scope_type => {
    const value = await createCanonicalDecisionPressureDimensionV1(await continuous("IMPACT", 0.5, scope_type));
    expect(value.evaluation_scope.scope.scope_type).toBe(scope_type);
  });

  it("requires explicit certification for each supported scope", async () => {
    const base = await continuous("IMPACT", 0.5, "PATH");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base,
      producer_certification: await certification("IMPACT", "CONTINUOUS", "operations", ["ENTITY"]) }))
      .rejects.toThrow("PRESSURE_DIMENSION_SCOPE_NOT_CERTIFIED");
  });

  it.each(["max", "sum", "average", "child_values"])("introduces no generic %s composition", async shortcut => {
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await continuous(), [shortcut]: [] } as any))
      .rejects.toThrow("PRESSURE_DIMENSION_UNSUPPORTED_SHORTCUT");
  });

  it("does not represent an expired opportunity as maximal current Urgency", async () => {
    const base = await ordinal("URGENCY", "CRITICAL");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base, decision_opportunity_status: undefined } as any))
      .rejects.toThrow("PRESSURE_URGENCY_USEFUL_DECISION_REQUIRED");
  });

  it("keeps Cost of Waiting distinct from Impact and Urgency", async () => {
    const impact = await createCanonicalDecisionPressureDimensionV1(await ordinal("IMPACT", "HIGH"));
    const urgency = await createCanonicalDecisionPressureDimensionV1(await ordinal("URGENCY", "HIGH"));
    const cost = await createCanonicalDecisionPressureDimensionV1(await ordinal("COST_OF_WAITING", "MATERIAL"));
    expect(new Set([impact.dimension_digest, urgency.dimension_digest, cost.dimension_digest]).size).toBe(3);
  });

  it.each(["reversibilityScore", "irreversibility", "novelty", "responsibility", "plan_state", "reality_state"])
  ("rejects historical or non-canonical shortcut %s", async shortcut => {
    await expect(createCanonicalDecisionPressureDimensionV1({ ...await continuous("COST_OF_WAITING"), [shortcut]: 0.2 } as any))
      .rejects.toThrow("PRESSURE_DIMENSION_UNSUPPORTED_SHORTCUT");
  });

  it("is recursively immutable and deterministic", async () => {
    const a = await createCanonicalDecisionPressureDimensionV1(await ordinal("IMPACT", "MODERATE"));
    const b = await createCanonicalDecisionPressureDimensionV1(await ordinal("IMPACT", "MODERATE"));
    expect(a).toEqual(b); expect(Object.isFrozen(a) && Object.isFrozen(a.producer_certification) && Object.isFrozen(a.evidence_refs)).toBe(true);
  });

  it("exposes only the frozen identities and projection modes", () => {
    expectTypeOf<CanonicalDecisionPressureDimensionIdentityV1>().toEqualTypeOf<"IMPACT" | "URGENCY" | "COST_OF_WAITING">();
    expectTypeOf<CanonicalDecisionPressureProjectionModeV1>().toEqualTypeOf<"CONTINUOUS" | "ORDINAL">();
  });
});
