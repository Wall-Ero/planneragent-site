import { describe, expect, it } from "vitest";
import {
  bindOperationalSignalsToScopeV1,
  createOperationalSignalEvaluationScopeV1,
  type OperationalSignalEvaluationScopeInputV1,
} from "../../cockpit/operational.signal.evaluation.scope.v1";
import {
  composeCanonicalOperationalRealityV1,
  retrieveCanonicalStructuredRealityV1,
  verifyCanonicalOperationalRealityCompositionV1,
  type CanonicalOperationalRealityCompositionV1,
  type CanonicalOperationalRealityEvidenceV1,
} from "../canonical.operational.reality.composition.v1";
import {
  createCanonicalDocumentaryEvidenceRetentionV1,
  retrieveCanonicalDocumentaryEvidenceV1,
  verifyCanonicalDocumentaryEvidenceRetentionV1,
  type CanonicalDocumentaryEvidenceRetentionV1,
  type DocumentaryEvidenceEntryV1,
  type SourceObservationTimeV1,
} from "../canonical.documentary.evidence.retention.v1";
import {
  alignGovernedMultiSourceOperationalRealityV1,
  createGovernedSubjectBindingV1,
  type GovernedRepresentationObservationInputV1,
} from "../governed.multi-source.reality.alignment.v1";
import { classifyGovernedOperationalEvidenceV1 } from "../governed.operational.representation.v1";
import { evaluateGovernedPlanRealityElementComparisonV1 } from "../plan.reality.comparison.doctrine.v1";

const observedAt = "2026-12-19T08:45:12.123Z";
const acquiredAt = "2026-12-20T10:00:00.000Z";
const cutoff = "2026-12-21T12:00:00.000Z";
const evaluatedAt = "2026-12-21T12:01:00.000Z";
const tenantId = "tenant:synthetic";
const originalSource = "source:synthetic-document";
const classified = classifyGovernedOperationalEvidenceV1({
  version: 1,
  evidence_ref: "document:synthetic-fixture",
  evidence_kind: "DOCUMENT",
  provenance_refs: ["provenance:synthetic-fixture"],
  causal_lineage_refs: ["lineage:synthetic-fixture"],
});
if (classified.introduction_mode !== "REQUEST_BOUND_AD_HOC") throw new Error("FIXTURE_MODE");
const introduction = classified;

const instant = { kind: "INSTANT", at: observedAt } as const;
const date = { kind: "DATE", date: "2026-12-19" } as const;
const range = {
  kind: "RANGE",
  from: "2026-12-19T09:00:00.123456789+01:00",
  until: "2026-12-19T08:00:00.123456790Z",
  precision: "FRACTION",
  from_boundary: "INCLUSIVE",
  until_boundary: "EXCLUSIVE",
} as const;
const unknown = { kind: "UNKNOWN" } as const;

function entry(time: SourceObservationTimeV1): DocumentaryEvidenceEntryV1 {
  return {
    documentary_ref: `documentary:synthetic:${time.kind}`,
    source_document_digest: "a".repeat(64),
    original_source_identity_ref: originalSource,
    introduction,
    source_observation_time: time,
    documentary_acquired_at: acquiredAt,
  };
}

async function scopeBinding(overrides: Partial<OperationalSignalEvaluationScopeInputV1> = {}) {
  const scope = await createOperationalSignalEvaluationScopeV1({
    version: 1,
    scope_type: "REQUEST_DATASET",
    request_id: "request:synthetic",
    company_id: "company:synthetic",
    domain: "operations",
    evidence_selection_ref: "selection:synthetic",
    source_snapshot_ref: "snapshot:synthetic",
    ...overrides,
  });
  return bindOperationalSignalsToScopeV1({
    scope,
    request_id: scope.request_id,
    company_id: scope.company_id,
    evidence_as_of: cutoff,
    evaluated_at: evaluatedAt,
  });
}

async function operationalFixture(conflict = false) {
  const evaluation_scope = await scopeBinding();
  const actualRef = "observation:synthetic-actual";
  const planRef = "observation:synthetic-plan";
  const localSubject = "local:synthetic-subject";
  const planSubject = "local:synthetic-plan-subject";
  const subject_binding = await createGovernedSubjectBindingV1({
    version: 1,
    outcome: "SAME_SUBJECT",
    members: [
      { representation_identity_ref: introduction.evidence_ref, local_subject_ref: localSubject },
      { representation_identity_ref: introduction.evidence_ref, local_subject_ref: planSubject },
    ],
    canonical_subject: {
      version: 1,
      company_id: evaluation_scope.scope.company_id,
      domain_ref: "domain:operations",
      profile_ref: "profile:synthetic",
      profile_digest: "b".repeat(64),
      subject_kind: "RESOURCE",
      subject_ref: "resource:synthetic",
      subject_id: "subject:synthetic",
      subject_digest: "c".repeat(64),
      digest_algorithm: "SHA-256",
      grants_execution: false,
    },
    binding_evidence_refs: ["evidence:synthetic-binding"],
    provenance_refs: introduction.provenance_refs,
    causal_lineage_refs: introduction.causal_lineage_refs,
  });
  const actual = {
    version: 1,
    observation_ref: actualRef,
    source: { kind: "REQUEST_BOUND_AD_HOC", introduction, original_source_identity_ref: originalSource },
    local_subject_ref: localSubject,
    subject_binding,
    observed_at: observedAt,
    effective_from: observedAt,
    dimension_ref: "dimension:synthetic",
    operational_state_ref: "state:synthetic",
    evidence_role: "CURRENT_FACT",
    claim: { kind: "QUANTITY", value: 10, unit_ref: "unit:EACH" },
    location_refs: [],
    qualification_refs: ["qualification:synthetic"],
    provenance_refs: introduction.provenance_refs,
    causal_lineage_refs: introduction.causal_lineage_refs,
  } satisfies GovernedRepresentationObservationInputV1;
  const other: GovernedRepresentationObservationInputV1 = conflict
    ? { ...actual, observation_ref: planRef, claim: { ...actual.claim, value: 11 } }
    : { ...actual, observation_ref: planRef, local_subject_ref: planSubject, evidence_role: "CURRENT_PLAN" };
  const alignment = await alignGovernedMultiSourceOperationalRealityV1({
    version: 1,
    tenant_id: tenantId,
    evaluation_scope,
    observations: [actual, other],
    temporal_bindings: [],
    representation_relationships: [],
  });
  const composition = await composeCanonicalOperationalRealityV1({
    version: 1,
    tenant_id: tenantId,
    evaluation_scope,
    evidence: alignment.canonical_evidence,
    coverage: [],
  });
  return { context: { tenant_id: tenantId, evaluation_scope, composition }, actualRef, planRef };
}

async function documentaryContext() {
  return { tenant_id: tenantId, evaluation_scope: await scopeBinding(), composition: null };
}

// Use the legacy serialization to construct semantically invalid but digest-consistent fixtures.
function legacyCanonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(legacyCanonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${legacyCanonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function legacyDigest(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(legacyCanonicalJson(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function rehashComposition(value: object): Promise<CanonicalOperationalRealityCompositionV1> {
  const excluded = new Set([
    "composition_id", "composition_digest", "digest_algorithm", "observational_only", "current_reality",
    "counterfactual", "tier_independent", "recommended", "executable", "grants_authority", "grants_execution",
  ]);
  const semantic = Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.has(key)));
  const composition_digest = await legacyDigest(semantic);
  return {
    ...value, composition_digest, composition_id: `canonical-operational-reality:sha256:${composition_digest}`,
  } as CanonicalOperationalRealityCompositionV1;
}

const requiredMemberFields = [
  "version", "tenant_id", "company_id", "request_id", "scope_id", "scope_digest", "evidence_as_of",
  "evidence_ref", "evidence_digest", "source_identity_ref", "source_namespace", "semantic_key", "claim_digest",
  "evidence_role", "canonical_subject_refs", "canonical_location_refs", "qualification_refs", "provenance_refs",
  "causal_lineage_refs",
] as const satisfies readonly (keyof CanonicalOperationalRealityEvidenceV1)[];

function mutateMember(field: keyof CanonicalOperationalRealityEvidenceV1, value: unknown) {
  return (member: CanonicalOperationalRealityEvidenceV1) => ({ ...member, [field]: value });
}

const referenceFields = [
  "canonical_subject_refs", "canonical_location_refs", "qualification_refs", "provenance_refs", "causal_lineage_refs",
] as const;

describe("canonical documentary evidence retention V1 (synthetic fixtures)", () => {
  it.each([
    ...requiredMemberFields.flatMap(field => [
      [`missing ${field}`, (member: CanonicalOperationalRealityEvidenceV1) => {
        const { [field]: _missing, ...rest } = member;
        return rest;
      }],
      [`wrong type for ${field}`, mutateMember(field, true)],
    ] as const),
    ...referenceFields.map(field => [`invalid reference in ${field}`, mutateMember(field, [" "])] as const),
    ...(["qualification_refs", "provenance_refs", "causal_lineage_refs"] as const).map(
      field => [`empty required ${field}`, mutateMember(field, [])] as const,
    ),
    ["unknown evidence_role", mutateMember("evidence_role", "COMMERCIAL_ATTESTATION")],
    ["blank source_identity_ref", mutateMember("source_identity_ref", " ")],
    ["blank source_namespace", mutateMember("source_namespace", " ")],
    ["malformed evidence_digest", mutateMember("evidence_digest", "not-a-sha256")],
    ["malformed claim_digest", mutateMember("claim_digest", "g".repeat(64))],
    ["observation without digest", mutateMember("structured_observation_digest", undefined)],
    ["digest without observation", mutateMember("structured_observation", undefined)],
    ["non-object observation", mutateMember("structured_observation", true)],
    ["non-string observation digest", mutateMember("structured_observation_digest", true)],
    ["mismatched observation digest despite valid format", mutateMember("structured_observation_digest", "0".repeat(64))],
    ["observation ref differs from member ref", async (member: CanonicalOperationalRealityEvidenceV1) => {
      const structured_observation = { ...member.structured_observation!, observation_ref: "observation:other" };
      return { ...member, structured_observation, structured_observation_digest: await legacyDigest(structured_observation) };
    }],
    ["role differs from rehashed observation", mutateMember("evidence_role", "REALIZED_EVENT")],
    ["non-boolean resolution selection", mutateMember("governed_resolution_selected", "true")],
    ["non-string resolution reference", mutateMember("governed_resolution_ref", true)],
    ["resolution selected without reference", mutateMember("governed_resolution_selected", true)],
    ["execution field on member", (member: CanonicalOperationalRealityEvidenceV1) => ({ ...member, execution: false })],
  ] as const)("rejects malformed rehashed V1 member: %s", async (_case, change) => {
    const { context, actualRef } = await operationalFixture();
    const structured_evidence = await Promise.all(context.composition.structured_evidence.map(
      member => member.evidence_ref === actualRef ? change(member) : member,
    ));
    const composition = await rehashComposition({ ...context.composition, structured_evidence });
    await expect(verifyCanonicalOperationalRealityCompositionV1(composition)).resolves.toBeUndefined();
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, composition, selected_entries: [entry(unknown)],
    })).rejects.toThrow("DOCUMENTARY_RETENTION_COMPOSITION_STRUCTURE_INVALID");
  });

  it.each([
    ["missing source identity index", { source_identity_refs: undefined }],
    ["source index does not match members", { source_identity_refs: ["source:other"] }],
    ["lineage index does not match members", { causal_lineage_refs: ["lineage:other"] }],
    ["malformed coverage references", { coverage_refs: [false] }],
  ] as const)("rejects a rehashed composition reference mismatch: %s", async (_case, change) => {
    const { context } = await operationalFixture();
    const composition = await rehashComposition({ ...context.composition, ...change });
    await expect(verifyCanonicalOperationalRealityCompositionV1(composition)).resolves.toBeUndefined();
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, composition, selected_entries: [entry(unknown)],
    })).rejects.toThrow("DOCUMENTARY_RETENTION_COMPOSITION_STRUCTURE_INVALID");
  });

  it("binds a valid V1 member without optional structured retention", async () => {
    const { context } = await operationalFixture();
    const composition = await composeCanonicalOperationalRealityV1({
      version: 1,
      tenant_id: context.tenant_id,
      evaluation_scope: context.evaluation_scope,
      evidence: context.composition.structured_evidence.map(
        ({ structured_observation: _observation, structured_observation_digest: _digest, ...member }) => ({
          ...member, canonical_subject_refs: [], canonical_location_refs: [],
        }),
      ),
      coverage: [],
    });
    const selected = entry(unknown);
    const retentionContext = { ...context, composition };
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({
      ...retentionContext, selected_entries: [selected],
    });
    await expect(retrieveCanonicalDocumentaryEvidenceV1(
      artifact, selected.documentary_ref, { ...retentionContext, retention_id: artifact.retention_id },
    )).resolves.toEqual({ retention_ref: artifact.retention_id, entry: selected });
  });

  it.each(["structured_evidence", "evidence_refs", "semantic_groups"] as const)(
    "rejects a rehashed composition without %s even for an unlinked document", async (field) => {
      const { context } = await operationalFixture();
      const malformed: Partial<CanonicalOperationalRealityCompositionV1> = { ...context.composition };
      const { [field]: _missing, ...remaining } = malformed;
      const composition = await rehashComposition(remaining);
      await expect(verifyCanonicalOperationalRealityCompositionV1(composition)).resolves.toBeUndefined();
      await expect(createCanonicalDocumentaryEvidenceRetentionV1({
        ...context, composition, selected_entries: [entry(unknown)],
      })).rejects.toThrow("DOCUMENTARY_RETENTION_COMPOSITION_STRUCTURE_INVALID");
    },
  );

  it.each([
    ["duplicate structured member", (c: CanonicalOperationalRealityCompositionV1) => ({
      structured_evidence: [c.structured_evidence[0], c.structured_evidence[0]],
    })],
    ["unlisted evidence ref", (c: CanonicalOperationalRealityCompositionV1) => ({
      evidence_refs: [c.evidence_refs[0], "observation:unlisted"],
    })],
    ["group member not admitted", (c: CanonicalOperationalRealityCompositionV1) => ({
      semantic_groups: [{ ...c.semantic_groups[0], evidence_refs: [c.evidence_refs[0], "observation:unlisted"] }],
    })],
    ["incorrect semantic key", (c: CanonicalOperationalRealityCompositionV1) => ({
      semantic_groups: [{ ...c.semantic_groups[0], semantic_key: "semantic:other" }],
    })],
    ["member omitted from groups", (c: CanonicalOperationalRealityCompositionV1) => ({
      semantic_groups: [{ ...c.semantic_groups[0], evidence_refs: [c.evidence_refs[0]], status: "SINGLE_SOURCE" }],
    })],
    ["group status contradicts members", (c: CanonicalOperationalRealityCompositionV1) => ({
      semantic_groups: [{ ...c.semantic_groups[0], status: "UNRESOLVED_CONFLICT" }],
      composition_status: "UNRESOLVED_CONFLICT",
    })],
  ] as const)("rejects rehashed group or member inconsistency: %s", async (_case, change) => {
    const { context } = await operationalFixture();
    const composition = await rehashComposition({ ...context.composition, ...change(context.composition) });
    await expect(verifyCanonicalOperationalRealityCompositionV1(composition)).resolves.toBeUndefined();
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, composition, selected_entries: [entry(unknown)],
    })).rejects.toThrow("DOCUMENTARY_RETENTION_COMPOSITION_STRUCTURE_INVALID");
  });

  it.each([
    ["request_id", "request:other"],
    ["company_id", "company:other"],
    ["scope_id", "scope:other"],
    ["scope_digest", "e".repeat(64)],
    ["evidence_as_of", evaluatedAt],
  ] as const)("rejects a rehashed linked observation with discordant %s", async (field, foreignValue) => {
    const { context, actualRef } = await operationalFixture();
    const structured_evidence = await Promise.all(context.composition.structured_evidence.map(async evidence => {
      if (evidence.evidence_ref !== actualRef) return evidence;
      const structured_observation = { ...evidence.structured_observation!, [field]: foreignValue };
      return { ...evidence, structured_observation, structured_observation_digest: await legacyDigest(structured_observation) };
    }));
    const composition = await rehashComposition({ ...context.composition, structured_evidence });
    await expect(verifyCanonicalOperationalRealityCompositionV1(composition)).resolves.toBeUndefined();
    const recovered = await retrieveCanonicalStructuredRealityV1(composition, actualRef);
    expect(recovered.audit_observations.find(item => item.observation_ref === actualRef)?.[field]).toBe(foreignValue);
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, composition, selected_entries: [{ ...entry(instant), linked_observation_ref: actualRef }],
    })).rejects.toThrow("DOCUMENTARY_RETENTION_LINK_CONTEXT_MISMATCH");
  });

  it("preserves a V1 governed resolution when retaining a documentary link to the unselected member", async () => {
    const { context, actualRef, planRef } = await operationalFixture(true);
    const composition = await composeCanonicalOperationalRealityV1({
      version: 1,
      tenant_id: context.tenant_id,
      evaluation_scope: context.evaluation_scope,
      evidence: context.composition.structured_evidence.map(evidence => ({
        ...evidence,
        governed_resolution_ref: "resolution:synthetic",
        governed_resolution_selected: evidence.evidence_ref === planRef,
      })),
      coverage: [],
    });
    const selected = { ...entry(instant), linked_observation_ref: actualRef };
    const retentionContext = { ...context, composition };
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({
      ...retentionContext, selected_entries: [selected],
    });
    await expect(retrieveCanonicalDocumentaryEvidenceV1(
      artifact, selected.documentary_ref, { ...retentionContext, retention_id: artifact.retention_id },
    )).resolves.toMatchObject({ entry: selected });
    const result = await retrieveCanonicalStructuredRealityV1(composition, actualRef);
    expect(result.group_status).toBe("GOVERNED_RESOLVED");
    expect(result.comparison_candidates.map(candidate => candidate.observation_ref)).toEqual([planRef]);
  });

  it("round-trips an exact linked INSTANT without exposing comparison candidates", async () => {
    const { context, actualRef } = await operationalFixture();
    const selected = { ...entry(instant), linked_observation_ref: actualRef };
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [selected] });
    const expected = { ...context, retention_id: artifact.retention_id };
    const parsed: CanonicalDocumentaryEvidenceRetentionV1 = JSON.parse(JSON.stringify(artifact));
    await expect(verifyCanonicalDocumentaryEvidenceRetentionV1(parsed, expected)).resolves.toBeUndefined();
    const result = await retrieveCanonicalDocumentaryEvidenceV1(parsed, selected.documentary_ref, expected);
    expect(result).toEqual({ retention_ref: artifact.retention_id, entry: selected });
    expect(result).not.toHaveProperty("comparison_candidates");
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.entry.source_observation_time)).toBe(true);
    expect(Object.isFrozen(result.entry.introduction.provenance_refs)).toBe(true);
  });

  it.each([instant, date, range, unknown])("preserves $kind in a documentary-only replay", async (time) => {
    const context = await documentaryContext();
    const selected = entry(time);
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [selected] });
    expect(artifact).toMatchObject({
      composition: null, evaluation_cutoff: cutoff, evaluated_at: evaluatedAt,
      observational_only: true, grants_authority: false, grants_execution: false,
    });
    const result = await retrieveCanonicalDocumentaryEvidenceV1(
      JSON.parse(JSON.stringify(artifact)), selected.documentary_ref, { ...context, retention_id: artifact.retention_id },
    );
    expect(result.entry.source_observation_time).toEqual(time);
    expect(result.entry.documentary_acquired_at).toBe(acquiredAt);
    expect(result.entry).not.toHaveProperty("observed_at");
    expect(result.entry).not.toHaveProperty("effective_from");
  });

  it.each([
    { ...date, date: "2026-02-29" },
    { ...date, date: "2026-12-19T00:00:00.000Z" },
    { ...instant, at: "2026-12-19T09:45:12.123+01:00" },
    { ...range, from: range.until, until: range.from },
    { ...range, until: "2026-12-19T08:00:00.123456789Z" },
    { ...range, until: "2026-12-19T08:00:00.123456790" },
    { ...range, until: "2026-12-19T08:00:00.123456790+24:00" },
    { ...range, until: "2026-12-19T08:00:00.12345679Z" },
    { ...range, precision: "SECOND" },
    { ...unknown, at: observedAt } as SourceObservationTimeV1,
  ] satisfies SourceObservationTimeV1[])("rejects malformed temporal payload %j", async (time) => {
    const context = await documentaryContext();
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [entry(time)] }))
      .rejects.toThrow("DOCUMENTARY_RETENTION_TIME_INVALID");
  });

  it.each([
    { ...range, from: "2026-02-28", until: "2026-03-01", precision: "DATE" },
    { ...range, from: "2026-12-19T09:00+01:00", until: "2026-12-19T08:01Z", precision: "MINUTE" },
    { ...range, from: "2026-12-19T09:00:00+01:00", until: "2026-12-19T08:00:01Z", precision: "SECOND" },
    { ...range, from_boundary: "UNSPECIFIED", until_boundary: "UNSPECIFIED" },
  ] satisfies SourceObservationTimeV1[])("retains supported interval precision and boundaries %j", async (time) => {
    const context = await documentaryContext();
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [entry(time)] });
    expect(artifact.entries[0]?.source_observation_time).toEqual(time);
  });

  it("rejects links without an exact admitted ad-hoc instant and matching identity", async () => {
    const { context, actualRef } = await operationalFixture();
    const selected = { ...entry(instant), linked_observation_ref: actualRef };
    for (const invalid of [
      ...[date, range, unknown].map(source_observation_time => ({ ...selected, source_observation_time })),
      { ...selected, source_observation_time: { ...instant, at: cutoff } },
      { ...selected, original_source_identity_ref: "source:different" },
      { ...selected, introduction: { ...introduction, evidence_ref: "document:different" } },
      { ...selected, linked_observation_ref: "observation:absent" },
    ]) {
      await expect(createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [invalid] }))
        .rejects.toThrow(/DOCUMENTARY_RETENTION_LINK|OPERATIONAL_REALITY_EVIDENCE_NOT_ADMITTED/);
    }
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, composition: null, selected_entries: [selected],
    })).rejects.toThrow("DOCUMENTARY_RETENTION_LINK");
  });

  it("rejects invalid entries, duplicates, and timestamps outside the evaluation boundary", async () => {
    const context = await documentaryContext();
    const selected = entry(date);
    for (const invalid of [
      { ...selected, documentary_ref: "" },
      { ...selected, source_document_digest: "invalid" },
      { ...selected, source_document_digest: `${selected.source_document_digest}\n` },
      { ...selected, original_source_identity_ref: "" },
      { ...selected, introduction: { ...introduction, provenance_refs: [] } },
      { ...selected, introduction: { ...introduction, causal_lineage_refs: [] } },
      { ...selected, introduction: { ...introduction, provenance_refs: "string-instead-of-array" } },
      { ...selected, introduction: { ...introduction, creates_operational_representation: true } },
      { ...selected, documentary_acquired_at: evaluatedAt },
      { ...selected, documentary_acquired_at: "2026-12-20" },
    ]) {
      await expect(createCanonicalDocumentaryEvidenceRetentionV1({
        ...context, selected_entries: [invalid as unknown as DocumentaryEvidenceEntryV1],
      })).rejects.toThrow();
    }
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [selected, selected] }))
      .rejects.toThrow("DOCUMENTARY_RETENTION_DUPLICATE_REF");
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, evaluation_scope: { ...context.evaluation_scope, evaluated_at: acquiredAt }, selected_entries: [selected],
    })).rejects.toThrow("DOCUMENTARY_RETENTION_EVALUATION_BOUNDARY_INVALID");
  });

  it("requires a matching trusted replay identity, scope, snapshot, cutoff and composition", async () => {
    const { context } = await operationalFixture();
    const selected = entry(unknown);
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [selected] });
    const expected = { ...context, retention_id: artifact.retention_id };
    const alternate = await operationalFixture(true);
    for (const wrong of [
      { ...expected, tenant_id: "tenant:other" },
      { ...expected, evaluation_scope: await scopeBinding({ company_id: "company:other" }) },
      { ...expected, evaluation_scope: await scopeBinding({ request_id: "request:other" }) },
      { ...expected, evaluation_scope: await scopeBinding({ domain: "other" }) },
      { ...expected, evaluation_scope: await scopeBinding({ evidence_selection_ref: "selection:other" }) },
      { ...expected, evaluation_scope: await scopeBinding({ source_snapshot_ref: "snapshot:other" }) },
      { ...expected, evaluation_scope: { ...context.evaluation_scope, evidence_as_of: evaluatedAt } },
      { ...expected, evaluation_scope: { ...context.evaluation_scope, evaluated_at: cutoff } },
      { ...expected, composition: null },
      { ...expected, composition: alternate.context.composition },
      { ...expected, retention_id: "retention:other" },
    ]) {
      await expect(verifyCanonicalDocumentaryEvidenceRetentionV1(artifact, wrong)).rejects.toThrow();
    }
    const corruptComposition = { ...context.composition, composition_digest: "0".repeat(64) };
    await expect(createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, composition: corruptComposition, selected_entries: [selected],
    })).rejects.toThrow("OPERATIONAL_REALITY_INTEGRITY_INVALID");
    await expect(verifyCanonicalDocumentaryEvidenceRetentionV1(
      { ...artifact, retention_digest: "0".repeat(64) }, expected,
    )).rejects.toThrow("DOCUMENTARY_RETENTION_INTEGRITY_INVALID");
    await expect(verifyCanonicalDocumentaryEvidenceRetentionV1({
      ...artifact, entries: [{ ...selected, source_document_digest: "f".repeat(64) }],
    }, expected)).rejects.toThrow("DOCUMENTARY_RETENTION_INTEGRITY_INVALID");
    const rehashed = await createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, selected_entries: [{ ...selected, source_document_digest: "f".repeat(64) }],
    });
    await expect(verifyCanonicalDocumentaryEvidenceRetentionV1(rehashed, expected))
      .rejects.toThrow("DOCUMENTARY_RETENTION_INTEGRITY_INVALID");
    await expect(retrieveCanonicalDocumentaryEvidenceV1(artifact, "documentary:absent", expected))
      .rejects.toThrow("DOCUMENTARY_RETENTION_NOT_ADMITTED");
  });

  it("derives a deterministic immutable identity from copied entries", async () => {
    const context = await documentaryContext();
    const selectedDate: { kind: "DATE"; date: string } = { ...date };
    const dates = [entry(unknown), entry(selectedDate)];
    const pending = createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: dates });
    selectedDate.date = "2026-12-18";
    dates.reverse();
    const artifact = await pending;
    const reordered = await createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, selected_entries: [entry(date), entry(unknown)],
    });
    expect(artifact).toEqual(reordered);
    expect(artifact.retention_id).toBe(`canonical-documentary-evidence-retention:sha256:${artifact.retention_digest}`);
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(artifact.entries)).toBe(true);
    expect(Object.isFrozen(selectedDate)).toBe(false);
  });

  it("preserves V1 serialization, identity, groups, candidates and comparison output", async () => {
    const { context, actualRef, planRef } = await operationalFixture();
    const originalJson = JSON.stringify(context.composition);
    const compare = async (composition: typeof context.composition) => {
      const retrieved = await retrieveCanonicalStructuredRealityV1(composition, actualRef);
      const plan = retrieved.comparison_candidates.find(candidate => candidate.observation_ref === planRef)!;
      const actual = retrieved.comparison_candidates.find(candidate => candidate.observation_ref === actualRef)!;
      const comparison = await evaluateGovernedPlanRealityElementComparisonV1({
        version: 1,
        evaluation_scope: context.evaluation_scope,
        applicable_plan_context_ref: "plan-context:synthetic",
        applicable_plan_context_digest: "d".repeat(64),
        plan_reference_eligibility: "ELIGIBLE",
        plan_element_ref: "plan-element:synthetic",
        plan_target: plan,
        reality_observation: actual,
      });
      return { retrieved, comparison };
    };
    const baseline = await compare(context.composition);
    expect(baseline.comparison.disposition).toBe("EXACT_TARGET_SATISFIED");
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({
      ...context, selected_entries: [entry(date), entry(range), entry(unknown), { ...entry(instant), linked_observation_ref: actualRef }],
    });
    expect(JSON.stringify(context.composition)).toBe(originalJson);
    const reparsed = JSON.parse(originalJson);
    await expect(verifyCanonicalOperationalRealityCompositionV1(reparsed)).resolves.toBeUndefined();
    expect(artifact.composition).toEqual({
      composition_id: reparsed.composition_id, composition_digest: reparsed.composition_digest,
    });
    expect(reparsed.semantic_groups).toEqual(context.composition.semantic_groups);
    expect(await compare(reparsed)).toEqual(baseline);
  });

  it("retains documentary provenance for an exact conflicted observation with no operational candidate", async () => {
    const { context, actualRef } = await operationalFixture(true);
    const selected = { ...entry(instant), linked_observation_ref: actualRef };
    const artifact = await createCanonicalDocumentaryEvidenceRetentionV1({ ...context, selected_entries: [selected] });
    await expect(retrieveCanonicalDocumentaryEvidenceV1(
      artifact, selected.documentary_ref, { ...context, retention_id: artifact.retention_id },
    )).resolves.toMatchObject({ entry: selected });
    const retrieved = await retrieveCanonicalStructuredRealityV1(context.composition, actualRef);
    expect(retrieved.audit_observations).toHaveLength(2);
    expect(retrieved.comparison_candidates).toEqual([]);
  });
});
