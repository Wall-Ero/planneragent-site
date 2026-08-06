import type {
  CapabilityMinimumEvidenceDeclarationV1,
  OperationalCapabilityIdV2,
  OperationalEvidenceKindV1,
} from "./minimum.operational.evidence.contracts.v1";

const UNSUPPORTED = [
  "EMPLOYEE_PERSONAL_DATA", "PAYROLL_DATA", "SUPPLIER_OR_CUSTOMER_CONTRACT",
  "MARGIN_DATA", "BANK_DATA", "TAX_DATA", "EMAIL_ARCHIVE", "PROVIDER_CREDENTIAL",
  "UNRELATED_MASTER_DATA", "MACHINE_CAPACITY", "RESOURCE_CAPACITY",
] as const satisfies readonly OperationalEvidenceKindV1[];

const SOURCE_PRECEDENCE_LIMITATION =
  "Authoritative baseline provenance and source precedence remain unresolved pending ORS and multi-source composition.";

const r = (requirement_id: string, accepted_evidence: readonly OperationalEvidenceKindV1[], minimum_occurrences = 1) =>
  ({ requirement_id, accepted_evidence, minimum_occurrences });

const base = (value: Omit<CapabilityMinimumEvidenceDeclarationV1,
  "version" | "determination" | "unsupported_evidence" | "evidence_substitutions"> &
  Partial<Pick<CapabilityMinimumEvidenceDeclarationV1, "evidence_substitutions">>) => ({
    version: 1 as const,
    determination: "DETERMINISTIC" as const,
    unsupported_evidence: UNSUPPORTED,
    evidence_substitutions: [],
    ...value,
  });

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

const declarations = {
  BASIC_ORDER_PLAN_COHERENCE: base({
    capability_id: "BASIC_ORDER_PLAN_COHERENCE",
    supported_operational_question: "Does a non-empty order plan exist for deterministic coherence evaluation?",
    minimum_evidence: [r("plan-order", ["PLAN_ORDER"])],
    optional_evidence: ["PLAN_BOM_EDGE", "PLAN_STRUCTURE_QUALITY"],
    unnecessary_evidence: ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT", "ORDER_DUE_DATE"],
    evidence_dependencies: [],
    evidence_semantics: "TECHNICALLY_EVALUABLE",
    limitations: ["One isolated order is technically evaluable but does not prove meaningful structural coherence."],
  }),
  STRUCTURAL_ORDER_PLAN_COHERENCE: base({
    capability_id: "STRUCTURAL_ORDER_PLAN_COHERENCE",
    supported_operational_question: "Does the order plan contain operationally meaningful relationship structure?",
    minimum_evidence: [r("plan-orders", ["PLAN_ORDER"], 2), r("order-relationships", ["ORDER_RELATIONSHIP"], 2)],
    optional_evidence: ["PLAN_BOM_EDGE", "PLAN_STRUCTURE_QUALITY"],
    unnecessary_evidence: ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT", "ORDER_DUE_DATE"],
    evidence_dependencies: [
      "PLAN_ORDER_IDENTITY_IS_STABLE", "ORDER_RELATIONSHIPS_REFERENCE_PLAN_ORDERS",
      "PLAN_STRUCTURE_IS_OPERATIONALLY_MEANINGFUL",
    ],
    evidence_semantics: "OPERATIONALLY_MEANINGFUL",
  }),
  PRODUCTION_ORDER_DERIVED_PLAN_COHERENCE: base({
    capability_id: "PRODUCTION_ORDER_DERIVED_PLAN_COHERENCE",
    supported_operational_question: "Is production-order-derived component structure sufficiently connected and verified for plan coherence?",
    minimum_evidence: [r("plan-structure-quality", ["PLAN_STRUCTURE_QUALITY"])],
    optional_evidence: ["PLAN_BOM_EDGE"],
    unnecessary_evidence: ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT", "ORDER_DUE_DATE"],
    evidence_dependencies: ["PLAN_STRUCTURE_IS_OPERATIONALLY_MEANINGFUL"],
    composed_capability_ids: ["PLANNED_BOM_RECONSTRUCTION"],
    evidence_semantics: "OPERATIONALLY_MEANINGFUL",
  }),
  BOM_TOPOLOGY_ENHANCED_PLAN_COHERENCE: base({
    capability_id: "BOM_TOPOLOGY_ENHANCED_PLAN_COHERENCE",
    supported_operational_question: "Does the order plan have coherent BOM-derived topology and verified structural quality?",
    minimum_evidence: [r("plan-order", ["PLAN_ORDER"]), r("plan-bom-edge", ["PLAN_BOM_EDGE"]), r("plan-structure-quality", ["PLAN_STRUCTURE_QUALITY"])],
    optional_evidence: ["ORDER_RELATIONSHIP"],
    unnecessary_evidence: ["INVENTORY_SNAPSHOT", "MOVEMENT_EVENT", "ORDER_DUE_DATE"],
    evidence_dependencies: ["PLAN_ORDER_IDENTITY_IS_STABLE", "PLAN_STRUCTURE_IS_OPERATIONALLY_MEANINGFUL"],
    evidence_semantics: "OPERATIONALLY_MEANINGFUL",
  }),
  FULL_REALITY_AWARE_DECISION_PRESSURE: base({
    capability_id: "FULL_REALITY_AWARE_DECISION_PRESSURE",
    supported_operational_question: "What deterministic decision pressure follows from plan or reality problems, shortage, execution gap, and correction effect?",
    minimum_evidence: [
      r("problem-classification", ["PROBLEM_CLASSIFICATION"]),
      r("correction-effect", ["CORRECTION_EFFECT"]),
      r("optimizer-shortage", ["OPTIMIZER_SHORTAGE_RESULT"]),
      r("execution-gap-assessment", ["EXECUTION_GAP_ASSESSMENT"]),
    ],
    optional_evidence: ["REALITY_ASSESSMENT"],
    unnecessary_evidence: ["ORDER_DUE_DATE", "WAREHOUSE_IDENTITY", "EVIDENCE_TIMESTAMP"],
    evidence_dependencies: ["PRESSURE_QUANTITIES_SHARE_UNIT"],
    composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"],
    conditional_evidence: [
      {
        condition_id: "MOVEMENT_INFORMED_REALITY_PRESSURE",
        exact_condition: "Active only when movement-derived reality contributes to problem classification or execution-gap interpretation.",
        minimum_evidence: [r("movement-events", ["MOVEMENT_EVENT"]), r("reality-assessment", ["REALITY_ASSESSMENT"])],
        evidence_dependencies: ["MOVEMENTS_HAVE_CLASSIFIED_DIRECTION"],
      },
      {
        condition_id: "COMPONENT_LEVEL_PRESSURE",
        exact_condition: "Active only when shortage or structural pressure is evaluated at BOM-component level.",
        minimum_evidence: [r("component-bom", ["PLAN_BOM_EDGE", "AUTHORITATIVE_MASTER_BOM"])],
        evidence_dependencies: ["BOM_COMPONENT_IDENTITIES_MATCH_DEMAND"],
      },
    ],
  }),
  INVENTORY_SNAPSHOT_RECONCILIATION: base({
    capability_id: "INVENTORY_SNAPSHOT_RECONCILIATION",
    supported_operational_question: "Where do a supplied inventory snapshot and reconstructed inventory state differ by item?",
    minimum_evidence: [r("inventory-snapshot", ["INVENTORY_SNAPSHOT"]), r("reconstructed-inventory", ["RECONSTRUCTED_INVENTORY_STATE"])],
    optional_evidence: [],
    unnecessary_evidence: ["DEMAND_ORDER", "WAREHOUSE_IDENTITY", "EVIDENCE_TIMESTAMP", "ORDER_DUE_DATE"],
    evidence_dependencies: ["INVENTORY_STATES_SHARE_SKU_IDENTITY", "INVENTORY_STATES_SHARE_UNIT"],
  }),
  MOVEMENT_DERIVED_INVENTORY_RECONCILIATION: base({
    capability_id: "MOVEMENT_DERIVED_INVENTORY_RECONCILIATION",
    supported_operational_question: "Where does inventory differ after deterministic movement effects are applied to the supplied snapshot?",
    minimum_evidence: [r("inventory-snapshot", ["INVENTORY_SNAPSHOT"]), r("movement-events", ["MOVEMENT_EVENT"])],
    optional_evidence: [],
    unnecessary_evidence: ["DEMAND_ORDER", "WAREHOUSE_IDENTITY", "EVIDENCE_TIMESTAMP", "ORDER_DUE_DATE"],
    evidence_dependencies: [
      "MOVEMENTS_HAVE_CLASSIFIED_DIRECTION", "MOVEMENTS_SHARE_INVENTORY_SKU_IDENTITY", "INVENTORY_STATES_SHARE_UNIT",
    ],
  }),
  INVENTORY_RECONCILIATION_ANOMALY_ANALYSIS: base({
    capability_id: "INVENTORY_RECONCILIATION_ANOMALY_ANALYSIS",
    supported_operational_question: "Which movement class explains an inventory reconciliation delta for the same item?",
    minimum_evidence: [r("reconciliation-result", ["INVENTORY_RECONCILIATION_RESULT"]), r("movement-events", ["MOVEMENT_EVENT"])],
    optional_evidence: [],
    unnecessary_evidence: ["DEMAND_ORDER", "WAREHOUSE_IDENTITY", "EVIDENCE_TIMESTAMP", "ORDER_DUE_DATE"],
    evidence_dependencies: ["MOVEMENTS_HAVE_CLASSIFIED_DIRECTION", "MOVEMENTS_SHARE_INVENTORY_SKU_IDENTITY", "INVENTORY_STATES_SHARE_UNIT"],
  }),
  SUPPLIER_DELAY_SCENARIO_MUTATION: base({
    capability_id: "SUPPLIER_DELAY_SCENARIO_MUTATION",
    supported_operational_question: "How does a specified supplier-delay override mutate matching baseline supply arrival dates?",
    minimum_evidence: [r("baseline", ["BASELINE_TWIN_SNAPSHOT"]), r("baseline-supply", ["SUPPLY_POSITION"]), r("delay-override", ["SUPPLIER_DELAY_OVERRIDE"])],
    optional_evidence: [], unnecessary_evidence: ["PROVIDER_CREDENTIAL"],
    evidence_dependencies: ["BASELINE_AND_SCENARIO_IDENTITIES_ARE_DISTINCT", "OVERRIDE_TARGET_MATCHES_BASELINE_IDENTITY", "SUPPLY_ETA_IS_VALID"],
    limitations: [SOURCE_PRECEDENCE_LIMITATION],
  }),
  INVENTORY_SCENARIO_MUTATION: base({
    capability_id: "INVENTORY_SCENARIO_MUTATION",
    supported_operational_question: "How does a specified inventory override mutate the baseline twin inventory state?",
    minimum_evidence: [r("baseline", ["BASELINE_TWIN_SNAPSHOT"]), r("inventory-override", ["INVENTORY_OVERRIDE"])],
    optional_evidence: ["INVENTORY_POSITION"], unnecessary_evidence: ["PROVIDER_CREDENTIAL"],
    evidence_dependencies: ["BASELINE_AND_SCENARIO_IDENTITIES_ARE_DISTINCT", "SCENARIO_OVERRIDE_QUANTITY_IS_VALID"],
    limitations: [SOURCE_PRECEDENCE_LIMITATION],
  }),
  DEMAND_SCENARIO_MUTATION: base({
    capability_id: "DEMAND_SCENARIO_MUTATION",
    supported_operational_question: "How does a specified demand override mutate matching or newly introduced baseline twin demand?",
    minimum_evidence: [r("baseline", ["BASELINE_TWIN_SNAPSHOT"]), r("demand-override", ["DEMAND_OVERRIDE"])],
    optional_evidence: ["DEMAND_ORDER"], unnecessary_evidence: ["PROVIDER_CREDENTIAL"],
    evidence_dependencies: ["BASELINE_AND_SCENARIO_IDENTITIES_ARE_DISTINCT", "SCENARIO_OVERRIDE_QUANTITY_IS_VALID"],
    limitations: [SOURCE_PRECEDENCE_LIMITATION],
  }),
  BOM_SCENARIO_MUTATION: base({
    capability_id: "BOM_SCENARIO_MUTATION",
    supported_operational_question: "How does a specified BOM override replace the baseline twin BOM representation?",
    minimum_evidence: [r("baseline", ["BASELINE_TWIN_SNAPSHOT"]), r("bom-override", ["BOM_OVERRIDE"])],
    optional_evidence: ["PLAN_BOM_EDGE", "AUTHORITATIVE_MASTER_BOM"], unnecessary_evidence: ["PROVIDER_CREDENTIAL"],
    evidence_dependencies: ["BASELINE_AND_SCENARIO_IDENTITIES_ARE_DISTINCT", "SCENARIO_OVERRIDE_BOM_IS_VALID"],
    limitations: [SOURCE_PRECEDENCE_LIMITATION],
  }),
  JUNIOR_SKU_SUPPLY_CHAIN_ADVISORY: base({
    capability_id: "JUNIOR_SKU_SUPPLY_CHAIN_ADVISORY",
    supported_operational_question: "Which deterministic SKU-level supply actions best reduce current order shortage under the supplied constraints?",
    minimum_evidence: [r("request-identity", ["DETERMINISTIC_REQUEST_ID"])],
    optional_evidence: ["MOVEMENT_EVENT", "OPTIMIZER_CONSTRAINTS", "REALITY_SNAPSHOT", "ORDER_DUE_DATE"],
    unnecessary_evidence: ["EXTERNAL_LLM_OUTPUT", "PROVIDER_CREDENTIAL"],
    evidence_dependencies: ["OPTIMIZER_ORDER_INVENTORY_IDENTITIES_ARE_COHERENT", "OPTIMIZER_QUANTITIES_SHARE_UNIT"],
    composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"], grants_execution: false,
  }),
  JUNIOR_GRAPH_TOPOLOGY_ADVISORY: base({
    capability_id: "JUNIOR_GRAPH_TOPOLOGY_ADVISORY",
    supported_operational_question: "Which component-level shortage actions follow from a sufficiently structured material-flow topology?",
    minimum_evidence: [
      r("request-identity", ["DETERMINISTIC_REQUEST_ID"]), r("bom-structure", ["PLAN_BOM_EDGE"]),
      r("operational-topology", ["OPERATIONAL_TOPOLOGY"]), r("topology-confidence", ["TOPOLOGY_CONFIDENCE"]),
    ],
    optional_evidence: ["MOVEMENT_EVENT", "OPTIMIZER_CONSTRAINTS", "REALITY_SNAPSHOT"],
    unnecessary_evidence: ["EXTERNAL_LLM_OUTPUT", "PROVIDER_CREDENTIAL", "ORDER_DUE_DATE"],
    evidence_dependencies: [
      "OPTIMIZER_ORDER_INVENTORY_IDENTITIES_ARE_COHERENT", "OPTIMIZER_QUANTITIES_SHARE_UNIT",
      "GRAPH_MODE_THRESHOLD_IS_SATISFIED", "BOM_COMPONENT_IDENTITIES_MATCH_DEMAND",
    ],
    composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"], grants_execution: false,
  }),
  JUNIOR_COMPONENT_DEMAND_ADVISORY: base({
    capability_id: "JUNIOR_COMPONENT_DEMAND_ADVISORY",
    supported_operational_question: "What component demand and shortage follow from order demand expanded through the supplied BOM?",
    minimum_evidence: [r("request-identity", ["DETERMINISTIC_REQUEST_ID"]), r("bom-structure", ["PLAN_BOM_EDGE"])],
    optional_evidence: ["OPERATIONAL_TOPOLOGY", "TOPOLOGY_CONFIDENCE"],
    unnecessary_evidence: ["EXTERNAL_LLM_OUTPUT", "PROVIDER_CREDENTIAL", "ORDER_DUE_DATE"],
    evidence_dependencies: [
      "OPTIMIZER_ORDER_INVENTORY_IDENTITIES_ARE_COHERENT", "OPTIMIZER_QUANTITIES_SHARE_UNIT", "BOM_COMPONENT_IDENTITIES_MATCH_DEMAND",
    ],
    composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"], grants_execution: false,
  }),
  JUNIOR_REALITY_AWARE_ADVISORY: base({
    capability_id: "JUNIOR_REALITY_AWARE_ADVISORY",
    supported_operational_question: "Which deterministic supply actions remain preferable after current reality assumptions and topology context are considered?",
    minimum_evidence: [r("request-identity", ["DETERMINISTIC_REQUEST_ID"]), r("reality-snapshot", ["REALITY_SNAPSHOT"])],
    optional_evidence: ["OPTIMIZER_CONSTRAINTS", "OPERATIONAL_TOPOLOGY", "TOPOLOGY_CONFIDENCE"],
    unnecessary_evidence: ["EXTERNAL_LLM_OUTPUT", "PROVIDER_CREDENTIAL", "ORDER_DUE_DATE"],
    evidence_dependencies: [
      "OPTIMIZER_ORDER_INVENTORY_IDENTITIES_ARE_COHERENT", "OPTIMIZER_QUANTITIES_SHARE_UNIT", "REALITY_EVIDENCE_MATCHES_OPTIMIZER_CONTEXT",
    ],
    composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"],
    conditional_evidence: [{
      condition_id: "MOVEMENT_INFORMED_REALITY",
      exact_condition: "Active only when movement-derived reality is supplied to influence lead-time or operational-context evaluation.",
      minimum_evidence: [r("movement-events", ["MOVEMENT_EVENT"])],
      evidence_dependencies: ["MOVEMENTS_HAVE_CLASSIFIED_DIRECTION", "MOVEMENTS_SHARE_INVENTORY_SKU_IDENTITY"],
    }],
    grants_execution: false,
  }),
  JUNIOR_FREEZE_HORIZON_ADVISORY: base({
    capability_id: "JUNIOR_FREEZE_HORIZON_ADVISORY",
    supported_operational_question: "How are shortage candidates scored within the configured freeze-horizon constraint?",
    minimum_evidence: [r("request-identity", ["DETERMINISTIC_REQUEST_ID"]), r("optimizer-constraints", ["OPTIMIZER_CONSTRAINTS"])],
    optional_evidence: [],
    unnecessary_evidence: ["ORDER_DUE_DATE", "EXTERNAL_LLM_OUTPUT", "PROVIDER_CREDENTIAL"],
    evidence_dependencies: [
      "OPTIMIZER_ORDER_INVENTORY_IDENTITIES_ARE_COHERENT", "OPTIMIZER_QUANTITIES_SHARE_UNIT", "FREEZE_HORIZON_IS_VALID",
    ],
    composed_capability_ids: ["DEMAND_INVENTORY_PRESSURE"],
    limitations: ["Current optimizer lateness KPI consumes freeze-horizon days, not order due dates."],
    grants_execution: false,
  }),
} satisfies Record<OperationalCapabilityIdV2, CapabilityMinimumEvidenceDeclarationV1>;

export const CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU2_V1 = deepFreeze(declarations);
