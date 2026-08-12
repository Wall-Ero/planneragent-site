import { describe, expect, it } from "vitest";
import { bindOperationalSignalsToScopeV1, createOperationalSignalEvaluationScopeV1 } from "../../cockpit/operational.signal.evaluation.scope.v1";
import { computePlanCoherence } from "../../topology/plan.coherence";
import { CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1, evaluateCapabilityMinimumEvidenceV1, qualifyCockpitPlanCoherenceV1, resolveCapabilityMinimumEvidenceDeclarationV1, type OperationalEvidenceKindV1 } from "..";

const CAPABILITY = "CANONICAL_COCKPIT_PLAN_COHERENCE";

async function scope(scope_type: "REQUEST_DATASET" | "ENTITY" | "PATH" = "REQUEST_DATASET") {
  const value = await createOperationalSignalEvaluationScopeV1({
    version: 1, scope_type, request_id: "request:plan:1", company_id: "company:1", domain: "supply_chain",
    evidence_selection_ref: `evidence:${scope_type}`, source_snapshot_ref: "snapshot:1",
    ...(scope_type === "ENTITY" ? { entity: { entity_type: "ORDER" as const, entity_ref: "order:1" } } : {}),
    ...(scope_type === "PATH" ? { path: { subgraph_ref: "path:1", seed_refs: ["order:1"] } } : {}),
  });
  return bindOperationalSignalsToScopeV1({ scope: value, request_id: value.request_id, company_id: value.company_id,
    evidence_as_of: "2026-08-12T10:00:00.000Z", evaluated_at: "2026-08-12T10:01:00.000Z" });
}

function evaluate(kinds: readonly OperationalEvidenceKindV1[]) {
  return evaluateCapabilityMinimumEvidenceV1({ version: 1, capability_id: CAPABILITY,
    presented_evidence: kinds.map(kind => ({ kind, occurrences: 1 })), satisfied_dependencies: [] });
}

describe("PLAN-MOE-COHERENCE-WU1", () => {
  it("composes the frozen basic minimum without changing specialized declarations", () => {
    expect(resolveCapabilityMinimumEvidenceDeclarationV1(CAPABILITY)).toMatchObject({ minimum_evidence: [],
      composed_capability_ids: ["BASIC_ORDER_PLAN_COHERENCE"], evidence_semantics: "TECHNICALLY_EVALUABLE", grants_execution: false });
    expect(evaluate([])).toMatchObject({ status: "INSUFFICIENT", sufficient: false, missing_requirement_ids: ["plan-order"] });
    expect(evaluate(["PLAN_ORDER"])).toMatchObject({ status: "SUFFICIENT", sufficient: true });
    expect(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1).toMatchObject({
      BASIC_ORDER_PLAN_COHERENCE: { minimum_evidence: [{ accepted_evidence: ["PLAN_ORDER"], minimum_occurrences: 1 }] },
      STRUCTURAL_ORDER_PLAN_COHERENCE: { minimum_evidence: [{ minimum_occurrences: 2 }, { minimum_occurrences: 2 }] },
      PRODUCTION_ORDER_DERIVED_PLAN_COHERENCE: { composed_capability_ids: ["PLANNED_BOM_RECONSTRUCTION"] },
      BOM_TOPOLOGY_ENHANCED_PLAN_COHERENCE: { minimum_evidence: [{ accepted_evidence: ["PLAN_ORDER"] }, { accepted_evidence: ["PLAN_BOM_EDGE"] }, { accepted_evidence: ["PLAN_STRUCTURE_QUALITY"] }] },
    });
  });

  it("keeps Plan state independent from evidence sufficiency", () => {
    expect(computePlanCoherence({})).toMatchObject({ level: "INCOHERENT", score: 0, reasons: ["NO_ORDERS"] });
    expect(evaluate([])).toMatchObject({ status: "INSUFFICIENT", sufficient: false });
    for (const level of ["COHERENT", "SOME_GAPS", "INCOHERENT"] as const) {
      expect({ level, qualification: evaluate(["PLAN_ORDER"]) }).toMatchObject({
        level, qualification: { status: "SUFFICIENT", sufficient: true },
      });
    }
  });

  it("treats selected structural evidence as optional enhancement", () => {
    for (const kind of ["ORDER_RELATIONSHIP", "PLAN_BOM_EDGE", "AUTHORITATIVE_MASTER_BOM",
      "PLAN_STRUCTURE_QUALITY", "OPERATIONAL_TOPOLOGY", "TOPOLOGY_CONFIDENCE"] as const) {
      expect(evaluate(["PLAN_ORDER", kind])).toMatchObject({ status: "SUFFICIENT", optional_evidence_present: [kind] });
    }
    expect(evaluate(["AUTHORITATIVE_MASTER_BOM"]))
      .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["plan-order"] });
  });

  it("keeps behavioral/advisory evidence neutral and ignores provenance because it is not an MOE input", () => {
    for (const kind of ["REALITY_ASSESSMENT", "REALITY_SNAPSHOT", "OPTIMIZER_SHORTAGE_RESULT",
      "OPTIMIZER_CONSTRAINTS", "CORRECTION_EFFECT", "EXECUTION_GAP_ASSESSMENT"] as const) {
      expect(evaluate([kind])).toMatchObject({ status: "INSUFFICIENT", sufficient: false, missing_requirement_ids: ["plan-order"] });
      expect(evaluate(["PLAN_ORDER", kind])).toMatchObject({ status: "SUFFICIENT", sufficient: true });
    }
    for (const source of ["MASTER", "ORDERS_INFERRED", "REALITY_INFERRED", "ASSUMED"] as const) {
      expect({ source, result: evaluate([]) }).toMatchObject({ source, result: { status: "INSUFFICIENT" } });
    }
  });

  it.each(["REQUEST_DATASET", "ENTITY", "PATH"] as const)("binds qualification to exact %s scope", async scopeType => {
    const binding = await scope(scopeType);
    const result = await qualifyCockpitPlanCoherenceV1({ evaluation_scope: binding, evidence_scope: binding,
      presented_evidence: [{ kind: "PLAN_ORDER", occurrences: 1 }] });
    expect(result).toMatchObject({ scope_id: binding.scope.scope_id, scope_digest: binding.scope.scope_digest,
      evidence_selection_ref: binding.scope.evidence_selection_ref, moe_result: { status: "SUFFICIENT" },
      company_global_claim: false, grants_execution: false });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("does not allow evidence from one scope to qualify another", async () => {
    const request = await scope("REQUEST_DATASET");
    const entity = await scope("ENTITY");
    await expect(qualifyCockpitPlanCoherenceV1({ evaluation_scope: request, evidence_scope: entity,
      presented_evidence: [{ kind: "PLAN_ORDER", occurrences: 1 }] }))
      .rejects.toThrow("PLAN_COHERENCE_EVIDENCE_SCOPE_MISMATCH");
  });
});
