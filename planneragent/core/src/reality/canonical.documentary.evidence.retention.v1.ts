import {
  verifyOperationalSignalEvaluationScopeV1,
  type OperationalSignalScopeBindingV1,
} from "../cockpit/operational.signal.evaluation.scope.v1";
import {
  retrieveCanonicalStructuredRealityV1,
  verifyCanonicalOperationalRealityCompositionV1,
  type CanonicalOperationalRealityCompositionV1,
  type CanonicalOperationalRealityEvidenceV1,
  type OperationalRealityEvidenceRoleV1,
} from "./canonical.operational.reality.composition.v1";
import {
  classifyGovernedOperationalEvidenceV1,
  type GovernedOperationalEvidenceIntroductionV1,
} from "./governed.operational.representation.v1";

type IntervalBoundaryV1 = "INCLUSIVE" | "EXCLUSIVE" | "UNSPECIFIED";
type IntervalPrecisionV1 = "DATE" | "MINUTE" | "SECOND" | "FRACTION";

export type SourceObservationTimeV1 =
  | Readonly<{ kind: "INSTANT"; at: string }>
  | Readonly<{ kind: "DATE"; date: string }>
  | Readonly<{
      kind: "RANGE";
      from: string;
      until: string;
      precision: IntervalPrecisionV1;
      from_boundary: IntervalBoundaryV1;
      until_boundary: IntervalBoundaryV1;
    }>
  | Readonly<{ kind: "UNKNOWN" }>;

type AdHocIntroductionV1 = Extract<
  GovernedOperationalEvidenceIntroductionV1,
  { introduction_mode: "REQUEST_BOUND_AD_HOC" }
>;

export type DocumentaryEvidenceEntryV1 = Readonly<{
  documentary_ref: string;
  source_document_digest: string;
  original_source_identity_ref: string;
  introduction: AdHocIntroductionV1;
  source_observation_time: SourceObservationTimeV1;
  documentary_acquired_at: string;
  linked_observation_ref?: string;
}>;

type CompositionBindingV1 = Readonly<{
  composition_id: string;
  composition_digest: string;
}>;

export type CanonicalDocumentaryEvidenceRetentionV1 = Readonly<{
  version: 1;
  tenant_id: string;
  company_id: string;
  request_id: string;
  scope_id: string;
  scope_digest: string;
  evidence_selection_ref: string;
  source_snapshot_ref: string;
  evaluation_cutoff: string;
  evaluated_at: string;
  composition: CompositionBindingV1 | null;
  entries: readonly DocumentaryEvidenceEntryV1[];
  observational_only: true;
  grants_authority: false;
  grants_execution: false;
  retention_id: string;
  retention_digest: string;
  digest_algorithm: "SHA-256";
}>;

type DocumentaryRetentionContextV1 = Readonly<{
  tenant_id: string;
  evaluation_scope: OperationalSignalScopeBindingV1;
  composition: CanonicalOperationalRealityCompositionV1 | null;
}>;

type ExpectedDocumentaryRetentionV1 = DocumentaryRetentionContextV1 & Readonly<{
  /** Obtain this identity from trusted persistence or the original admitted result. */
  retention_id: string;
}>;

const timeError = "DOCUMENTARY_RETENTION_TIME_INVALID";
const entryError = "DOCUMENTARY_RETENTION_ENTRY_INVALID";
const integrityError = "DOCUMENTARY_RETENTION_INTEGRITY_INVALID";
const linkError = "DOCUMENTARY_RETENTION_LINK_INVALID";
const compositionStructureError = "DOCUMENTARY_RETENTION_COMPOSITION_STRUCTURE_INVALID";
const boundaryError = "DOCUMENTARY_RETENTION_EVALUATION_BOUNDARY_INVALID";
const identityPrefix = "canonical-documentary-evidence-retention:sha256:";
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const zonedEndpointPattern = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d+))?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const intervalBoundaries = new Set<IntervalBoundaryV1>(["INCLUSIVE", "EXCLUSIVE", "UNSPECIFIED"]);

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function orderStrings(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function exactKeys(value: object, keys: readonly string[], code: string): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(code);
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) throw new Error(code);
}

function instantMilliseconds(value: string, code: string): number {
  if (typeof value !== "string") throw new Error(code);
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) throw new Error(code);
  return milliseconds;
}

function validateDate(value: string): void {
  const match = typeof value === "string" ? datePattern.exec(value) : null;
  if (!match || match[0] !== value) throw new Error(timeError);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > daysPerMonth[month - 1]!) throw new Error(timeError);
}

function parseZonedEndpoint(value: string, precision: IntervalPrecisionV1) {
  const match = typeof value === "string" ? zonedEndpointPattern.exec(value) : null;
  if (!match || match[0] !== value) throw new Error(timeError);
  const [, date, hours, minutes, seconds, fraction, zone] = match;
  validateDate(date!);
  const actualPrecision = fraction ? "FRACTION" : seconds ? "SECOND" : "MINUTE";
  if (actualPrecision !== precision) throw new Error(timeError);
  // Order by whole UTC seconds and then by the original decimal digits.
  const whole = Date.parse(`${date}T${hours}:${minutes}${seconds ? `:${seconds}` : ""}${zone}`);
  if (!Number.isFinite(whole)) throw new Error(timeError);
  return { whole, fraction: fraction ?? "" };
}

function compareRangeEndpoints(time: Extract<SourceObservationTimeV1, { kind: "RANGE" }>): number {
  if (time.precision === "DATE") {
    validateDate(time.from);
    validateDate(time.until);
    return orderStrings(time.from, time.until);
  }
  const from = parseZonedEndpoint(time.from, time.precision);
  const until = parseZonedEndpoint(time.until, time.precision);
  if (from.fraction.length !== until.fraction.length) throw new Error(timeError);
  return from.whole - until.whole || orderStrings(from.fraction, until.fraction);
}

function normalizeTime(value: SourceObservationTimeV1): SourceObservationTimeV1 {
  switch (value?.kind) {
    case "INSTANT":
      exactKeys(value, ["kind", "at"], timeError);
      instantMilliseconds(value.at, timeError);
      return Object.freeze({ kind: value.kind, at: value.at });
    case "DATE":
      exactKeys(value, ["kind", "date"], timeError);
      validateDate(value.date);
      return Object.freeze({ kind: value.kind, date: value.date });
    case "RANGE": {
      exactKeys(value, ["kind", "from", "until", "precision", "from_boundary", "until_boundary"], timeError);
      if (!intervalBoundaries.has(value.from_boundary) || !intervalBoundaries.has(value.until_boundary)) {
        throw new Error(timeError);
      }
      const order = compareRangeEndpoints(value);
      if (order > 0 || (order === 0 && (value.from_boundary === "EXCLUSIVE" || value.until_boundary === "EXCLUSIVE"))) {
        throw new Error(timeError);
      }
      const { kind, from, until, precision, from_boundary, until_boundary } = value;
      return Object.freeze({ kind, from, until, precision, from_boundary, until_boundary });
    }
    case "UNKNOWN":
      exactKeys(value, ["kind"], timeError);
      return Object.freeze({ kind: value.kind });
    default:
      throw new Error(timeError);
  }
}

function normalizeIntroduction(value: AdHocIntroductionV1): AdHocIntroductionV1 {
  exactKeys(value, [
    "version", "evidence_ref", "introduction_mode", "evidence_kind", "provenance_refs",
    "causal_lineage_refs", "creates_operational_representation",
  ], entryError);
  if (
    value.introduction_mode !== "REQUEST_BOUND_AD_HOC" ||
    value.creates_operational_representation !== false ||
    !Array.isArray(value.provenance_refs) ||
    !Array.isArray(value.causal_lineage_refs)
  ) {
    throw new Error(entryError);
  }
  const normalized = classifyGovernedOperationalEvidenceV1({
    version: value.version,
    evidence_ref: required(value.evidence_ref, entryError),
    evidence_kind: value.evidence_kind,
    provenance_refs: Array.from(value.provenance_refs, ref => required(ref, entryError)),
    causal_lineage_refs: Array.from(value.causal_lineage_refs, ref => required(ref, entryError)),
  });
  if (normalized.introduction_mode !== "REQUEST_BOUND_AD_HOC") throw new Error(entryError);
  return normalized;
}

function normalizeEntry(entry: DocumentaryEvidenceEntryV1, cutoff: number): DocumentaryEvidenceEntryV1 {
  const keys = [
    "documentary_ref", "source_document_digest", "original_source_identity_ref",
    "introduction", "source_observation_time", "documentary_acquired_at",
  ];
  if (entry && Object.hasOwn(entry, "linked_observation_ref")) keys.push("linked_observation_ref");
  exactKeys(entry, keys, entryError);
  if (typeof entry.source_document_digest !== "string" || !/^[a-f0-9]{64}$/u.test(entry.source_document_digest) ||
      entry.source_document_digest.length !== 64) {
    throw new Error(entryError);
  }
  if (instantMilliseconds(entry.documentary_acquired_at, boundaryError) > cutoff) throw new Error(boundaryError);
  return Object.freeze({
    documentary_ref: required(entry.documentary_ref, entryError),
    source_document_digest: entry.source_document_digest,
    original_source_identity_ref: required(entry.original_source_identity_ref, entryError),
    introduction: normalizeIntroduction(entry.introduction),
    source_observation_time: normalizeTime(entry.source_observation_time),
    documentary_acquired_at: entry.documentary_acquired_at,
    ...(keys.includes("linked_observation_ref")
      ? { linked_observation_ref: required(entry.linked_observation_ref!, linkError) }
      : {}),
  });
}

function canonicalJson(value: unknown, legacy = false): string {
  if (Array.isArray(value)) return `[${value.map(item => canonicalJson(item, legacy)).join(",")}]`;
  if (value && typeof value === "object") {
    const members = Object.entries(value).filter(([, member]) => !legacy || member !== undefined)
      .sort(([left], [right]) => legacy ? left.localeCompare(right) : orderStrings(left, right));
    return `{${members.map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member, legacy)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256(canonical: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

type ObservationContextV1 = Pick<
  CanonicalOperationalRealityCompositionV1,
  "company_id" | "request_id" | "scope_id" | "scope_digest" | "evidence_as_of"
>;

function sameObservationContext(left: ObservationContextV1, right: ObservationContextV1): boolean {
  return left.company_id === right.company_id &&
    left.request_id === right.request_id &&
    left.scope_id === right.scope_id &&
    left.scope_digest === right.scope_digest &&
    left.evidence_as_of === right.evidence_as_of;
}

const evidenceRoles = {
  CURRENT_FACT: true,
  CURRENT_PLAN: true,
  REALIZED_EVENT: true,
  GOVERNED_FUTURE_SUPPLY: true,
  PLANNED_PRODUCTION: true,
  USER_CONFIRMED_CURRENT: true,
} satisfies Record<OperationalRealityEvidenceRoleV1, true>;

// Member exclusions in the frozen V1 composer.
const nonCurrentMemberFields = [
  "tier", "authority_tier", "commercial_plan", "credit_balance", "economic_capacity", "recommendation",
  "approval", "delegation", "execution", "scenario", "counterfactual", "optimizer", "simulation",
  "learned_expectation", "llm_result", "knowledge_override",
];

function isReference(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function isDigest(value: unknown): value is string {
  return typeof value === "string" && value.length === 64 && /^[a-f0-9]{64}$/.test(value);
}

function validReferences(value: unknown, allowEmpty: boolean): value is readonly string[] {
  return Array.isArray(value) && (allowEmpty || value.length > 0) &&
    Array.from(value).every(isReference) && new Set(value).size === value.length;
}

function verifyCompositionMember(
  member: CanonicalOperationalRealityEvidenceV1,
  composition: CanonicalOperationalRealityCompositionV1,
): void {
  if (!member || typeof member !== "object" || Array.isArray(member) || member.version !== 1 ||
      typeof member.evidence_role !== "string" || !Object.hasOwn(evidenceRoles, member.evidence_role) ||
      nonCurrentMemberFields.some(field => field in member) ||
      member.tenant_id !== composition.tenant_id || !sameObservationContext(member, composition) ||
      !isReference(member.evidence_ref) || !isReference(member.source_identity_ref) ||
      !isReference(member.source_namespace) || !isReference(member.semantic_key) ||
      !isDigest(member.evidence_digest) || !isDigest(member.claim_digest) ||
      !validReferences(member.canonical_subject_refs, true) || !validReferences(member.canonical_location_refs, true) ||
      !validReferences(member.qualification_refs, false) || !validReferences(member.provenance_refs, false) ||
      !validReferences(member.causal_lineage_refs, false)) {
    throw new Error(compositionStructureError);
  }
  const { structured_observation: observation, structured_observation_digest: digest,
    governed_resolution_ref: resolution, governed_resolution_selected: selected } = member;
  if ((selected !== undefined && typeof selected !== "boolean") ||
      (resolution !== undefined && typeof resolution !== "string") || (selected && !resolution) ||
      (observation === undefined ? digest !== undefined :
        !observation || typeof observation !== "object" || Array.isArray(observation) || !isDigest(digest))) {
    throw new Error(compositionStructureError);
  }
}

async function verifyStructuredMemberContent(member: CanonicalOperationalRealityEvidenceV1): Promise<void> {
  const observation = member.structured_observation;
  if (observation === undefined) return;
  if (observation.observation_ref !== member.evidence_ref || observation.evidence_role !== member.evidence_role ||
      !sameObservationContext(observation, member) ||
      await sha256(canonicalJson(observation, true)) !== member.structured_observation_digest) {
    throw new Error(compositionStructureError);
  }
}

function verifyCompositionReferenceIndexes(composition: CanonicalOperationalRealityCompositionV1): void {
  const { structured_evidence: members, coverage_refs } = composition;
  if (!validReferences(coverage_refs, true)) throw new Error(compositionStructureError);
  const indexes = [
    [composition.source_identity_refs, members.map(member => member.source_identity_ref)],
    [composition.canonical_subject_refs, members.flatMap(member => member.canonical_subject_refs)],
    [composition.canonical_location_refs, members.flatMap(member => member.canonical_location_refs)],
    [composition.qualification_refs, members.flatMap(member => member.qualification_refs)],
    [composition.provenance_refs, members.flatMap(member => member.provenance_refs)],
    [composition.causal_lineage_refs, [...members.flatMap(member => member.causal_lineage_refs), ...coverage_refs]],
  ] as const;
  for (const [actual, refs] of indexes) {
    const expected = new Set(refs);
    if (!validReferences(actual, true) || actual.length !== expected.size || !actual.every(ref => expected.has(ref))) {
      throw new Error(compositionStructureError);
    }
  }
}

function verifyGroupStatus(
  group: CanonicalOperationalRealityCompositionV1["semantic_groups"][number],
  members: readonly CanonicalOperationalRealityEvidenceV1[],
): void {
  const distinctClaims = new Set(members.map(member => member.claim_digest)).size;
  if (distinctClaims > 1) {
    const selected = members.filter(member => member.governed_resolution_selected);
    const winner = selected[0];
    const resolution = winner?.governed_resolution_ref;
    if (selected.length === 1 && winner && typeof resolution === "string" && resolution &&
        members.every(member => member.governed_resolution_ref === resolution)) {
      if (group.status === "GOVERNED_RESOLVED" && group.selected_evidence_ref === winner.evidence_ref &&
          group.governed_resolution_ref === resolution) return;
      throw new Error(compositionStructureError);
    }
  }
  if (group.selected_evidence_ref !== undefined || group.governed_resolution_ref !== undefined) {
    throw new Error(compositionStructureError);
  }
  const expectedStatus = members.length === 1 ? "SINGLE_SOURCE" :
    distinctClaims === 1 ? "COMPLEMENTARY" : "UNRESOLVED_CONFLICT";
  if (group.status !== expectedStatus) throw new Error(compositionStructureError);
}

// The V1 digest verifies content integrity. Check the member partition before binding to it.
function verifyCompositionStructure(composition: CanonicalOperationalRealityCompositionV1): void {
  const { evidence_refs, structured_evidence, semantic_groups } = composition;
  if (!validReferences(evidence_refs, false) ||
      !Array.isArray(structured_evidence) || structured_evidence.length !== evidence_refs.length ||
      !Array.isArray(semantic_groups) || !semantic_groups.length) {
    throw new Error(compositionStructureError);
  }
  const admitted = new Set(evidence_refs);
  const byRef = new Map<string, CanonicalOperationalRealityEvidenceV1>();
  for (const member of composition.structured_evidence) {
    verifyCompositionMember(member, composition);
    if (!admitted.has(member.evidence_ref) || byRef.has(member.evidence_ref)) throw new Error(compositionStructureError);
    byRef.set(member.evidence_ref, member);
  }
  verifyCompositionReferenceIndexes(composition);
  const remaining = new Set(admitted);
  const groupKeys = new Set<string>();
  let hasConflict = false;
  for (const group of composition.semantic_groups) {
    if (!group || groupKeys.has(group.semantic_key) || !Array.isArray(group.evidence_refs) ||
        !group.evidence_refs.length) throw new Error(compositionStructureError);
    groupKeys.add(group.semantic_key);
    const members = Array.from(group.evidence_refs, ref => {
      const member = byRef.get(ref);
      if (!member || member.semantic_key !== group.semantic_key || !remaining.delete(ref)) {
        throw new Error(compositionStructureError);
      }
      return member;
    });
    verifyGroupStatus(group, members);
    if (group.status === "UNRESOLVED_CONFLICT") hasConflict = true;
  }
  if (remaining.size || composition.composition_status !== (hasConflict ? "UNRESOLVED_CONFLICT" : "COMPOSED")) {
    throw new Error(compositionStructureError);
  }
}

async function verifyDocumentaryLink(
  entry: DocumentaryEvidenceEntryV1,
  composition: CanonicalOperationalRealityCompositionV1 | null,
): Promise<void> {
  const ref = entry.linked_observation_ref;
  if (ref === undefined) return;
  if (!composition || entry.source_observation_time.kind !== "INSTANT") throw new Error(linkError);
  const retained = await retrieveCanonicalStructuredRealityV1(composition, ref);
  const observation = retained.audit_observations.find(candidate => candidate.observation_ref === ref);
  const evidence = composition.structured_evidence.find(candidate => candidate.evidence_ref === ref);
  if (
    !observation ||
    !evidence ||
    evidence.source_identity_ref !== entry.introduction.evidence_ref ||
    evidence.source_namespace !== entry.original_source_identity_ref ||
    observation.source.kind !== "REQUEST_BOUND_AD_HOC" ||
    observation.source.original_source_identity_ref !== entry.original_source_identity_ref ||
    observation.observed_at !== entry.source_observation_time.at ||
    canonicalJson(observation.source.introduction) !== canonicalJson(entry.introduction)
  ) throw new Error(linkError);
  if (!sameObservationContext(observation, composition) || observation.evidence_role !== evidence.evidence_role) {
    throw new Error("DOCUMENTARY_RETENTION_LINK_CONTEXT_MISMATCH");
  }
}

/**
 * Retain the caller's already governed document selection for this scope and snapshot.
 * The digest binds the supplied evidence and context. The caller owns admission and source attestation.
 */
export async function createCanonicalDocumentaryEvidenceRetentionV1(
  input: DocumentaryRetentionContextV1 & Readonly<{ selected_entries: readonly DocumentaryEvidenceEntryV1[] }>,
): Promise<CanonicalDocumentaryEvidenceRetentionV1> {
  const { evaluation_scope: binding } = input;
  // Validate and use the same snapshot across the asynchronous digest and link checks.
  const composition = structuredClone(input.composition);
  const tenant_id = required(input.tenant_id, "DOCUMENTARY_RETENTION_TENANT_REQUIRED");
  const scope = binding.scope;
  const evaluation_cutoff = binding.evidence_as_of;
  const evaluated_at = binding.evaluated_at;
  const cutoff = instantMilliseconds(evaluation_cutoff, boundaryError);
  if (binding.version !== 1 || instantMilliseconds(evaluated_at, boundaryError) < cutoff) throw new Error(boundaryError);
  if (!Array.isArray(input.selected_entries) || !input.selected_entries.length) throw new Error(entryError);
  const entries = Array.from(input.selected_entries, entry => normalizeEntry(entry, cutoff))
    .sort((left, right) => orderStrings(left.documentary_ref, right.documentary_ref));
  if (new Set(entries.map(entry => entry.documentary_ref)).size !== entries.length) {
    throw new Error("DOCUMENTARY_RETENTION_DUPLICATE_REF");
  }
  const context = {
    tenant_id,
    company_id: scope.company_id,
    request_id: scope.request_id,
    scope_id: scope.scope_id,
    scope_digest: scope.scope_digest,
    evidence_selection_ref: scope.evidence_selection_ref,
    source_snapshot_ref: scope.source_snapshot_ref,
  };
  await verifyOperationalSignalEvaluationScopeV1(scope, context);
  let compositionBinding: CompositionBindingV1 | null = null;
  if (composition !== null) {
    await verifyCanonicalOperationalRealityCompositionV1(composition);
    if (
      composition.version !== 1 ||
      composition.composition_kind !== "CANONICAL_OPERATIONAL_REALITY" ||
      composition.evidence_as_of !== evaluation_cutoff ||
      Object.entries(context).some(([key, value]) => composition[key as keyof typeof context] !== value)
    ) throw new Error("DOCUMENTARY_RETENTION_CONTEXT_MISMATCH");
    verifyCompositionStructure(composition);
    compositionBinding = Object.freeze({
      composition_id: composition.composition_id,
      composition_digest: composition.composition_digest,
    });
  }
  await Promise.all(entries.map(entry => verifyDocumentaryLink(entry, composition)));
  if (composition) {
    // Keep the link-specific context diagnostic before validating every retained observation.
    await Promise.all(composition.structured_evidence.map(verifyStructuredMemberContent));
  }
  const semantic = {
    version: 1,
    ...context,
    evaluation_cutoff,
    evaluated_at,
    composition: compositionBinding,
    entries: Object.freeze(entries),
    observational_only: true,
    grants_authority: false,
    grants_execution: false,
  } as const;
  const retention_digest = await sha256(canonicalJson(semantic));
  return Object.freeze({
    ...semantic,
    retention_id: `${identityPrefix}${retention_digest}`,
    retention_digest,
    digest_algorithm: "SHA-256",
  });
}

async function verifyAndRebuild(
  value: CanonicalDocumentaryEvidenceRetentionV1,
  expected: ExpectedDocumentaryRetentionV1,
): Promise<CanonicalDocumentaryEvidenceRetentionV1> {
  const expectedId = expected.retention_id;
  if (!value || value.retention_id !== expectedId) throw new Error(integrityError);
  const rebuilt = await createCanonicalDocumentaryEvidenceRetentionV1({ ...expected, selected_entries: value.entries });
  if (rebuilt.retention_id !== expectedId) throw new Error(integrityError);
  exactKeys(value, Object.keys(rebuilt), integrityError);
  if (canonicalJson(value) !== canonicalJson(rebuilt)) throw new Error(integrityError);
  return rebuilt;
}

export async function verifyCanonicalDocumentaryEvidenceRetentionV1(
  value: CanonicalDocumentaryEvidenceRetentionV1,
  expected: ExpectedDocumentaryRetentionV1,
): Promise<void> {
  await verifyAndRebuild(value, expected);
}

export async function retrieveCanonicalDocumentaryEvidenceV1(
  value: CanonicalDocumentaryEvidenceRetentionV1,
  documentaryRef: string,
  expected: ExpectedDocumentaryRetentionV1,
): Promise<Readonly<{ retention_ref: string; entry: DocumentaryEvidenceEntryV1 }>> {
  const ref = required(documentaryRef, entryError);
  const verified = await verifyAndRebuild(value, expected);
  const entry = verified.entries.find(item => item.documentary_ref === ref);
  if (!entry) throw new Error("DOCUMENTARY_RETENTION_NOT_ADMITTED");
  return Object.freeze({ retention_ref: verified.retention_id, entry });
}
