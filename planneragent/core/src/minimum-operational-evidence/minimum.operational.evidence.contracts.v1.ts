export type OperationalCapabilityIdV1 =
  | "DEMAND_INVENTORY_PRESSURE"
  | "PLANNED_BOM_RECONSTRUCTION"
  | "HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION"
  | "PLAN_VS_PRODUCTION_BOM_ALIGNMENT"
  | "AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON";

export type OperationalCapabilityIdV2 =
  | "CANONICAL_COCKPIT_PLAN_COHERENCE"
  | "BASIC_ORDER_PLAN_COHERENCE"
  | "STRUCTURAL_ORDER_PLAN_COHERENCE"
  | "PRODUCTION_ORDER_DERIVED_PLAN_COHERENCE"
  | "BOM_TOPOLOGY_ENHANCED_PLAN_COHERENCE"
  | "FULL_REALITY_AWARE_DECISION_PRESSURE"
  | "INVENTORY_SNAPSHOT_RECONCILIATION"
  | "MOVEMENT_DERIVED_INVENTORY_RECONCILIATION"
  | "INVENTORY_RECONCILIATION_ANOMALY_ANALYSIS"
  | "SUPPLIER_DELAY_SCENARIO_MUTATION"
  | "INVENTORY_SCENARIO_MUTATION"
  | "DEMAND_SCENARIO_MUTATION"
  | "BOM_SCENARIO_MUTATION"
  | "JUNIOR_SKU_SUPPLY_CHAIN_ADVISORY"
  | "JUNIOR_GRAPH_TOPOLOGY_ADVISORY"
  | "JUNIOR_COMPONENT_DEMAND_ADVISORY"
  | "JUNIOR_REALITY_AWARE_ADVISORY"
  | "JUNIOR_FREEZE_HORIZON_ADVISORY";

export type OperationalCapabilityId = OperationalCapabilityIdV1 | OperationalCapabilityIdV2;

export type OperationalEvidenceKindV1 =
  | "DEMAND_ORDER"
  | "INVENTORY_POSITION"
  | "PLANNED_PRODUCTION_ORDER"
  | "PLANNED_COMPONENT_REQUIREMENT"
  | "PRODUCTION_OUTPUT_EVENT"
  | "PRODUCTION_ORDER_OUTPUT_RECORD"
  | "MATERIAL_CONSUMPTION_EVENT"
  | "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION"
  | "AUTHORITATIVE_MASTER_BOM"
  | "FUTURE_SUPPLY_MOVEMENT"
  | "PRODUCTION_EVENT_TIMESTAMP"
  | "ADDITIONAL_MATCHED_PRODUCTION_SAMPLE"
  | "PLAN_ORDER"
  | "ORDER_RELATIONSHIP"
  | "PLAN_BOM_EDGE"
  | "PLAN_STRUCTURE_QUALITY"
  | "PROBLEM_CLASSIFICATION"
  | "CORRECTION_EFFECT"
  | "OPTIMIZER_SHORTAGE_RESULT"
  | "EXECUTION_GAP_ASSESSMENT"
  | "REALITY_ASSESSMENT"
  | "MOVEMENT_EVENT"
  | "INVENTORY_SNAPSHOT"
  | "RECONSTRUCTED_INVENTORY_STATE"
  | "INVENTORY_RECONCILIATION_RESULT"
  | "BASELINE_TWIN_SNAPSHOT"
  | "SUPPLY_POSITION"
  | "SUPPLIER_DELAY_OVERRIDE"
  | "INVENTORY_OVERRIDE"
  | "DEMAND_OVERRIDE"
  | "BOM_OVERRIDE"
  | "OPERATIONAL_TOPOLOGY"
  | "TOPOLOGY_CONFIDENCE"
  | "REALITY_SNAPSHOT"
  | "OPTIMIZER_CONSTRAINTS"
  | "DETERMINISTIC_REQUEST_ID"
  | "ORDER_DUE_DATE"
  | "WAREHOUSE_IDENTITY"
  | "EVIDENCE_TIMESTAMP"
  | "EXTERNAL_LLM_OUTPUT"
  | "MACHINE_CAPACITY"
  | "RESOURCE_CAPACITY"
  | "EMPLOYEE_PERSONAL_DATA"
  | "PAYROLL_DATA"
  | "SUPPLIER_OR_CUSTOMER_CONTRACT"
  | "MARGIN_DATA"
  | "BANK_DATA"
  | "TAX_DATA"
  | "EMAIL_ARCHIVE"
  | "PROVIDER_CREDENTIAL"
  | "UNRELATED_MASTER_DATA";

export type EvidenceDependencyIdV1 =
  | "DEMAND_AND_INVENTORY_SHARE_ITEM_IDENTITY"
  | "PLANNED_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE"
  | "PLANNED_QUANTITIES_ARE_POSITIVE"
  | "PRODUCTION_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE"
  | "PRODUCTION_OUTPUT_QUANTITY_IS_POSITIVE"
  | "MATERIAL_CONSUMPTION_QUANTITY_IS_NON_ZERO"
  | "ITEM_IDENTITIES_ARE_COHERENT"
  | "UNITS_ARE_COHERENT"
  | "PLANNED_AND_PRODUCTION_IDENTITIES_ARE_COHERENT"
  | "MASTER_AND_RECONSTRUCTED_IDENTITIES_ARE_COHERENT"
  | "PLAN_ORDER_IDENTITY_IS_STABLE"
  | "ORDER_RELATIONSHIPS_REFERENCE_PLAN_ORDERS"
  | "PLAN_STRUCTURE_IS_OPERATIONALLY_MEANINGFUL"
  | "PRESSURE_QUANTITIES_SHARE_UNIT"
  | "MOVEMENTS_HAVE_CLASSIFIED_DIRECTION"
  | "INVENTORY_STATES_SHARE_SKU_IDENTITY"
  | "INVENTORY_STATES_SHARE_UNIT"
  | "MOVEMENTS_SHARE_INVENTORY_SKU_IDENTITY"
  | "BASELINE_AND_SCENARIO_IDENTITIES_ARE_DISTINCT"
  | "OVERRIDE_TARGET_MATCHES_BASELINE_IDENTITY"
  | "SUPPLY_ETA_IS_VALID"
  | "SCENARIO_OVERRIDE_QUANTITY_IS_VALID"
  | "SCENARIO_OVERRIDE_BOM_IS_VALID"
  | "OPTIMIZER_ORDER_INVENTORY_IDENTITIES_ARE_COHERENT"
  | "OPTIMIZER_QUANTITIES_SHARE_UNIT"
  | "GRAPH_MODE_THRESHOLD_IS_SATISFIED"
  | "BOM_COMPONENT_IDENTITIES_MATCH_DEMAND"
  | "REALITY_EVIDENCE_MATCHES_OPTIMIZER_CONTEXT"
  | "FREEZE_HORIZON_IS_VALID";

export interface MinimumEvidenceRequirementV1 {
  readonly requirement_id: string;
  readonly accepted_evidence: readonly OperationalEvidenceKindV1[];
  readonly minimum_occurrences: number;
}

export interface EvidenceSubstitutionV1 {
  readonly required_evidence: OperationalEvidenceKindV1;
  readonly substitute_evidence: OperationalEvidenceKindV1;
  readonly repository_basis: string;
}

export interface ConditionalEvidenceRequirementV1 {
  readonly condition_id: string;
  readonly exact_condition: string;
  readonly minimum_evidence: readonly MinimumEvidenceRequirementV1[];
  readonly evidence_dependencies: readonly EvidenceDependencyIdV1[];
}

export interface CapabilityMinimumEvidenceDeclarationV1 {
  readonly version: 1;
  readonly capability_id: OperationalCapabilityId;
  readonly supported_operational_question: string;
  readonly minimum_evidence: readonly MinimumEvidenceRequirementV1[];
  readonly optional_evidence: readonly OperationalEvidenceKindV1[];
  readonly unsupported_evidence: readonly OperationalEvidenceKindV1[];
  readonly evidence_dependencies: readonly EvidenceDependencyIdV1[];
  readonly evidence_substitutions: readonly EvidenceSubstitutionV1[];
  readonly determination: "DETERMINISTIC";
  readonly conditional_evidence?: readonly ConditionalEvidenceRequirementV1[];
  readonly unnecessary_evidence?: readonly OperationalEvidenceKindV1[];
  readonly composed_capability_ids?: readonly OperationalCapabilityId[];
  readonly evidence_semantics?: "TECHNICALLY_EVALUABLE" | "OPERATIONALLY_MEANINGFUL";
  readonly limitations?: readonly string[];
  readonly grants_execution?: false;
}

export interface PresentedOperationalEvidenceV1 {
  readonly kind: OperationalEvidenceKindV1;
  readonly occurrences: number;
}

export interface MinimumEvidenceEvaluationRequestV1 {
  readonly version: 1;
  readonly capability_id: string;
  readonly presented_evidence: readonly PresentedOperationalEvidenceV1[];
  readonly satisfied_dependencies: readonly EvidenceDependencyIdV1[];
  readonly active_conditions?: readonly string[];
}

export type MinimumEvidenceEvaluationResultV1 = Readonly<{
  version: 1;
  capability_id: string;
  status:
    | "SUFFICIENT"
    | "INSUFFICIENT"
    | "UNSUPPORTED_EVIDENCE_PRESENT"
    | "UNNECESSARY_EVIDENCE_PRESENT"
    | "CAPABILITY_UNDECLARED"
    | "INPUT_INVALID";
  sufficient: boolean;
  missing_requirement_ids: readonly string[];
  unsatisfied_dependencies: readonly EvidenceDependencyIdV1[];
  optional_evidence_present: readonly OperationalEvidenceKindV1[];
  substitutions_applied: readonly EvidenceSubstitutionV1[];
  unsupported_evidence_present: readonly OperationalEvidenceKindV1[];
  unnecessary_evidence_present?: readonly OperationalEvidenceKindV1[];
  reason_codes: readonly string[];
}>;
