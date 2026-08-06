import { describe, expect, it } from "vitest";
import {
  CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1,
  evaluateCapabilityMinimumEvidenceV1,
  resolveCapabilityMinimumEvidenceDeclarationV1,
  type EvidenceDependencyIdV1,
  type OperationalCapabilityIdV1,
  type OperationalEvidenceKindV1,
} from "..";

function evaluate(
  capability_id: string,
  kinds: readonly OperationalEvidenceKindV1[],
  dependencies: readonly EvidenceDependencyIdV1[],
) {
  return evaluateCapabilityMinimumEvidenceV1({
    version: 1,
    capability_id,
    presented_evidence: kinds.map(kind => ({ kind, occurrences: 1 })),
    satisfied_dependencies: dependencies,
  });
}

function declaration(id: OperationalCapabilityIdV1) {
  return CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1[id];
}

describe("MOE-WU1 capability-to-minimum-evidence declarations", () => {
  it("declares every repository-proven capability by operational question rather than source product", () => {
    expect(Object.keys(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1)).toEqual([
      "DEMAND_INVENTORY_PRESSURE",
      "PLANNED_BOM_RECONSTRUCTION",
      "HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION",
      "PLAN_VS_PRODUCTION_BOM_ALIGNMENT",
      "AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON",
    ]);
    for (const value of Object.values(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1)) {
      expect(value.supported_operational_question).toMatch(/\?$/);
      expect(value.minimum_evidence.length).toBeGreaterThan(0);
      expect(value.determination).toBe("DETERMINISTIC");
      expect(JSON.stringify(value)).not.toMatch(/SAP|ORACLE|DYNAMICS|CONNECTOR|CSV|XLSX|API|FILE/);
      expect(Object.isFrozen(value)).toBe(true);
    }
  });

  it("requires orders and inventory with coherent item identity for truthful demand pressure", () => {
    const dependency: EvidenceDependencyIdV1[] = ["DEMAND_AND_INVENTORY_SHARE_ITEM_IDENTITY"];
    expect(evaluate("DEMAND_INVENTORY_PRESSURE", ["DEMAND_ORDER"], dependency)).toMatchObject({
      status: "INSUFFICIENT", sufficient: false, missing_requirement_ids: ["inventory-positions"],
    });
    expect(evaluate("DEMAND_INVENTORY_PRESSURE", ["DEMAND_ORDER", "INVENTORY_POSITION"], [])).toMatchObject({
      status: "INSUFFICIENT", unsatisfied_dependencies: dependency,
    });
    expect(evaluate("DEMAND_INVENTORY_PRESSURE", ["DEMAND_ORDER", "INVENTORY_POSITION"], dependency))
      .toMatchObject({ status: "SUFFICIENT", sufficient: true });
  });

  it("requires linked positive planned parent and component evidence for planned BOM reconstruction", () => {
    const value = declaration("PLANNED_BOM_RECONSTRUCTION");
    expect(value.minimum_evidence.map(item => item.accepted_evidence)).toEqual([
      ["PLANNED_PRODUCTION_ORDER"], ["PLANNED_COMPONENT_REQUIREMENT"],
    ]);
    expect(evaluate(
      value.capability_id,
      ["PLANNED_PRODUCTION_ORDER", "PLANNED_COMPONENT_REQUIREMENT"],
      value.evidence_dependencies,
    )).toMatchObject({ status: "SUFFICIENT", sufficient: true });
  });

  it("requires one linked output and consumption record and accepts only repository-proven semantic substitutions", () => {
    const value = declaration("HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION");
    const canonical = evaluate(value.capability_id,
      ["PRODUCTION_OUTPUT_EVENT", "MATERIAL_CONSUMPTION_EVENT"], value.evidence_dependencies);
    expect(canonical).toMatchObject({ status: "SUFFICIENT", substitutions_applied: [] });

    const substituted = evaluate(value.capability_id,
      ["PRODUCTION_ORDER_OUTPUT_RECORD", "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION"],
      value.evidence_dependencies);
    expect(substituted).toMatchObject({ status: "SUFFICIENT", sufficient: true });
    expect(substituted.substitutions_applied).toHaveLength(2);
  });

  it("keeps master BOM optional except for the authoritative comparison question", () => {
    const historical = declaration("HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION");
    expect(historical.minimum_evidence.flatMap(item => item.accepted_evidence))
      .not.toContain("AUTHORITATIVE_MASTER_BOM");
    expect(declaration("PLAN_VS_PRODUCTION_BOM_ALIGNMENT").minimum_evidence
      .flatMap(item => item.accepted_evidence)).not.toContain("AUTHORITATIVE_MASTER_BOM");
    expect(declaration("AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON").minimum_evidence
      .flatMap(item => item.accepted_evidence)).toContain("AUTHORITATIVE_MASTER_BOM");
  });

  it("rejects unnecessary sensitive evidence rather than treating availability as justification", () => {
    const value = declaration("DEMAND_INVENTORY_PRESSURE");
    const result = evaluate(value.capability_id,
      ["DEMAND_ORDER", "INVENTORY_POSITION", "PAYROLL_DATA"], value.evidence_dependencies);
    expect(result).toMatchObject({
      status: "UNSUPPORTED_EVIDENCE_PRESENT", sufficient: false,
      unsupported_evidence_present: ["PAYROLL_DATA"],
      reason_codes: ["UNSUPPORTED_EVIDENCE_MUST_NOT_BE_ACQUIRED"],
    });
  });

  it("does not let optional evidence compensate for missing minimum evidence", () => {
    const value = declaration("DEMAND_INVENTORY_PRESSURE");
    expect(evaluate(value.capability_id, ["FUTURE_SUPPLY_MOVEMENT"], value.evidence_dependencies))
      .toMatchObject({
        status: "INSUFFICIENT", sufficient: false,
        missing_requirement_ids: ["demand-orders", "inventory-positions"],
        optional_evidence_present: ["FUTURE_SUPPLY_MOVEMENT"],
      });
  });

  it("returns deterministic fail-closed results for undeclared and malformed requests", () => {
    expect(resolveCapabilityMinimumEvidenceDeclarationV1("UNKNOWN")).toBeNull();
    expect(evaluate("UNKNOWN", [], [])).toMatchObject({
      status: "CAPABILITY_UNDECLARED", sufficient: false,
    });
    expect(evaluateCapabilityMinimumEvidenceV1({
      version: 1, capability_id: "DEMAND_INVENTORY_PRESSURE",
      presented_evidence: [{ kind: "DEMAND_ORDER", occurrences: 0 }],
      satisfied_dependencies: [],
    })).toMatchObject({ status: "INPUT_INVALID", sufficient: false });
    expect(evaluateCapabilityMinimumEvidenceV1({
      version: 1, capability_id: "DEMAND_INVENTORY_PRESSURE",
      presented_evidence: [{ kind: "UNKNOWN" as OperationalEvidenceKindV1, occurrences: 1 }],
      satisfied_dependencies: [],
    })).toMatchObject({ status: "INPUT_INVALID", sufficient: false });
  });
});
