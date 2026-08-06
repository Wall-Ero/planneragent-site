import type {
  CapabilityMinimumEvidenceDeclarationV1,
  EvidenceSubstitutionV1,
  MinimumEvidenceEvaluationRequestV1,
  MinimumEvidenceEvaluationResultV1,
  OperationalEvidenceKindV1,
} from "./minimum.operational.evidence.contracts.v1";
import {
  CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1,
  resolveCapabilityMinimumEvidenceDeclarationV1,
} from "./minimum.operational.evidence.registry.v1";

const KNOWN_EVIDENCE = new Set<OperationalEvidenceKindV1>();
const KNOWN_DEPENDENCIES = new Set<string>();
for (const declaration of Object.values(CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1)) {
  for (const requirement of declaration.minimum_evidence) {
    for (const kind of requirement.accepted_evidence) KNOWN_EVIDENCE.add(kind);
  }
  for (const kind of declaration.optional_evidence) KNOWN_EVIDENCE.add(kind);
  for (const kind of declaration.unsupported_evidence) KNOWN_EVIDENCE.add(kind);
  for (const dependency of declaration.evidence_dependencies) KNOWN_DEPENDENCIES.add(dependency);
}

function result(
  value: MinimumEvidenceEvaluationResultV1,
): MinimumEvidenceEvaluationResultV1 {
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) Object.freeze(child);
  }
  return Object.freeze(value);
}

function invalid(capabilityId: unknown): MinimumEvidenceEvaluationResultV1 {
  return result({
    version: 1,
    capability_id: typeof capabilityId === "string" ? capabilityId : "",
    status: "INPUT_INVALID",
    sufficient: false,
    missing_requirement_ids: [],
    unsatisfied_dependencies: [],
    optional_evidence_present: [],
    substitutions_applied: [],
    unsupported_evidence_present: [],
    reason_codes: ["MINIMUM_EVIDENCE_INPUT_INVALID"],
  });
}

function appliedSubstitutions(
  declaration: CapabilityMinimumEvidenceDeclarationV1,
  counts: ReadonlyMap<OperationalEvidenceKindV1, number>,
): EvidenceSubstitutionV1[] {
  return declaration.evidence_substitutions.filter(substitution =>
    (counts.get(substitution.required_evidence) ?? 0) === 0 &&
    (counts.get(substitution.substitute_evidence) ?? 0) > 0,
  );
}

export function evaluateCapabilityMinimumEvidenceV1(
  request: MinimumEvidenceEvaluationRequestV1,
): MinimumEvidenceEvaluationResultV1 {
  if (request?.version !== 1 || typeof request.capability_id !== "string" ||
    request.capability_id.length === 0 || !Array.isArray(request.presented_evidence) ||
    !Array.isArray(request.satisfied_dependencies) || request.presented_evidence.some(item =>
      !item || typeof item.kind !== "string" || !Number.isSafeInteger(item.occurrences) ||
      item.occurrences <= 0 || !KNOWN_EVIDENCE.has(item.kind)) ||
    request.satisfied_dependencies.some(dependency =>
      typeof dependency !== "string" || !KNOWN_DEPENDENCIES.has(dependency))) {
    return invalid(request?.capability_id);
  }

  const declaration = resolveCapabilityMinimumEvidenceDeclarationV1(request.capability_id);
  if (!declaration) {
    return result({
      version: 1, capability_id: request.capability_id,
      status: "CAPABILITY_UNDECLARED", sufficient: false,
      missing_requirement_ids: [], unsatisfied_dependencies: [],
      optional_evidence_present: [], substitutions_applied: [],
      unsupported_evidence_present: [], reason_codes: ["CAPABILITY_HAS_NO_MINIMUM_EVIDENCE_DECLARATION"],
    });
  }

  const counts = new Map<OperationalEvidenceKindV1, number>();
  for (const item of request.presented_evidence) {
    counts.set(item.kind, (counts.get(item.kind) ?? 0) + item.occurrences);
  }
  const unsupported = declaration.unsupported_evidence.filter(kind => (counts.get(kind) ?? 0) > 0);
  const optional = declaration.optional_evidence.filter(kind => (counts.get(kind) ?? 0) > 0);
  const missing = declaration.minimum_evidence.filter(requirement =>
    requirement.accepted_evidence.reduce((sum, kind) => sum + (counts.get(kind) ?? 0), 0) <
      requirement.minimum_occurrences,
  ).map(requirement => requirement.requirement_id);
  const satisfied = new Set(request.satisfied_dependencies);
  const dependencies = declaration.evidence_dependencies.filter(dependency => !satisfied.has(dependency));
  const substitutions = appliedSubstitutions(declaration, counts);

  if (unsupported.length > 0) {
    return result({
      version: 1, capability_id: declaration.capability_id,
      status: "UNSUPPORTED_EVIDENCE_PRESENT", sufficient: false,
      missing_requirement_ids: missing, unsatisfied_dependencies: dependencies,
      optional_evidence_present: optional, substitutions_applied: substitutions,
      unsupported_evidence_present: unsupported,
      reason_codes: ["UNSUPPORTED_EVIDENCE_MUST_NOT_BE_ACQUIRED"],
    });
  }
  if (missing.length > 0 || dependencies.length > 0) {
    return result({
      version: 1, capability_id: declaration.capability_id,
      status: "INSUFFICIENT", sufficient: false,
      missing_requirement_ids: missing, unsatisfied_dependencies: dependencies,
      optional_evidence_present: optional, substitutions_applied: substitutions,
      unsupported_evidence_present: [],
      reason_codes: [
        ...(missing.length > 0 ? ["MINIMUM_EVIDENCE_MISSING"] : []),
        ...(dependencies.length > 0 ? ["EVIDENCE_DEPENDENCY_UNSATISFIED"] : []),
      ],
    });
  }
  return result({
    version: 1, capability_id: declaration.capability_id,
    status: "SUFFICIENT", sufficient: true,
    missing_requirement_ids: [], unsatisfied_dependencies: [],
    optional_evidence_present: optional, substitutions_applied: substitutions,
    unsupported_evidence_present: [], reason_codes: ["MINIMUM_EVIDENCE_SATISFIED"],
  });
}
