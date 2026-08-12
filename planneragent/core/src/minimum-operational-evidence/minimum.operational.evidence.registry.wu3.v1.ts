import type { CapabilityMinimumEvidenceDeclarationV1, OperationalCapabilityIdV3, OperationalEvidenceKindV1 } from "./minimum.operational.evidence.contracts.v1";
const unsupported = ["EMPLOYEE_PERSONAL_DATA", "PAYROLL_DATA", "SUPPLIER_OR_CUSTOMER_CONTRACT", "MARGIN_DATA", "BANK_DATA", "TAX_DATA", "EMAIL_ARCHIVE", "PROVIDER_CREDENTIAL", "UNRELATED_MASTER_DATA", "MACHINE_CAPACITY", "RESOURCE_CAPACITY"] as const satisfies readonly OperationalEvidenceKindV1[];
const r = (requirement_id: string, accepted_evidence: readonly OperationalEvidenceKindV1[]) => ({ requirement_id, accepted_evidence, minimum_occurrences: 1 });
const declarations = {
  SCOPED_OPERATIONAL_DATA_AWARENESS: {
    version: 1, capability_id: "SCOPED_OPERATIONAL_DATA_AWARENESS",
    supported_operational_question: "Which operational evidence modality is meaningfully present within the exact evaluation scope?",
    minimum_evidence: [r("meaningful-scoped-operational-evidence", ["DEMAND_ORDER", "PLAN_ORDER", "INVENTORY_POSITION", "INVENTORY_SNAPSHOT", "MOVEMENT_EVENT", "PRODUCTION_OUTPUT_EVENT", "MATERIAL_CONSUMPTION_EVENT", "PLAN_BOM_EDGE", "AUTHORITATIVE_MASTER_BOM", "OPERATIONAL_TOPOLOGY"])],
    optional_evidence: ["ORDER_RELATIONSHIP", "PLAN_STRUCTURE_QUALITY", "EVIDENCE_TIMESTAMP"], unsupported_evidence: unsupported,
    unnecessary_evidence: ["TOPOLOGY_CONFIDENCE"], evidence_dependencies: [], evidence_substitutions: [], determination: "DETERMINISTIC",
    evidence_semantics: "TECHNICALLY_EVALUABLE", limitations: ["The classifier's SNAPSHOT default is not evidence; at least one semantic operational evidence item is required."], grants_execution: false,
  },
  CANONICAL_REALITY_STABILITY: {
    version: 1, capability_id: "CANONICAL_REALITY_STABILITY",
    supported_operational_question: "Is there scoped evidence for evaluating the stability of operational reality?",
    minimum_evidence: [r("reality-stability-input", ["REALITY_ASSESSMENT", "PROCESS_INSTABILITY_ASSESSMENT", "BOM_DIVERGENCE_ASSESSMENT", "INVENTORY_RECONCILIATION_RESULT", "TOPOLOGY_CONFIDENCE", "OPERATIONAL_ASSUMPTION"])],
    optional_evidence: ["MOVEMENT_EVENT", "OPERATIONAL_TOPOLOGY", "PLAN_BOM_EDGE", "AUTHORITATIVE_MASTER_BOM"], unsupported_evidence: unsupported,
    unnecessary_evidence: [], evidence_dependencies: [], evidence_substitutions: [], determination: "DETERMINISTIC",
    evidence_semantics: "TECHNICALLY_EVALUABLE", limitations: ["ASSUMED is a Reality cognition result and is not equivalent to MOE insufficiency."], grants_execution: false,
  },
} as const satisfies Record<OperationalCapabilityIdV3, CapabilityMinimumEvidenceDeclarationV1>;
export const CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_WU3_V1 = Object.freeze(declarations);
