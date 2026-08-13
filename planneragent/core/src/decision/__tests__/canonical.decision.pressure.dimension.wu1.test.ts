import { describe, expect, expectTypeOf, it } from "vitest";
import {
  bindOperationalSignalsToScopeV1,
  createOperationalSignalEvaluationScopeV1,
} from "../../cockpit/operational.signal.evaluation.scope.v1";
import {
  createCanonicalDecisionPressureDimensionV1,
  type CanonicalDecisionPressureDimensionIdentityV1,
  type CanonicalDecisionPressureDimensionInputV1,
} from "../canonical.decision.pressure.dimension.v1";

async function binding(domain = "production") {
  const scope = await createOperationalSignalEvaluationScopeV1({
    version: 1, scope_type: "ENTITY", request_id: "request:1", company_id: "company:1",
    domain, evidence_selection_ref: "selection:1", source_snapshot_ref: "snapshot:1",
    entity: { entity_type: "SKU", entity_ref: "subject:1" },
  });
  return bindOperationalSignalsToScopeV1({
    scope, request_id: "request:1", company_id: "company:1",
    evidence_as_of: "2026-08-13T10:00:00Z", evaluated_at: "2026-08-13T10:01:00Z",
  });
}

async function input(
  dimension: CanonicalDecisionPressureDimensionIdentityV1 = "IMPACT",
  value = 0.5,
  domain = "production",
): Promise<CanonicalDecisionPressureDimensionInputV1> {
  return {
    version: 1, dimension, value, request_id: "request:1", company_id: "company:1",
    evaluation_scope: await binding(domain), evidence_as_of: "2026-08-13T10:00:00Z",
    evaluated_at: "2026-08-13T10:01:00Z", producer_id: `producer:${dimension.toLowerCase()}`,
    producer_version: "1", evidence_refs: ["evidence:1"], provenance_refs: ["provenance:connector-agnostic"],
    causal_lineage_refs: ["lineage:1"], qualification_refs: ["qualification:1"],
  };
}

describe("PRESSURE-V1-INPUT-BINDING-WU1", () => {
  it.each([0, 1])("accepts normalized boundary value %s", async (value) => {
    await expect(createCanonicalDecisionPressureDimensionV1(await input("IMPACT", value)))
      .resolves.toMatchObject({ dimension: "IMPACT", value });
  });

  it.each([-0.001, 1.001, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])
  ("rejects invalid normalized value %s", async (value) => {
    await expect(createCanonicalDecisionPressureDimensionV1(await input("IMPACT", value)))
      .rejects.toThrow("PRESSURE_DIMENSION_VALUE_INVALID");
  });

  it.each(["IMPACT", "URGENCY", "COST_OF_WAITING"] as const)
  ("supports exact canonical dimension %s independently", async (dimension) => {
    const value = await createCanonicalDecisionPressureDimensionV1(await input(dimension));
    expect(value.dimension).toBe(dimension);
    expect(value.producer_id).toBe(`producer:${dimension.toLowerCase()}`);
  });

  it.each(["NOVELTY", "RESPONSIBILITY", "PLAN_QUALITY", "REALITY", "WATCH_STATE"])
  ("rejects non-canonical dimension %s", async (dimension) => {
    await expect(createCanonicalDecisionPressureDimensionV1(
      await input(dimension as CanonicalDecisionPressureDimensionIdentityV1),
    )).rejects.toThrow("PRESSURE_DIMENSION_IDENTITY_INVALID");
  });

  it("binds request, company, exact scope digest, and scope timestamps", async () => {
    const base = await input();
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base, request_id: "request:other" }))
      .rejects.toThrow("SCOPE_REQUEST_MISMATCH");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base, company_id: "company:other" }))
      .rejects.toThrow("SCOPE_COMPANY_MISMATCH");
    await expect(createCanonicalDecisionPressureDimensionV1({ ...base,
      evidence_as_of: "2026-08-13T09:59:00Z" })).rejects.toThrow("PRESSURE_DIMENSION_TIME_BINDING_MISMATCH");
    const forged = { ...base, evaluation_scope: { ...base.evaluation_scope,
      scope: { ...base.evaluation_scope.scope, scope_digest: "0".repeat(64) } } };
    await expect(createCanonicalDecisionPressureDimensionV1(forged))
      .rejects.toThrow("SCOPE_DIGEST_MISMATCH");
  });

  it("has deterministic identity and recursive immutability", async () => {
    const a = await createCanonicalDecisionPressureDimensionV1(await input());
    const b = await createCanonicalDecisionPressureDimensionV1(await input());
    expect(a).toEqual(b);
    expect(a.dimension_id).toMatch(/^canonical-decision-pressure-dimension:sha256:[0-9a-f]{64}$/);
    expect(Object.isFrozen(a) && Object.isFrozen(a.evidence_refs) && Object.isFrozen(a.evaluation_scope.scope))
      .toBe(true);
  });

  it.each(["production", "project-management", "finance"])
  ("keeps the artifact domain- and source-neutral for %s", async (domain) => {
    const value = await createCanonicalDecisionPressureDimensionV1(await input("IMPACT", 0.5, domain));
    expect(value.dimension).toBe("IMPACT");
    expect(JSON.stringify(value)).not.toMatch(/ERP|MES|SAP|email|chat|telephone|document|API/i);
    expect(value).toMatchObject({ company_global_claim: false, grants_execution: false,
      grants_authority: false, grants_remediation: false, observational_only: true });
  });

  it("requires governed evidence, provenance, lineage, and qualification", async () => {
    const base = await input();
    for (const field of ["evidence_refs", "provenance_refs", "causal_lineage_refs", "qualification_refs"] as const) {
      await expect(createCanonicalDecisionPressureDimensionV1({ ...base, [field]: [] }))
        .rejects.toThrow();
    }
  });

  it("exposes only the frozen dimension identity union", () => {
    expectTypeOf<CanonicalDecisionPressureDimensionIdentityV1>()
      .toEqualTypeOf<"IMPACT" | "URGENCY" | "COST_OF_WAITING">();
  });
});
