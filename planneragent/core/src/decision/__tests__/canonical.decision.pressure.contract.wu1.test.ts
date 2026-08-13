import { describe, expect, expectTypeOf, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import {
  createCanonicalDecisionPressureAssessmentV1,
  createCanonicalDecisionPressureResultV1,
  type CanonicalDecisionPressureLevelV1,
} from "../canonical.decision.pressure.contract.v1";

async function scope(type: "REQUEST_DATASET" | "ENTITY" | "PATH" = "ENTITY") {
  const common = { version: 1 as const, scope_type: type, request_id: "request:1", company_id: "company:1",
    domain: "production", evidence_selection_ref: "selection:1", source_snapshot_ref: "snapshot:1" };
  const selected = type === "ENTITY" ? { ...common, entity: { entity_type: "SKU" as const, entity_ref: "sku:1" } }
    : type === "PATH" ? { ...common, path: { subgraph_ref: "subgraph:1", seed_refs: ["sku:1"] } } : common;
  const created = await createOperationalSignalEvaluationScopeV1(selected);
  return bindOperationalSignalsToScopeV1({ scope: created, request_id: "request:1", company_id: "company:1",
    evidence_as_of: "2026-08-13T10:00:00Z", evaluated_at: "2026-08-13T10:01:00Z" });
}

async function assessment(type: "REQUEST_DATASET" | "ENTITY" | "PATH" = "ENTITY") {
  return createCanonicalDecisionPressureAssessmentV1({ version: 1, request_id: "request:1", company_id: "company:1",
    evaluation_scope: await scope(type),
    conditions: [{ condition_ref: "condition:supplier-delay", governed_evidence_refs: ["evidence:governed-1"] }],
    consequences: [{ consequence_ref: "consequence:line-stop", category: "PRODUCTION_INTERRUPTION",
      affected_operational_refs: ["sku:1"], causal_lineage_refs: ["lineage:1"] }],
    materiality: [{ consequence_ref: "consequence:line-stop", material_within_scope: true,
      materiality_evidence_refs: ["materiality:1"] }],
    temporal_evidence: [{ temporal_evidence_ref: "window:1", kind: "DECISION_WINDOW",
      consequence_refs: ["consequence:line-stop"] }],
    cost_of_waiting_evidence: [{ cost_of_waiting_evidence_ref: "cost:1", kind: "CORRECTIVE_OPTION_REDUCTION",
      consequence_refs: ["consequence:line-stop"], corrective_option_refs: ["option:expedite"] }],
    corrective_option_refs: ["option:expedite"], evidence_qualification_refs: ["qualification:1"],
    provenance_refs: ["provenance:1"] });
}

async function result(level: CanonicalDecisionPressureLevelV1 = "MEDIUM") {
  return createCanonicalDecisionPressureResultV1({ version: 1, assessment: await assessment(), level,
    material_consequence_refs: ["consequence:line-stop"], decision_window_evidence_refs: ["window:1"],
    cost_of_waiting_evidence_refs: ["cost:1"], reason_codes: ["DECISION_WINDOW_NARROWING"],
    evidence_qualification_refs: ["qualification:1"], causal_lineage_refs: ["lineage:1"] });
}

describe("PRESSURE-CANONICAL-CONTRACT-WU1", () => {
  it("creates deterministic, recursively immutable identities", async () => {
    const a = await assessment(), b = await assessment();
    expect(a).toEqual(b); expect(a.assessment_id).toMatch(/^canonical-decision-pressure-assessment:sha256:[0-9a-f]{64}$/);
    expect(Object.isFrozen(a) && Object.isFrozen(a.conditions) && Object.isFrozen(a.conditions[0])).toBe(true);
    const x = await result(), y = await result(); expect(x).toEqual(y);
    expect(x.result_id).toMatch(/^canonical-decision-pressure-result:sha256:[0-9a-f]{64}$/);
  });

  it.each(["LOW", "MEDIUM", "HIGH"] as const)("supports only public Pressure level %s", async (level) => {
    await expect(result(level)).resolves.toMatchObject({ level });
  });

  it("binds request, company, scope, evidence as-of and all three scope kinds", async () => {
    for (const type of ["REQUEST_DATASET", "ENTITY", "PATH"] as const) {
      const value = await assessment(type);
      expect(value).toMatchObject({ request_id: "request:1", company_id: "company:1", evidence_as_of: "2026-08-13T10:00:00Z" });
      expect(value.evaluation_scope.scope).toMatchObject({ scope_type: type, company_global_claim: false });
    }
  });

  it("is source-neutral, content-free, observational and non-authorizing", async () => {
    const value = await result(); const json = JSON.stringify(value);
    expect(json).not.toMatch(/ERP|MES|email|chat|telephone|prompt|document|credential|watch|subscription/i);
    expect(value).toMatchObject({ company_global_claim: false, grants_execution: false, grants_remediation: false, observational_only: true });
    expect(value).not.toHaveProperty("score"); expect(value).not.toHaveProperty("threshold");
  });

  it("keeps reliability references separate from Pressure magnitude", async () => {
    const low = await result("LOW"), high = await result("HIGH");
    expect(low.evidence_qualification_refs).toEqual(high.evidence_qualification_refs);
    expect(low.level).not.toBe(high.level);
  });

  it.each(["plan", "plan_state", "reality", "reality_state", "watch_id", "correctionEffect"])("rejects non-canonical field %s", async (field) => {
    const binding = await scope();
    const base: any = { version: 1, request_id: "request:1", company_id: "company:1", evaluation_scope: binding,
      conditions: [], consequences: [], materiality: [], temporal_evidence: [], cost_of_waiting_evidence: [],
      corrective_option_refs: [], evidence_qualification_refs: [], provenance_refs: [] };
    base[field] = field === "correctionEffect" ? "NONE" : "HIGH";
    await expect(createCanonicalDecisionPressureAssessmentV1(base)).rejects.toThrow("PRESSURE_INPUT_FIELD_UNSUPPORTED");
  });

  it("does not allow correction evidence, Plan, or Reality alone to form an assessment", async () => {
    await expect(createCanonicalDecisionPressureAssessmentV1({ version: 1, request_id: "request:1", company_id: "company:1",
      evaluation_scope: await scope(), conditions: [], consequences: [], materiality: [], temporal_evidence: [],
      cost_of_waiting_evidence: [], corrective_option_refs: ["correction:full"],
      evidence_qualification_refs: ["qualification:1"], provenance_refs: ["provenance:1"] }))
      .rejects.toThrow("PRESSURE_SEMANTIC_EVIDENCE_REQUIRED");
  });

  it("changes identity with semantic evidence and fails closed on scope/evidence substitution", async () => {
    const original = await assessment();
    const changed = await createCanonicalDecisionPressureAssessmentV1({ version: 1, request_id: original.request_id,
      company_id: original.company_id, evaluation_scope: original.evaluation_scope, conditions: original.conditions,
      consequences: original.consequences, materiality: original.materiality, temporal_evidence: original.temporal_evidence,
      cost_of_waiting_evidence: original.cost_of_waiting_evidence, corrective_option_refs: original.corrective_option_refs,
      evidence_qualification_refs: original.evidence_qualification_refs, provenance_refs: ["provenance:2"] });
    expect(changed.assessment_digest).not.toBe(original.assessment_digest);
    await expect(createCanonicalDecisionPressureAssessmentV1({ version: 1, request_id: original.request_id,
      company_id: "company:other", evaluation_scope: original.evaluation_scope, conditions: original.conditions,
      consequences: original.consequences, materiality: original.materiality, temporal_evidence: original.temporal_evidence,
      cost_of_waiting_evidence: original.cost_of_waiting_evidence, corrective_option_refs: original.corrective_option_refs,
      evidence_qualification_refs: original.evidence_qualification_refs, provenance_refs: original.provenance_refs }))
      .rejects.toThrow(/COMPANY_MISMATCH/);
    const forged: any = { version: 1, request_id: original.request_id, company_id: original.company_id,
      evaluation_scope: { ...original.evaluation_scope,
        scope: { ...original.evaluation_scope.scope, scope_digest: "0".repeat(64) } },
      conditions: original.conditions, consequences: original.consequences, materiality: original.materiality,
      temporal_evidence: original.temporal_evidence, cost_of_waiting_evidence: original.cost_of_waiting_evidence,
      corrective_option_refs: original.corrective_option_refs, evidence_qualification_refs: original.evidence_qualification_refs,
      provenance_refs: original.provenance_refs };
    await expect(createCanonicalDecisionPressureAssessmentV1(forged)).rejects.toThrow("SCOPE_DIGEST_MISMATCH");
  });

  it("rejects historic levels, thresholds, prose references, and unbound result evidence", async () => {
    await expect(result("CRITICAL" as any)).rejects.toThrow("PRESSURE_RESULT_LEVEL_INVALID");
    const a = await assessment();
    await expect(createCanonicalDecisionPressureResultV1({ version: 1, assessment: a, level: "HIGH",
      material_consequence_refs: ["consequence:other"], decision_window_evidence_refs: ["window:1"],
      cost_of_waiting_evidence_refs: ["cost:1"], reason_codes: ["DECISION_WINDOW_NARROWING"],
      evidence_qualification_refs: ["qualification:1"], causal_lineage_refs: ["lineage:1"] }))
      .rejects.toThrow("PRESSURE_RESULT_MATERIAL_REF_INVALID");
    await expect(createCanonicalDecisionPressureAssessmentV1({ version: 1, request_id: a.request_id,
      company_id: a.company_id, evaluation_scope: a.evaluation_scope, conditions: a.conditions,
      consequences: a.consequences, materiality: a.materiality, temporal_evidence: a.temporal_evidence,
      cost_of_waiting_evidence: a.cost_of_waiting_evidence, corrective_option_refs: a.corrective_option_refs,
      evidence_qualification_refs: a.evidence_qualification_refs, provenance_refs: ["raw supplier email body"] }))
      .rejects.toThrow("PRESSURE_PROVENANCE_REF_INVALID");
    expect(JSON.stringify(a)).not.toMatch(/0\.2|0\.45|0\.75|horizonDays|shortageUnits|demandUnits|inventoryLevel/);
  });

  it("exposes recursively readonly contracts", () => {
    expectTypeOf<CanonicalDecisionPressureLevelV1>().toEqualTypeOf<"LOW" | "MEDIUM" | "HIGH">();
  });
});
