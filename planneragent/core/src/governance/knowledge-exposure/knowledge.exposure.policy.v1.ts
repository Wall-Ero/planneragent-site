import { createHash } from "node:crypto";
import { getEncryptionDomainPolicy } from "../../security/encryption.domains";
import type { DataClassification, SovereigntyClass } from "../../security/encryption.domains";
import type {
  KnowledgeExposureDecisionV1,
  KnowledgeExposureFailureCode,
  KnowledgeExposureRequestV1,
  KnowledgeReferenceV1,
  KnowledgeRetentionV1,
  ProviderOrRecipientClassV1,
} from "./knowledge.exposure.contracts.v1";
import {
  KNOWLEDGE_EXPOSURE_POLICY_VERSION,
} from "./knowledge.exposure.contracts.v1";
import {
  deepCopyAndFreeze,
  validateKnowledgeProjectionManifestV1,
} from "./knowledge.projection.guard.v1";

const TEXT = /^[A-Za-z0-9][A-Za-z0-9:._/@-]{0,255}$/;
const HEX = /^[0-9a-f]{64}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CLASSIFICATION: readonly DataClassification[] = ["PUBLIC", "INTERNAL", "SENSITIVE", "CRITICAL", "CONSTITUTIONAL"];
const SOVEREIGNTY: readonly SovereigntyClass[] = ["TENANT_LOCAL", "REGION_LOCKED", "BOARD_GOVERNED", "NON_EXPORTABLE"];
const RETENTION: readonly KnowledgeRetentionV1[] = ["NO_RETENTION", "TRANSIENT_PROCESSING", "TENANT_CONTROLLED_RETENTION"];
const COGNITIVE = new Set<ProviderOrRecipientClassV1>([
  "DETERMINISTIC_INTERNAL_PROCESSOR", "LOCAL_SELF_HOSTED_MODEL", "CUSTOMER_MANAGED_MODEL",
  "ENTERPRISE_DEDICATED_EXTERNAL_PROVIDER", "SOVEREIGN_REGION_EXTERNAL_PROVIDER", "SHARED_REMOTE_PROVIDER",
]);
const DISCLOSURE = new Set<ProviderOrRecipientClassV1>(["EXTERNAL_COMMUNICATION_PROVIDER", "AUTHORIZED_BUSINESS_RECIPIENT"]);
const PURPOSES = new Map([
  ["LANGUAGE_REFINEMENT", "COGNITIVE_EXPOSURE"], ["TRANSLATION", "COGNITIVE_EXPOSURE"],
  ["EXPLANATION", "COGNITIVE_EXPOSURE"], ["STRUCTURED_EXTRACTION", "COGNITIVE_EXPOSURE"],
  ["CUSTOMER_QUOTATION_DISCLOSURE", "OUTBOUND_DISCLOSURE"],
] as const);

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}
function validTime(value: unknown): value is string {
  return typeof value === "string" && TIME.test(value) && new Date(value).toISOString() === value;
}
function referenceFailures(reference: KnowledgeReferenceV1): KnowledgeExposureFailureCode[] {
  const failures: KnowledgeExposureFailureCode[] = [];
  if (!reference || reference.version !== 1 || !TEXT.test(reference.knowledge_reference ?? "") || !HEX.test(reference.digest ?? "")) {
    failures.push("KNOWLEDGE_REFERENCE_INVALID");
  }
  if (!CLASSIFICATION.includes(reference?.classification)) failures.push("KNOWLEDGE_CLASSIFICATION_MISSING");
  if (!reference?.encryption_domain || !reference.sovereignty || !Array.isArray(reference.authorized_fields) ||
      reference.authorized_fields.length === 0 || !Array.isArray(reference.permitted_regions) || reference.permitted_regions.length === 0 ||
      !Array.isArray(reference.provenance_references) || !Array.isArray(reference.derived_from)) {
    failures.push("KNOWLEDGE_REFERENCE_INVALID");
  }
  if (reference?.derived_from?.length && reference.provenance_references.length === 0) {
    failures.push("KNOWLEDGE_DERIVATION_RESTRICTION_UNKNOWN");
  }
  return failures;
}
function requestIdentity(request: KnowledgeExposureRequestV1): string {
  return `knowledge-exposure-request:sha256:${digest(request)}`;
}

export function evaluateKnowledgeExposurePolicyV1(
  unsafeRequest: KnowledgeExposureRequestV1,
  now: string = unsafeRequest?.requested_at,
): KnowledgeExposureDecisionV1 {
  const request = deepCopyAndFreeze(unsafeRequest) as KnowledgeExposureRequestV1;
  const failures = new Set<KnowledgeExposureFailureCode>();
  const p = request?.participation;
  if (!request || request.version !== 1 || !validTime(now) || !validTime(request.requested_at) ||
      !Number.isSafeInteger(request.requested_validity_ms) || request.requested_validity_ms < 1 || request.requested_validity_ms > 3_600_000 ||
      !TEXT.test(request.correlation_id ?? "") || !Array.isArray(request.causal_references)) {
    failures.add("KNOWLEDGE_EXPOSURE_REQUEST_INVALID");
  }
  if (!p?.principal_id || p.principal_active !== true) failures.add("KNOWLEDGE_EXPOSURE_REQUEST_INVALID");
  if (!p?.session_id || p.session_active !== true) failures.add("KNOWLEDGE_EXPOSURE_REQUEST_INVALID");
  if (!p?.membership_id || p.membership_active !== true) failures.add("KNOWLEDGE_EXPOSURE_REQUEST_INVALID");
  if (!p?.tenant_id || !p?.company_id || !p.participation_context_id) failures.add("KNOWLEDGE_EXPOSURE_REQUEST_INVALID");
  if (!TEXT.test(request?.authority_reference ?? "")) failures.add("KNOWLEDGE_AUTHORITY_MISSING");
  const expectedOperation = PURPOSES.get(request?.purpose?.code as never);
  if (!request?.purpose || request.purpose.version !== 1 || !expectedOperation) failures.add("KNOWLEDGE_PURPOSE_INVALID");
  if (request?.purpose?.operation !== request?.operation || expectedOperation !== request?.operation) failures.add("KNOWLEDGE_OPERATION_MISMATCH");
  if (!Array.isArray(request?.knowledge) || request.knowledge.length === 0) failures.add("KNOWLEDGE_REFERENCE_INVALID");

  for (const reference of request?.knowledge ?? []) {
    referenceFailures(reference).forEach(code => failures.add(code));
    if (reference.tenant_id !== p?.tenant_id) failures.add("KNOWLEDGE_TENANT_CONTRADICTION");
    if (reference.company_id !== p?.company_id) failures.add("KNOWLEDGE_OWNER_CONTRADICTION");
    const domain = reference.encryption_domain ? getEncryptionDomainPolicy(reference.encryption_domain) : undefined;
    if (domain && (domain.classification !== reference.classification || domain.sovereignty !== reference.sovereignty ||
      domain.llm_access_allowed !== reference.llm_access_allowed || domain.export_allowed !== reference.export_allowed ||
      domain.tenant_isolated !== reference.tenant_isolated)) failures.add("KNOWLEDGE_REFERENCE_INVALID");
    if (request?.operation === "COGNITIVE_EXPOSURE" && (!reference.llm_access_allowed || !domain?.llm_access_allowed)) failures.add("KNOWLEDGE_DOMAIN_LLM_PROHIBITED");
    if (request?.operation === "OUTBOUND_DISCLOSURE" && (!reference.export_allowed || !domain?.export_allowed)) failures.add("KNOWLEDGE_DOMAIN_EXPORT_PROHIBITED");
    if (reference.sovereignty === "NON_EXPORTABLE") failures.add("KNOWLEDGE_NON_EXPORTABLE");
    if (!reference.tenant_isolated) failures.add("KNOWLEDGE_TENANT_CONTRADICTION");
    if (!reference.permitted_regions.includes(request?.target_region)) failures.add("KNOWLEDGE_REGION_CONFLICT");
    if (RETENTION.indexOf(request?.requested_retention) > RETENTION.indexOf(reference.maximum_retention)) failures.add("KNOWLEDGE_RETENTION_CONFLICT");
  }
  if (request?.source_region !== request?.target_region && request?.knowledge?.some(k => k.sovereignty !== "TENANT_LOCAL")) failures.add("KNOWLEDGE_REGION_CONFLICT");
  if (request?.operation === "COGNITIVE_EXPOSURE" && !COGNITIVE.has(request.target_class)) failures.add("KNOWLEDGE_PROVIDER_CLASS_PROHIBITED");
  if (request?.operation === "OUTBOUND_DISCLOSURE" && !DISCLOSURE.has(request.target_class)) failures.add("KNOWLEDGE_RECIPIENT_CLASS_PROHIBITED");
  validateKnowledgeProjectionManifestV1(request?.projection, request?.knowledge ?? []).forEach(code => failures.add(code));

  const byRef = new Map((request?.knowledge ?? []).map(item => [item.knowledge_reference, item]));
  for (const reference of request?.knowledge ?? []) {
    for (const contributorId of reference.derived_from) {
      const contributor = byRef.get(contributorId);
      if (!contributor) { failures.add("KNOWLEDGE_DERIVATION_RESTRICTION_UNKNOWN"); continue; }
      if (CLASSIFICATION.indexOf(reference.classification) < CLASSIFICATION.indexOf(contributor.classification) ||
          SOVEREIGNTY.indexOf(reference.sovereignty) < SOVEREIGNTY.indexOf(contributor.sovereignty) ||
          (reference.export_allowed && !contributor.export_allowed) || (reference.llm_access_allowed && !contributor.llm_access_allowed) ||
          RETENTION.indexOf(reference.maximum_retention) > RETENTION.indexOf(contributor.maximum_retention)) {
        failures.add("KNOWLEDGE_DERIVATION_DOWNGRADE_PROHIBITED");
      }
    }
  }

  const knowledge = request?.knowledge ?? [];
  const effectiveClassification = knowledge.length ? knowledge.reduce((a, b) => CLASSIFICATION.indexOf(a.classification) >= CLASSIFICATION.indexOf(b.classification) ? a : b).classification : "UNKNOWN";
  const effectiveSovereignty = knowledge.length ? knowledge.reduce((a, b) => SOVEREIGNTY.indexOf(a.sovereignty) >= SOVEREIGNTY.indexOf(b.sovereignty) ? a : b).sovereignty : "UNKNOWN";
  const effectiveRetention = knowledge.length ? knowledge.reduce((a, b) => RETENTION.indexOf(a.maximum_retention) <= RETENTION.indexOf(b.maximum_retention) ? a : b).maximum_retention : "UNKNOWN";
  const effectiveRegions = knowledge.length ? [...new Set(knowledge[0]!.permitted_regions.filter(region => knowledge.every(k => k.permitted_regions.includes(region))))].sort() : [];
  if (knowledge.length > 1 && effectiveRegions.length === 0) failures.add("KNOWLEDGE_REGION_CONFLICT");
  const reasons = [...failures].sort();
  const reqId = requestIdentity(request);
  const issuedAt = validTime(now) ? now : "1970-01-01T00:00:00.000Z";
  const expiresAt = new Date(Date.parse(issuedAt) + (Number.isSafeInteger(request?.requested_validity_ms) ? request.requested_validity_ms : 0)).toISOString();
  const subject = {
    request_id: reqId, outcome: reasons.length ? "DENIED" : "ADMITTED", policy_version: KNOWLEDGE_EXPOSURE_POLICY_VERSION,
    reason_codes: reasons, issued_at: issuedAt, expires_at: expiresAt,
  } as const;
  return deepCopyAndFreeze({
    version: 1, decision_id: `knowledge-exposure-decision:sha256:${digest(subject)}`, request_id: reqId,
    outcome: subject.outcome, principal_id: p?.principal_id ?? "UNKNOWN", session_id: p?.session_id ?? "UNKNOWN",
    membership_id: p?.membership_id ?? "UNKNOWN", tenant_id: p?.tenant_id ?? "UNKNOWN", company_id: p?.company_id ?? "UNKNOWN",
    authority_reference: request?.authority_reference || "UNKNOWN", operation: request?.operation ?? "UNKNOWN",
    purpose: request?.purpose?.code ?? "UNKNOWN", knowledge_digests: knowledge.map(k => k.digest).sort(),
    projection_digest: request?.projection?.projection_digest ?? "UNKNOWN", target_class: request?.target_class ?? "UNKNOWN",
    ...(request?.target_identity ? { target_identity: request.target_identity } : {}), effective_classification: effectiveClassification,
    effective_sovereignty: effectiveSovereignty, effective_regions: effectiveRegions, effective_retention: effectiveRetention,
    policy_version: KNOWLEDGE_EXPOSURE_POLICY_VERSION, reason_codes: reasons, issued_at: issuedAt, expires_at: expiresAt,
    consumption_identity: `knowledge-exposure-consumption:${digest({ request_id: reqId, projection_digest: request?.projection?.projection_digest, target_class: request?.target_class })}`,
    correlation_id: request?.correlation_id ?? "UNKNOWN",
  }) as KnowledgeExposureDecisionV1;
}

export function validateKnowledgeExposureDecisionV1(
  decision: KnowledgeExposureDecisionV1,
  request: KnowledgeExposureRequestV1,
  now: string,
): readonly KnowledgeExposureFailureCode[] {
  const failures: KnowledgeExposureFailureCode[] = [];
  if (!validTime(now) || Date.parse(decision.expires_at) <= Date.parse(now)) failures.push("KNOWLEDGE_DECISION_EXPIRED");
  const current = evaluateKnowledgeExposurePolicyV1(request, decision.issued_at);
  if (decision.outcome !== "ADMITTED" || current.request_id !== decision.request_id || current.decision_id !== decision.decision_id ||
      current.projection_digest !== decision.projection_digest || current.target_class !== decision.target_class ||
      current.purpose !== decision.purpose || current.operation !== decision.operation) failures.push("KNOWLEDGE_DECISION_SUBSTITUTED");
  return Object.freeze([...new Set(failures)].sort());
}
