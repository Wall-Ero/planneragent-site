export type OperationalCapabilityIdV1 =
  | "DEMAND_INVENTORY_PRESSURE"
  | "PLANNED_BOM_RECONSTRUCTION"
  | "HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION"
  | "PLAN_VS_PRODUCTION_BOM_ALIGNMENT"
  | "AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON";

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
  | "MASTER_AND_RECONSTRUCTED_IDENTITIES_ARE_COHERENT";

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

export interface CapabilityMinimumEvidenceDeclarationV1 {
  readonly version: 1;
  readonly capability_id: OperationalCapabilityIdV1;
  readonly supported_operational_question: string;
  readonly minimum_evidence: readonly MinimumEvidenceRequirementV1[];
  readonly optional_evidence: readonly OperationalEvidenceKindV1[];
  readonly unsupported_evidence: readonly OperationalEvidenceKindV1[];
  readonly evidence_dependencies: readonly EvidenceDependencyIdV1[];
  readonly evidence_substitutions: readonly EvidenceSubstitutionV1[];
  readonly determination: "DETERMINISTIC";
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
}

export type MinimumEvidenceEvaluationResultV1 = Readonly<{
  version: 1;
  capability_id: string;
  status:
    | "SUFFICIENT"
    | "INSUFFICIENT"
    | "UNSUPPORTED_EVIDENCE_PRESENT"
    | "CAPABILITY_UNDECLARED"
    | "INPUT_INVALID";
  sufficient: boolean;
  missing_requirement_ids: readonly string[];
  unsatisfied_dependencies: readonly EvidenceDependencyIdV1[];
  optional_evidence_present: readonly OperationalEvidenceKindV1[];
  substitutions_applied: readonly EvidenceSubstitutionV1[];
  unsupported_evidence_present: readonly OperationalEvidenceKindV1[];
  reason_codes: readonly string[];
}>;
