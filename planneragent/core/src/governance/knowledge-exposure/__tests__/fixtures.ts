import { identifier } from "../../../operational-identity/contracts/identifiers.v1";
import type { EncryptionDomain } from "../../../security/encryption.domains";
import { getEncryptionDomainPolicy } from "../../../security/encryption.domains";
import type {
  KnowledgeExposureRequestV1,
  KnowledgeProjectionManifestV1,
  KnowledgeReferenceV1,
} from "../knowledge.exposure.contracts.v1";
import { knowledgeProjectionDigestV1 } from "../knowledge.projection.guard.v1";

export const NOW = "2026-08-02T10:00:00.000Z";
export const tenant = identifier("TenantId", "tenant:oks");
export const company = identifier("CompanyId", "company:oks");

export function knowledge(overrides: Partial<KnowledgeReferenceV1> = {}): KnowledgeReferenceV1 {
  const domain: EncryptionDomain = overrides.encryption_domain ?? "NARRATIVE";
  const policy = getEncryptionDomainPolicy(domain);
  return {
    version: 1,
    knowledge_reference: "knowledge:customer-terms",
    digest: "a".repeat(64),
    tenant_id: tenant,
    company_id: company,
    category: "GENERATED_DOCUMENT",
    classification: policy.classification,
    encryption_domain: domain,
    sovereignty: policy.sovereignty,
    export_allowed: policy.export_allowed,
    llm_access_allowed: policy.llm_access_allowed,
    tenant_isolated: policy.tenant_isolated,
    permitted_regions: ["EU"],
    maximum_retention: "TRANSIENT_PROCESSING",
    authorized_fields: ["customer_name", "price", "terms"],
    provenance_references: ["provenance:quotation"],
    derived_from: [],
    ...overrides,
  };
}

export function manifest(
  refs: readonly KnowledgeReferenceV1[],
  fields = [{ field: "price", knowledge_reference: refs[0]!.knowledge_reference, category: refs[0]!.category }],
  overrides: Partial<KnowledgeProjectionManifestV1> = {},
): KnowledgeProjectionManifestV1 {
  const base = {
    version: 1 as const,
    schema_id: "quotation.customer-facing",
    schema_version: "1",
    representation: "STRUCTURED_JSON" as const,
    included_fields: [...fields].sort((a, b) => a.field.localeCompare(b.field)),
    excluded_categories: ["OPTIMIZER_OUTPUT", "DECISION_EVIDENCE"] as const,
    source_knowledge_references: [...new Set(fields.map(field => field.knowledge_reference))].sort(),
  };
  return { ...base, projection_digest: knowledgeProjectionDigestV1(base), ...overrides };
}

export function request(overrides: Partial<KnowledgeExposureRequestV1> = {}): KnowledgeExposureRequestV1 {
  const refs = overrides.knowledge ?? [knowledge()];
  const projection = overrides.projection ?? manifest(refs);
  return {
    version: 1,
    participation: {
      version: 1,
      participation_context_id: identifier("ParticipationContextId", "participation:oks"),
      principal_id: identifier("PrincipalId", "principal:oks"),
      session_id: identifier("SessionId", "session:oks"),
      membership_id: identifier("MembershipId", "membership:oks"),
      tenant_id: tenant,
      company_id: company,
      principal_active: true,
      session_active: true,
      membership_active: true,
    },
    authority_reference: "authority-proof:oks",
    operation: "COGNITIVE_EXPOSURE",
    purpose: { version: 1, code: "LANGUAGE_REFINEMENT", operation: "COGNITIVE_EXPOSURE" },
    knowledge: refs,
    projection,
    target_class: "SHARED_REMOTE_PROVIDER",
    target_identity: "provider:language-model",
    source_region: "EU",
    target_region: "EU",
    requested_retention: "NO_RETENTION",
    requested_validity_ms: 60_000,
    requested_at: NOW,
    correlation_id: identifier("CorrelationId", "correlation:oks"),
    causal_references: [identifier("AuditLineageReference", "audit:oks")],
    ...overrides,
  };
}

export function disclosure(overrides: Partial<KnowledgeExposureRequestV1> = {}): KnowledgeExposureRequestV1 {
  return request({
    operation: "OUTBOUND_DISCLOSURE",
    purpose: { version: 1, code: "CUSTOMER_QUOTATION_DISCLOSURE", operation: "OUTBOUND_DISCLOSURE" },
    target_class: "AUTHORIZED_BUSINESS_RECIPIENT",
    target_identity: "customer:001",
    ...overrides,
  });
}
