import { describe, expect, it } from "vitest";
import {
  ALL_CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1,
  CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1,
  CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1,
  evaluateCapabilityMinimumEvidenceV1,
  resolveCapabilityMinimumEvidenceDeclarationV1,
  type CapabilityMinimumEvidenceDeclarationV1,
  type EvidenceDependencyIdV1,
  type OperationalEvidenceKindV1,
} from "..";

function composed(id: string, seen = new Set<string>()): CapabilityMinimumEvidenceDeclarationV1[] {
  const value = resolveCapabilityMinimumEvidenceDeclarationV1(id);
  if (!value || seen.has(id)) return [];
  seen.add(id);
  return [
    ...(value.composed_capability_ids ?? []).flatMap(child => composed(child, seen)),
    value,
  ];
}

function dependencies(id: string, condition?: string): EvidenceDependencyIdV1[] {
  const values = composed(id);
  const conditional = values.at(-1)?.conditional_evidence?.filter(item => item.condition_id === condition) ?? [];
  return Array.from(new Set([
    ...values.flatMap(value => value.evidence_dependencies),
    ...conditional.flatMap(value => value.evidence_dependencies),
  ]));
}

function evaluate(
  capability_id: string,
  kinds: readonly OperationalEvidenceKindV1[],
  options: { dependencies?: readonly EvidenceDependencyIdV1[]; conditions?: readonly string[] } = {},
) {
  return evaluateCapabilityMinimumEvidenceV1({
    version: 1,
    capability_id,
    presented_evidence: kinds.map(kind => ({ kind, occurrences: 1 })),
    satisfied_dependencies: options.dependencies ?? dependencies(capability_id, options.conditions?.[0]),
    active_conditions: options.conditions,
  });
}

const demandInventory: OperationalEvidenceKindV1[] = ["DEMAND_ORDER", "INVENTORY_POSITION"];
const fullPressure: OperationalEvidenceKindV1[] = [
  ...demandInventory, "PROBLEM_CLASSIFICATION", "CORRECTION_EFFECT",
  "OPTIMIZER_SHORTAGE_RESULT", "EXECUTION_GAP_ASSESSMENT",
];

describe("MOE-WU2 remaining deterministic capability declarations", () => {
  describe("Plan Coherence", () => {
    it("admits minimum basic plan evidence and denies missing orders", () => {
      expect(evaluate("BASIC_ORDER_PLAN_COHERENCE", ["PLAN_ORDER"]))
        .toMatchObject({ status: "SUFFICIENT", sufficient: true });
      expect(evaluate("BASIC_ORDER_PLAN_COHERENCE", []))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["plan-order"] });
      expect(resolveCapabilityMinimumEvidenceDeclarationV1("BASIC_ORDER_PLAN_COHERENCE"))
        .toMatchObject({ evidence_semantics: "TECHNICALLY_EVALUABLE" });
    });

    it("makes meaningful structural order coherence explicit", () => {
      const id = "STRUCTURAL_ORDER_PLAN_COHERENCE";
      expect(evaluate(id, ["PLAN_ORDER", "ORDER_RELATIONSHIP"]))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["plan-orders", "order-relationships"] });
      const result = evaluateCapabilityMinimumEvidenceV1({
        version: 1, capability_id: id,
        presented_evidence: [
          { kind: "PLAN_ORDER", occurrences: 2 }, { kind: "ORDER_RELATIONSHIP", occurrences: 2 },
        ],
        satisfied_dependencies: dependencies(id),
      });
      expect(result).toMatchObject({ status: "SUFFICIENT", sufficient: true });
    });

    it("declares production-order and BOM/topology-enhanced coherence separately", () => {
      expect(resolveCapabilityMinimumEvidenceDeclarationV1("PRODUCTION_ORDER_DERIVED_PLAN_COHERENCE"))
        .toMatchObject({ composed_capability_ids: ["PLANNED_BOM_RECONSTRUCTION"] });
      expect(resolveCapabilityMinimumEvidenceDeclarationV1("BOM_TOPOLOGY_ENHANCED_PLAN_COHERENCE")
        ?.minimum_evidence.flatMap(item => item.accepted_evidence))
        .toEqual(["PLAN_ORDER", "PLAN_BOM_EDGE", "PLAN_STRUCTURE_QUALITY"]);
    });

    it("keeps BOM optional for basic coherence and rejects inventory, movements and sensitive evidence", () => {
      const basic = resolveCapabilityMinimumEvidenceDeclarationV1("BASIC_ORDER_PLAN_COHERENCE")!;
      expect(basic.optional_evidence).toContain("PLAN_BOM_EDGE");
      for (const kind of ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT"] as const) {
        expect(evaluate(basic.capability_id, ["PLAN_ORDER", kind]))
          .toMatchObject({ status: "UNNECESSARY_EVIDENCE_PRESENT", sufficient: false });
      }
      expect(evaluate(basic.capability_id, ["PLAN_ORDER", "PAYROLL_DATA"]))
        .toMatchObject({ status: "UNSUPPORTED_EVIDENCE_PRESENT", sufficient: false });
    });
  });

  describe("Decision Pressure", () => {
    it("composes simple demand/inventory pressure rather than replacing MOE-WU1", () => {
      expect(resolveCapabilityMinimumEvidenceDeclarationV1("FULL_REALITY_AWARE_DECISION_PRESSURE"))
        .toMatchObject({ composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"] });
      expect(evaluate("FULL_REALITY_AWARE_DECISION_PRESSURE", fullPressure))
        .toMatchObject({ status: "SUFFICIENT", sufficient: true });
      expect(evaluate("FULL_REALITY_AWARE_DECISION_PRESSURE", fullPressure.filter(x => x !== "INVENTORY_POSITION")))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["inventory-positions"] });
    });

    it("requires exact movement/reality inputs only when movement-informed pressure is selected", () => {
      const id = "FULL_REALITY_AWARE_DECISION_PRESSURE";
      expect(evaluate(id, fullPressure)).toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate(id, fullPressure, { conditions: ["MOVEMENT_INFORMED_REALITY_PRESSURE"] }))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["movement-events", "reality-assessment"] });
      expect(evaluate(id, [...fullPressure, "MOVEMENT_EVENT", "REALITY_ASSESSMENT"], {
        conditions: ["MOVEMENT_INFORMED_REALITY_PRESSURE"],
      })).toMatchObject({ status: "SUFFICIENT" });
    });

    it("requires BOM only for component-level pressure and keeps capacity unsupported", () => {
      const id = "FULL_REALITY_AWARE_DECISION_PRESSURE";
      expect(evaluate(id, fullPressure, { conditions: ["COMPONENT_LEVEL_PRESSURE"] }))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["component-bom"] });
      expect(evaluate(id, [...fullPressure, "PLAN_BOM_EDGE"], { conditions: ["COMPONENT_LEVEL_PRESSURE"] }))
        .toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate(id, [...fullPressure, "MACHINE_CAPACITY"]))
        .toMatchObject({ status: "UNSUPPORTED_EVIDENCE_PRESENT" });
    });

    it("does not accept unproven evidence substitution", () => {
      expect(evaluate("FULL_REALITY_AWARE_DECISION_PRESSURE", [
        ...demandInventory, "PROBLEM_CLASSIFICATION", "CORRECTION_EFFECT",
        "PRODUCTION_OUTPUT_EVENT", "MATERIAL_CONSUMPTION_EVENT",
      ])).toMatchObject({
        status: "INSUFFICIENT",
        missing_requirement_ids: ["optimizer-shortage", "execution-gap-assessment"],
        substitutions_applied: [],
      });
    });
  });

  describe("Inventory reconciliation", () => {
    it("admits snapshot reconciliation only with two coherent inventory states", () => {
      const id = "INVENTORY_SNAPSHOT_RECONCILIATION";
      expect(evaluate(id, ["INVENTORY_SNAPSHOT", "RECONSTRUCTED_INVENTORY_STATE"]))
        .toMatchObject({ status: "SUFFICIENT", sufficient: true });
      expect(evaluate(id, ["INVENTORY_SNAPSHOT", "RECONSTRUCTED_INVENTORY_STATE"], { dependencies: [] }))
        .toMatchObject({ status: "INSUFFICIENT", unsatisfied_dependencies: [
          "INVENTORY_STATES_SHARE_SKU_IDENTITY", "INVENTORY_STATES_SHARE_UNIT",
        ] });
    });

    it("declares movement-derived reconciliation and anomaly analysis separately", () => {
      expect(evaluate("MOVEMENT_DERIVED_INVENTORY_RECONCILIATION", ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT"]))
        .toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate("INVENTORY_RECONCILIATION_ANOMALY_ANALYSIS", ["INVENTORY_RECONCILIATION_RESULT", "MOVEMENT_EVENT"]))
        .toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate("INVENTORY_RECONCILIATION_ANOMALY_ANALYSIS", ["INVENTORY_RECONCILIATION_RESULT"]))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["movement-events"] });
    });

    it("does not require warehouse/time fields and does not relabel shortage as reconciliation", () => {
      const value = resolveCapabilityMinimumEvidenceDeclarationV1("MOVEMENT_DERIVED_INVENTORY_RECONCILIATION")!;
      expect(value.unnecessary_evidence).toEqual(expect.arrayContaining(["WAREHOUSE_IDENTITY", "EVIDENCE_TIMESTAMP", "DEMAND_ORDER"]));
      expect(value.composed_capability_ids).toBeUndefined();
    });
  });

  describe("Deterministic scenario mutation", () => {
    it.each([
      ["INVENTORY_SCENARIO_MUTATION", "INVENTORY_OVERRIDE"],
      ["DEMAND_SCENARIO_MUTATION", "DEMAND_OVERRIDE"],
      ["BOM_SCENARIO_MUTATION", "BOM_OVERRIDE"],
    ] as const)("declares %s baseline and applicable override", (id, override) => {
      expect(evaluate(id, ["BASELINE_TWIN_SNAPSHOT", override])).toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate(id, [override])).toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["baseline"] });
      expect(evaluate(id, ["BASELINE_TWIN_SNAPSHOT"])).toMatchObject({ status: "INSUFFICIENT" });
    });

    it("requires matching baseline supply and valid ETA for supplier-delay mutation", () => {
      const id = "SUPPLIER_DELAY_SCENARIO_MUTATION";
      expect(evaluate(id, ["BASELINE_TWIN_SNAPSHOT", "SUPPLY_POSITION", "SUPPLIER_DELAY_OVERRIDE"]))
        .toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate(id, ["BASELINE_TWIN_SNAPSHOT", "SUPPLIER_DELAY_OVERRIDE"]))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["baseline-supply"] });
    });

    it("binds distinct baseline/scenario identities without fabricating source precedence", () => {
      for (const id of [
        "SUPPLIER_DELAY_SCENARIO_MUTATION", "INVENTORY_SCENARIO_MUTATION",
        "DEMAND_SCENARIO_MUTATION", "BOM_SCENARIO_MUTATION",
      ]) {
        const value = resolveCapabilityMinimumEvidenceDeclarationV1(id)!;
        expect(value.evidence_dependencies).toContain("BASELINE_AND_SCENARIO_IDENTITIES_ARE_DISTINCT");
        expect(value.limitations?.join(" ")).toMatch(/pending ORS and multi-source composition/);
      }
    });
  });

  describe("Optimizer / JUNIOR Supply Chain Advisor", () => {
    it("admits SKU mode with orders, inventory and deterministic request identity", () => {
      const id = "JUNIOR_SKU_SUPPLY_CHAIN_ADVISORY";
      expect(evaluate(id, [...demandInventory, "DETERMINISTIC_REQUEST_ID"]))
        .toMatchObject({ status: "SUFFICIENT", sufficient: true });
      expect(resolveCapabilityMinimumEvidenceDeclarationV1(id))
        .toMatchObject({ grants_execution: false, composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"] });
    });

    it("requires topology and BOM for graph mode and BOM for component demand", () => {
      const graph = "JUNIOR_GRAPH_TOPOLOGY_ADVISORY";
      expect(evaluate(graph, [...demandInventory, "DETERMINISTIC_REQUEST_ID", "PLAN_BOM_EDGE", "OPERATIONAL_TOPOLOGY", "TOPOLOGY_CONFIDENCE"]))
        .toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate(graph, [...demandInventory, "DETERMINISTIC_REQUEST_ID"]))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["bom-structure", "operational-topology", "topology-confidence"] });
      expect(evaluate("JUNIOR_COMPONENT_DEMAND_ADVISORY", [...demandInventory, "DETERMINISTIC_REQUEST_ID"]))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["bom-structure"] });
    });

    it("requires movements only for movement-informed reality-aware mode", () => {
      const id = "JUNIOR_REALITY_AWARE_ADVISORY";
      const base = [...demandInventory, "DETERMINISTIC_REQUEST_ID", "REALITY_SNAPSHOT"] as OperationalEvidenceKindV1[];
      expect(evaluate(id, base)).toMatchObject({ status: "SUFFICIENT" });
      expect(evaluate(id, base, { conditions: ["MOVEMENT_INFORMED_REALITY"] }))
        .toMatchObject({ status: "INSUFFICIENT", missing_requirement_ids: ["movement-events"] });
      expect(evaluate(id, [...base, "MOVEMENT_EVENT"], { conditions: ["MOVEMENT_INFORMED_REALITY"] }))
        .toMatchObject({ status: "SUFFICIENT" });
    });

    it("records the actual freeze-horizon lateness input and does not invent due-date consumption", () => {
      const id = "JUNIOR_FREEZE_HORIZON_ADVISORY";
      expect(evaluate(id, [...demandInventory, "DETERMINISTIC_REQUEST_ID", "OPTIMIZER_CONSTRAINTS"]))
        .toMatchObject({ status: "SUFFICIENT" });
      expect(resolveCapabilityMinimumEvidenceDeclarationV1(id)?.limitations?.join(" "))
        .toMatch(/not order due dates/);
      expect(evaluate(id, [...demandInventory, "DETERMINISTIC_REQUEST_ID", "OPTIMIZER_CONSTRAINTS", "ORDER_DUE_DATE"]))
        .toMatchObject({ status: "UNNECESSARY_EVIDENCE_PRESENT" });
    });

    it("never requires an external LLM and never grants execution", () => {
      for (const value of Object.values(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1)
        .filter(value => value.capability_id.startsWith("JUNIOR_"))) {
        expect(value.grants_execution).toBe(false);
        expect(value.minimum_evidence.flatMap(item => item.accepted_evidence)).not.toContain("EXTERNAL_LLM_OUTPUT");
        expect(value.unnecessary_evidence).toContain("EXTERNAL_LLM_OUTPUT");
      }
    });
  });

  describe("family boundaries", () => {
    it("keeps every declaration deterministic and unknown capabilities fail closed", () => {
      for (const value of Object.values(ALL_CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1)) {
        expect(value.determination).toBe("DETERMINISTIC");
      }
      expect(evaluate("UNKNOWN", [])).toMatchObject({ status: "CAPABILITY_UNDECLARED", sufficient: false });
      expect(evaluate("BASIC_ORDER_PLAN_COHERENCE", ["PLAN_ORDER", "PAYROLL_DATA"]))
        .toMatchObject({ status: "UNSUPPORTED_EVIDENCE_PRESENT" });
    });

    it("preserves the five frozen MOE-WU1 declarations unchanged", () => {
      expect(Object.keys(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1)).toEqual([
        "DEMAND_INVENTORY_PRESSURE", "PLANNED_BOM_RECONSTRUCTION",
        "HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION", "PLAN_VS_PRODUCTION_BOM_ALIGNMENT",
        "AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON",
      ]);
    });

    it("keeps the frozen WU2 registry free of later cockpit declarations and provider coupling", () => {
      const ids = Object.keys(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1).join(" ");
      expect(ids).not.toMatch(/DATA_AWARENESS|REALITY_ALIGNMENT|BOTTLENECK|DECISION_PACKAGE/);
      const serializedDeclarations = JSON.stringify(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1);
      expect(serializedDeclarations).not.toMatch(/SAP|ORACLE|DYNAMICS|CONNECTOR|CSV|XLSX/);
      expect(serializedDeclarations).not.toMatch(/membership_id|company_id|tenant_id|provider trust/i);
    });
  });
});
