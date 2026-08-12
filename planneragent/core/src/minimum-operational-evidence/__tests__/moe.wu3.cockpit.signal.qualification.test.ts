import { describe, expect, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { evaluateCapabilityMinimumEvidenceV1, qualifyCockpitSignalEvidenceV1, type OperationalEvidenceKindV1 } from "..";

async function scope(kind: "REQUEST_DATASET" | "ENTITY" = "REQUEST_DATASET") {
  const s = await createOperationalSignalEvaluationScopeV1({ version: 1, scope_type: kind, request_id: "request:1", company_id: "company:1",
    domain: "supply_chain", evidence_selection_ref: `selection:${kind}`, source_snapshot_ref: "snapshot:1",
    ...(kind === "ENTITY" ? { entity: { entity_type: "SKU" as const, entity_ref: "sku:1" } } : {}) });
  return bindOperationalSignalsToScopeV1({ scope: s, request_id: s.request_id, company_id: s.company_id,
    evidence_as_of: "2026-08-12T10:00:00.000Z", evaluated_at: "2026-08-12T10:01:00.000Z" });
}
function evaluate(capability_id: string, kinds: OperationalEvidenceKindV1[], conditions?: string[]) {
  const deps = ["DEMAND_AND_INVENTORY_SHARE_ITEM_IDENTITY", "PRESSURE_QUANTITIES_SHARE_UNIT",
    "MOVEMENTS_HAVE_CLASSIFIED_DIRECTION"] as const;
  return evaluateCapabilityMinimumEvidenceV1({ version: 1, capability_id,
    presented_evidence: kinds.map(kind => ({ kind, occurrences: 1 })), satisfied_dependencies: deps as any, active_conditions: conditions });
}
describe("MOE-WU3 canonical cockpit signal qualification", () => {
  it("qualifies Data Awareness only from meaningful semantic evidence", () => {
    const id = "SCOPED_OPERATIONAL_DATA_AWARENESS";
    expect(evaluate(id, [])).toMatchObject({ status: "INSUFFICIENT" });
    for (const kind of ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT", "PLAN_BOM_EDGE", "AUTHORITATIVE_MASTER_BOM"] as const)
      expect(evaluate(id, [kind])).toMatchObject({ status: "SUFFICIENT" });
    expect(evaluate(id, ["TOPOLOGY_CONFIDENCE"])).toMatchObject({ status: "UNNECESSARY_EVIDENCE_PRESENT", sufficient: false });
  });
  it("keeps Plan qualification frozen and independent from state", () => {
    expect(evaluate("CANONICAL_COCKPIT_PLAN_COHERENCE", [])).toMatchObject({ status: "INSUFFICIENT" });
    for (const level of ["COHERENT", "SOME_GAPS", "INCOHERENT"])
      expect({ level, q: evaluate("CANONICAL_COCKPIT_PLAN_COHERENCE", ["PLAN_ORDER"]) }).toMatchObject({ q: { status: "SUFFICIENT" } });
  });
  it("qualifies independent Reality inputs without equating ASSUMED and insufficiency", () => {
    const id = "CANONICAL_REALITY_STABILITY";
    expect(evaluate(id, [])).toMatchObject({ status: "INSUFFICIENT" });
    for (const kind of ["REALITY_ASSESSMENT", "PROCESS_INSTABILITY_ASSESSMENT", "BOM_DIVERGENCE_ASSESSMENT",
      "INVENTORY_RECONCILIATION_RESULT", "TOPOLOGY_CONFIDENCE", "OPERATIONAL_ASSUMPTION"] as const)
      expect(evaluate(id, [kind])).toMatchObject({ status: "SUFFICIENT" });
    expect({ state: "ASSUMED", q: evaluate(id, ["TOPOLOGY_CONFIDENCE"]) }).toMatchObject({ q: { status: "SUFFICIENT" } });
  });
  it("reuses Pressure minimum and activates movement evidence conditionally", () => {
    const id = "FULL_REALITY_AWARE_DECISION_PRESSURE", base: OperationalEvidenceKindV1[] = ["DEMAND_ORDER", "INVENTORY_POSITION",
      "PROBLEM_CLASSIFICATION", "CORRECTION_EFFECT", "OPTIMIZER_SHORTAGE_RESULT", "EXECUTION_GAP_ASSESSMENT"];
    expect(evaluate(id, base)).toMatchObject({ status: "SUFFICIENT" });
    expect(evaluate(id, base, ["MOVEMENT_INFORMED_REALITY_PRESSURE"])).toMatchObject({ status: "INSUFFICIENT" });
    expect(evaluate(id, [...base, "MOVEMENT_EVENT", "REALITY_ASSESSMENT"], ["MOVEMENT_INFORMED_REALITY_PRESSURE"]))
      .toMatchObject({ status: "SUFFICIENT" });
  });
  it("builds deterministic content-free, scope-distinct family bindings", async () => {
    const s = await scope(), input = { signal_family: "DATA_AWARENESS" as const, evaluation_scope: s, evidence_scope: s,
      presented_evidence: [{ kind: "INVENTORY_SNAPSHOT" as const, occurrences: 1 }], evidence_qualification_refs: ["evidence:1"],
      qualified_at: "2026-08-12T10:02:00.000Z" };
    const a = await qualifyCockpitSignalEvidenceV1(input), b = await qualifyCockpitSignalEvidenceV1(input);
    expect(a).toEqual(b); expect(a.company_global_claim).toBe(false); expect(a.grants_execution).toBe(false);
    expect(JSON.stringify(a)).not.toMatch(/orders|movements|credentials|business_payload/i);
    const other = await scope("ENTITY");
    await expect(qualifyCockpitSignalEvidenceV1({ ...input, evidence_scope: other })).rejects.toThrow("COCKPIT_SIGNAL_EVIDENCE_SCOPE_MISMATCH");
  });
  it("represents zero through four sufficient families independently", () => {
    const results = [evaluate("SCOPED_OPERATIONAL_DATA_AWARENESS", ["INVENTORY_SNAPSHOT"]),
      evaluate("CANONICAL_COCKPIT_PLAN_COHERENCE", ["PLAN_ORDER"]), evaluate("CANONICAL_REALITY_STABILITY", ["REALITY_ASSESSMENT"]),
      evaluate("FULL_REALITY_AWARE_DECISION_PRESSURE", ["DEMAND_ORDER", "INVENTORY_POSITION", "PROBLEM_CLASSIFICATION", "CORRECTION_EFFECT", "OPTIMIZER_SHORTAGE_RESULT", "EXECUTION_GAP_ASSESSMENT"])];
    for (let count = 0; count <= 4; count++) expect(results.map((x, i) => i < count ? x.sufficient : false).filter(Boolean)).toHaveLength(count);
  });
});
