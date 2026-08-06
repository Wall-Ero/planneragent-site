import type {
  CapabilityMinimumEvidenceDeclarationV1,
  OperationalCapabilityIdV1,
  OperationalEvidenceKindV1,
} from "./minimum.operational.evidence.contracts.v1";

const UNSUPPORTED_BY_OPERATIONAL_CAPABILITIES = Object.freeze([
  "EMPLOYEE_PERSONAL_DATA",
  "PAYROLL_DATA",
  "SUPPLIER_OR_CUSTOMER_CONTRACT",
  "MARGIN_DATA",
  "BANK_DATA",
  "TAX_DATA",
  "EMAIL_ARCHIVE",
  "PROVIDER_CREDENTIAL",
  "UNRELATED_MASTER_DATA",
] as const satisfies readonly OperationalEvidenceKindV1[]);

function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

const DECLARATIONS = freeze({
  DEMAND_INVENTORY_PRESSURE: {
    version: 1,
    capability_id: "DEMAND_INVENTORY_PRESSURE",
    supported_operational_question:
      "Which item demand currently exceeds the corresponding available inventory position?",
    minimum_evidence: [
      { requirement_id: "demand-orders", accepted_evidence: ["DEMAND_ORDER"], minimum_occurrences: 1 },
      { requirement_id: "inventory-positions", accepted_evidence: ["INVENTORY_POSITION"], minimum_occurrences: 1 },
    ],
    optional_evidence: ["FUTURE_SUPPLY_MOVEMENT"],
    unsupported_evidence: UNSUPPORTED_BY_OPERATIONAL_CAPABILITIES,
    evidence_dependencies: ["DEMAND_AND_INVENTORY_SHARE_ITEM_IDENTITY"],
    evidence_substitutions: [],
    determination: "DETERMINISTIC",
  },
  PLANNED_BOM_RECONSTRUCTION: {
    version: 1,
    capability_id: "PLANNED_BOM_RECONSTRUCTION",
    supported_operational_question:
      "Which component quantities are represented by the structure of the supplied production orders?",
    minimum_evidence: [
      { requirement_id: "planned-production-order", accepted_evidence: ["PLANNED_PRODUCTION_ORDER"], minimum_occurrences: 1 },
      { requirement_id: "planned-component-requirement", accepted_evidence: ["PLANNED_COMPONENT_REQUIREMENT"], minimum_occurrences: 1 },
    ],
    optional_evidence: [],
    unsupported_evidence: UNSUPPORTED_BY_OPERATIONAL_CAPABILITIES,
    evidence_dependencies: [
      "PLANNED_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE",
      "PLANNED_QUANTITIES_ARE_POSITIVE",
      "ITEM_IDENTITIES_ARE_COHERENT",
      "UNITS_ARE_COHERENT",
    ],
    evidence_substitutions: [],
    determination: "DETERMINISTIC",
  },
  HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION: {
    version: 1,
    capability_id: "HISTORICAL_PRODUCTION_BOM_RECONSTRUCTION",
    supported_operational_question:
      "What component-to-output ratios are demonstrated by linked historical production output and material consumption?",
    minimum_evidence: [
      {
        requirement_id: "production-output",
        accepted_evidence: ["PRODUCTION_OUTPUT_EVENT", "PRODUCTION_ORDER_OUTPUT_RECORD"],
        minimum_occurrences: 1,
      },
      {
        requirement_id: "material-consumption",
        accepted_evidence: ["MATERIAL_CONSUMPTION_EVENT", "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION"],
        minimum_occurrences: 1,
      },
    ],
    optional_evidence: ["PRODUCTION_EVENT_TIMESTAMP", "ADDITIONAL_MATCHED_PRODUCTION_SAMPLE"],
    unsupported_evidence: UNSUPPORTED_BY_OPERATIONAL_CAPABILITIES,
    evidence_dependencies: [
      "PRODUCTION_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE",
      "PRODUCTION_OUTPUT_QUANTITY_IS_POSITIVE",
      "MATERIAL_CONSUMPTION_QUANTITY_IS_NON_ZERO",
      "ITEM_IDENTITIES_ARE_COHERENT",
      "UNITS_ARE_COHERENT",
    ],
    evidence_substitutions: [
      {
        required_evidence: "PRODUCTION_OUTPUT_EVENT",
        substitute_evidence: "PRODUCTION_ORDER_OUTPUT_RECORD",
        repository_basis: "reality-builder-order-like-production-output-fallback-v1",
      },
      {
        required_evidence: "MATERIAL_CONSUMPTION_EVENT",
        substitute_evidence: "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION",
        repository_basis: "reality-builder-movement-like-consumption-fallback-v1",
      },
    ],
    determination: "DETERMINISTIC",
  },
  PLAN_VS_PRODUCTION_BOM_ALIGNMENT: {
    version: 1,
    capability_id: "PLAN_VS_PRODUCTION_BOM_ALIGNMENT",
    supported_operational_question:
      "Where does the production-order component structure diverge from historically observed production consumption?",
    minimum_evidence: [
      { requirement_id: "planned-production-order", accepted_evidence: ["PLANNED_PRODUCTION_ORDER"], minimum_occurrences: 1 },
      { requirement_id: "planned-component-requirement", accepted_evidence: ["PLANNED_COMPONENT_REQUIREMENT"], minimum_occurrences: 1 },
      {
        requirement_id: "production-output",
        accepted_evidence: ["PRODUCTION_OUTPUT_EVENT", "PRODUCTION_ORDER_OUTPUT_RECORD"],
        minimum_occurrences: 1,
      },
      {
        requirement_id: "material-consumption",
        accepted_evidence: ["MATERIAL_CONSUMPTION_EVENT", "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION"],
        minimum_occurrences: 1,
      },
    ],
    optional_evidence: ["PRODUCTION_EVENT_TIMESTAMP", "ADDITIONAL_MATCHED_PRODUCTION_SAMPLE"],
    unsupported_evidence: UNSUPPORTED_BY_OPERATIONAL_CAPABILITIES,
    evidence_dependencies: [
      "PLANNED_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE",
      "PLANNED_QUANTITIES_ARE_POSITIVE",
      "PRODUCTION_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE",
      "PRODUCTION_OUTPUT_QUANTITY_IS_POSITIVE",
      "MATERIAL_CONSUMPTION_QUANTITY_IS_NON_ZERO",
      "ITEM_IDENTITIES_ARE_COHERENT",
      "UNITS_ARE_COHERENT",
      "PLANNED_AND_PRODUCTION_IDENTITIES_ARE_COHERENT",
    ],
    evidence_substitutions: [
      {
        required_evidence: "PRODUCTION_OUTPUT_EVENT",
        substitute_evidence: "PRODUCTION_ORDER_OUTPUT_RECORD",
        repository_basis: "reality-builder-order-like-production-output-fallback-v1",
      },
      {
        required_evidence: "MATERIAL_CONSUMPTION_EVENT",
        substitute_evidence: "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION",
        repository_basis: "reality-builder-movement-like-consumption-fallback-v1",
      },
    ],
    determination: "DETERMINISTIC",
  },
  AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON: {
    version: 1,
    capability_id: "AUTHORITATIVE_VS_RECONSTRUCTED_BOM_COMPARISON",
    supported_operational_question:
      "Where does an authoritative master BOM diverge from historically reconstructed production consumption?",
    minimum_evidence: [
      { requirement_id: "authoritative-master-bom", accepted_evidence: ["AUTHORITATIVE_MASTER_BOM"], minimum_occurrences: 1 },
      {
        requirement_id: "production-output",
        accepted_evidence: ["PRODUCTION_OUTPUT_EVENT", "PRODUCTION_ORDER_OUTPUT_RECORD"],
        minimum_occurrences: 1,
      },
      {
        requirement_id: "material-consumption",
        accepted_evidence: ["MATERIAL_CONSUMPTION_EVENT", "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION"],
        minimum_occurrences: 1,
      },
    ],
    optional_evidence: ["PRODUCTION_EVENT_TIMESTAMP", "ADDITIONAL_MATCHED_PRODUCTION_SAMPLE"],
    unsupported_evidence: UNSUPPORTED_BY_OPERATIONAL_CAPABILITIES,
    evidence_dependencies: [
      "PRODUCTION_ROWS_SHARE_PRODUCTION_ORDER_REFERENCE",
      "PRODUCTION_OUTPUT_QUANTITY_IS_POSITIVE",
      "MATERIAL_CONSUMPTION_QUANTITY_IS_NON_ZERO",
      "ITEM_IDENTITIES_ARE_COHERENT",
      "UNITS_ARE_COHERENT",
      "MASTER_AND_RECONSTRUCTED_IDENTITIES_ARE_COHERENT",
    ],
    evidence_substitutions: [
      {
        required_evidence: "PRODUCTION_OUTPUT_EVENT",
        substitute_evidence: "PRODUCTION_ORDER_OUTPUT_RECORD",
        repository_basis: "reality-builder-order-like-production-output-fallback-v1",
      },
      {
        required_evidence: "MATERIAL_CONSUMPTION_EVENT",
        substitute_evidence: "PRODUCTION_LINKED_WAREHOUSE_CONSUMPTION",
        repository_basis: "reality-builder-movement-like-consumption-fallback-v1",
      },
    ],
    determination: "DETERMINISTIC",
  },
} satisfies Record<OperationalCapabilityIdV1, CapabilityMinimumEvidenceDeclarationV1>);

export const CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1 = DECLARATIONS;

export function resolveCapabilityMinimumEvidenceDeclarationV1(
  capabilityId: string,
): CapabilityMinimumEvidenceDeclarationV1 | null {
  return Object.prototype.hasOwnProperty.call(DECLARATIONS, capabilityId)
    ? DECLARATIONS[capabilityId as OperationalCapabilityIdV1]
    : null;
}
