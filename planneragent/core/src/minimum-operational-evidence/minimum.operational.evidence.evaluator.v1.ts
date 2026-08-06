import type {
  CapabilityMinimumEvidenceDeclarationV1,
  EvidenceSubstitutionV1,
  MinimumEvidenceEvaluationRequestV1,
  MinimumEvidenceEvaluationResultV1,
  OperationalEvidenceKindV1,
} from "./minimum.operational.evidence.contracts.v1";
import {
  ALL_CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1,
  resolveCapabilityMinimumEvidenceDeclarationV1,
} from "./minimum.operational.evidence.registry.v1";

const KNOWN_EVIDENCE = new Set<OperationalEvidenceKindV1>();
const KNOWN_DEPENDENCIES = new Set<string>();
for (const declaration of Object.values(
  ALL_CAPABILITY_MINIMUM_EVIDENCE_DECLARATIONS_V1,
) as CapabilityMinimumEvidenceDeclarationV1[]) {
  for (const requirement of declaration.minimum_evidence) {
    for (const kind of requirement.accepted_evidence) KNOWN_EVIDENCE.add(kind);
  }
  for (const kind of declaration.optional_evidence) KNOWN_EVIDENCE.add(kind);
  for (const kind of declaration.unsupported_evidence) KNOWN_EVIDENCE.add(kind);
  for (const kind of declaration.unnecessary_evidence ?? []) KNOWN_EVIDENCE.add(kind);
  for (const dependency of declaration.evidence_dependencies) KNOWN_DEPENDENCIES.add(dependency);
  for (const conditional of declaration.conditional_evidence ?? []) {
    for (const requirement of conditional.minimum_evidence) {
      for (const kind of requirement.accepted_evidence) KNOWN_EVIDENCE.add(kind);
    }
    for (const dependency of conditional.evidence_dependencies) KNOWN_DEPENDENCIES.add(dependency);
  }
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
  declarations: readonly CapabilityMinimumEvidenceDeclarationV1[],
  counts: ReadonlyMap<OperationalEvidenceKindV1, number>,
): EvidenceSubstitutionV1[] {
  return declarations.flatMap(declaration => declaration.evidence_substitutions).filter(substitution =>
    (counts.get(substitution.required_evidence) ?? 0) === 0 &&
    (counts.get(substitution.substitute_evidence) ?? 0) > 0,
  );
}

function composeDeclarations(
  declaration: CapabilityMinimumEvidenceDeclarationV1,
  seen = new Set<string>(),
): CapabilityMinimumEvidenceDeclarationV1[] {
  if (seen.has(declaration.capability_id)) return [];
  seen.add(declaration.capability_id);
  const composed = (declaration.composed_capability_ids ?? []).flatMap(id => {
    const child = resolveCapabilityMinimumEvidenceDeclarationV1(id);
    return child ? composeDeclarations(child, seen) : [];
  });
  return [...composed, declaration];
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
      typeof dependency !== "string" || !KNOWN_DEPENDENCIES.has(dependency)) ||
    (request.active_conditions !== undefined && !Array.isArray(request.active_conditions))) {
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

  const knownConditions = new Set((declaration.conditional_evidence ?? []).map(value => value.condition_id));
  const activeConditions = request.active_conditions ?? [];
  if (activeConditions.some(condition => typeof condition !== "string" || !knownConditions.has(condition))) {
    return invalid(request.capability_id);
  }
  const declarations = composeDeclarations(declaration);
  const conditional = (declaration.conditional_evidence ?? [])
    .filter(value => activeConditions.includes(value.condition_id));

  const counts = new Map<OperationalEvidenceKindV1, number>();
  for (const item of request.presented_evidence) {
    counts.set(item.kind, (counts.get(item.kind) ?? 0) + item.occurrences);
  }
  const unsupported = Array.from(new Set(declarations.flatMap(value => value.unsupported_evidence)))
    .filter(kind => (counts.get(kind) ?? 0) > 0);
  const unnecessary = Array.from(new Set(declarations.flatMap(value => value.unnecessary_evidence ?? [])))
    .filter(kind => (counts.get(kind) ?? 0) > 0);
  const optional = Array.from(new Set(declarations.flatMap(value => value.optional_evidence)))
    .filter(kind => (counts.get(kind) ?? 0) > 0);
  const requirements = [
    ...declarations.flatMap(value => value.minimum_evidence),
    ...conditional.flatMap(value => value.minimum_evidence),
  ];
  const missing = requirements.filter(requirement =>
    requirement.accepted_evidence.reduce((sum, kind) => sum + (counts.get(kind) ?? 0), 0) <
      requirement.minimum_occurrences,
  ).map(requirement => requirement.requirement_id);
  const satisfied = new Set(request.satisfied_dependencies);
  const requiredDependencies = Array.from(new Set([
    ...declarations.flatMap(value => value.evidence_dependencies),
    ...conditional.flatMap(value => value.evidence_dependencies),
  ]));
  const dependencies = requiredDependencies.filter(dependency => !satisfied.has(dependency));
  const substitutions = appliedSubstitutions(declarations, counts);

  if (unsupported.length > 0) {
    return result({
      version: 1, capability_id: declaration.capability_id,
      status: "UNSUPPORTED_EVIDENCE_PRESENT", sufficient: false,
      missing_requirement_ids: missing, unsatisfied_dependencies: dependencies,
      optional_evidence_present: optional, substitutions_applied: substitutions,
      unsupported_evidence_present: unsupported,
      unnecessary_evidence_present: unnecessary,
      reason_codes: ["UNSUPPORTED_EVIDENCE_MUST_NOT_BE_ACQUIRED"],
    });
  }
  if (unnecessary.length > 0) {
    return result({
      version: 1, capability_id: declaration.capability_id,
      status: "UNNECESSARY_EVIDENCE_PRESENT", sufficient: false,
      missing_requirement_ids: missing, unsatisfied_dependencies: dependencies,
      optional_evidence_present: optional, substitutions_applied: substitutions,
      unsupported_evidence_present: [], unnecessary_evidence_present: unnecessary,
      reason_codes: ["UNNECESSARY_EVIDENCE_MUST_NOT_BE_ACQUIRED"],
    });
  }
  if (missing.length > 0 || dependencies.length > 0) {
    return result({
      version: 1, capability_id: declaration.capability_id,
      status: "INSUFFICIENT", sufficient: false,
      missing_requirement_ids: missing, unsatisfied_dependencies: dependencies,
      optional_evidence_present: optional, substitutions_applied: substitutions,
      unsupported_evidence_present: [],
      unnecessary_evidence_present: [],
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
    unsupported_evidence_present: [], unnecessary_evidence_present: [],
    reason_codes: ["MINIMUM_EVIDENCE_SATISFIED"],
  });
}
