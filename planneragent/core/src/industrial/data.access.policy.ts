import {
  evaluateTenantBoundary,
  type TenantBoundaryResult,
} from "../security/tenant.boundary";
import {
  evaluateSovereigntyPolicy,
  type RuntimeLocality,
  type SovereigntyPolicyResult,
} from "../security/sovereignty.policy";
import {
  resolveEncryptionPolicy,
  type EncryptionPolicyResult,
} from "../security/encryption.policy";
import {
  getEncryptionDomainPolicy,
  type EncryptionDomain,
} from "../security/encryption.domains";
import type { IndustrialCapability } from "./uic.interface";

export type ConnectorDataPolicyBinding = Readonly<{
  tenantId: string;
  sourceSystem: string;
  sourceRegion: string;
  transportScheme: "HTTPS";
}>;

export type DataAccessContext = Readonly<{
  contextId: string;
  tenantId: string;
  targetTenantId: string;
  sourceSystem: string;
  sourceRegion: string;
  targetRegion: string;
  runtimeLocality: RuntimeLocality;
  encryptionDomain: EncryptionDomain;
  encryptionEvidence: Readonly<{
    contextId: string;
    connectorIdentityId: string;
    domain: EncryptionDomain;
    encryptedInTransit: boolean;
    encryptedAtRest: boolean;
  }>;
  transportEvidence: Readonly<{
    contextId: string;
    connectorIdentityId: string;
    scheme: string;
    secure: boolean;
  }>;
}>;

export type DataPolicyEvaluators = Readonly<{
  tenant: typeof evaluateTenantBoundary;
  sovereignty: typeof evaluateSovereigntyPolicy;
  encryption: typeof resolveEncryptionPolicy;
}>;

export const DEFAULT_DATA_POLICY_EVALUATORS: DataPolicyEvaluators =
  Object.freeze({
    tenant: evaluateTenantBoundary,
    sovereignty: evaluateSovereigntyPolicy,
    encryption: resolveEncryptionPolicy,
  });

export type DataAccessPolicyDenial =
  | "DATA_ACCESS_CONTEXT_INVALID"
  | "DATA_ACCESS_CONTEXT_CONTRADICTORY"
  | "TENANT_BOUNDARY_DENIED"
  | "SOVEREIGNTY_POLICY_DENIED"
  | "ENCRYPTION_POLICY_DENIED"
  | "ENCRYPTION_EVIDENCE_MISSING"
  | "ENCRYPTION_DOWNGRADE"
  | "TRANSPORT_EVIDENCE_MISSING"
  | "TRANSPORT_SECURITY_DENIED"
  | "DATA_POLICY_RESULT_INVALID"
  | "DATA_POLICY_EVALUATION_FAILED";

export type DataAccessPolicyAdmission =
  | Readonly<{
      decision: "ADMITTED";
      context: DataAccessContext;
      connectorIdentityId: string;
      connectorRevision: number;
      capabilityId: string;
      authorizationReference: string;
      credentialReference: string;
      tenantDecision: Readonly<TenantBoundaryResult>;
      sovereigntyDecision: Readonly<SovereigntyPolicyResult>;
      encryptionDecision: Readonly<EncryptionPolicyResult>;
      admittedAt: string;
    }>
  | Readonly<{
      decision: "DENIED";
      denial: DataAccessPolicyDenial;
      decisions: Readonly<{
        tenant?: Readonly<TenantBoundaryResult>;
        sovereignty?: Readonly<SovereigntyPolicyResult>;
        encryption?: Readonly<EncryptionPolicyResult>;
      }>;
    }>;

export type DataAccessPolicyInput = Readonly<{
  context: DataAccessContext;
  connectorIdentityId: string;
  connectorRevision: number;
  connectorCredentialReference: string;
  connectorBinding: ConnectorDataPolicyBinding;
  capability: IndustrialCapability;
  authenticatedTenantId: string;
  authorizationReference: string;
  evaluatedAt: string;
}>;

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/;
const REGION = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

function copyContext(context: DataAccessContext): DataAccessContext {
  return Object.freeze({
    ...context,
    encryptionEvidence: Object.freeze({ ...context.encryptionEvidence }),
    transportEvidence: Object.freeze({ ...context.transportEvidence }),
  });
}

function copyDecision<T extends { summary: string[] }>(decision: T): Readonly<T> {
  return Object.freeze({
    ...decision,
    summary: Object.freeze([...decision.summary]),
  }) as Readonly<T>;
}

function denied(
  denial: DataAccessPolicyDenial,
  decisions: {
    tenant?: TenantBoundaryResult;
    sovereignty?: SovereigntyPolicyResult;
    encryption?: EncryptionPolicyResult;
  } = {}
): DataAccessPolicyAdmission {
  return Object.freeze({
    decision: "DENIED",
    denial,
    decisions: Object.freeze({
      tenant: decisions.tenant
        ? copyDecision(decisions.tenant)
        : undefined,
      sovereignty: decisions.sovereignty
        ? copyDecision(decisions.sovereignty)
        : undefined,
      encryption: decisions.encryption
        ? copyDecision(decisions.encryption)
        : undefined,
    }),
  });
}

function validContext(context: DataAccessContext): boolean {
  return Boolean(
    context &&
    IDENTIFIER.test(context.contextId) &&
    IDENTIFIER.test(context.tenantId) &&
    IDENTIFIER.test(context.targetTenantId) &&
    IDENTIFIER.test(context.sourceSystem) &&
    REGION.test(context.sourceRegion) &&
    REGION.test(context.targetRegion) &&
    ["TENANT_LOCAL", "REGION_LOCAL", "GLOBAL_RUNTIME"].includes(
      context.runtimeLocality
    ) &&
    getEncryptionDomainPolicy(context.encryptionDomain)
  );
}

export function evaluateDataAccessPolicy(
  input: DataAccessPolicyInput,
  evaluators: DataPolicyEvaluators = DEFAULT_DATA_POLICY_EVALUATORS
): DataAccessPolicyAdmission {
  try {
    if (
      !validContext(input.context) ||
      !IDENTIFIER.test(input.connectorIdentityId) ||
      !Number.isInteger(input.connectorRevision) ||
      input.connectorRevision < 1 ||
      !IDENTIFIER.test(input.authorizationReference) ||
      !Number.isFinite(Date.parse(input.evaluatedAt))
    ) {
      return denied("DATA_ACCESS_CONTEXT_INVALID");
    }

    const context = input.context;
    if (
      context.tenantId !== input.authenticatedTenantId ||
      context.tenantId !== input.connectorBinding.tenantId ||
      context.sourceSystem !== input.connectorBinding.sourceSystem ||
      context.sourceRegion !== input.connectorBinding.sourceRegion
    ) {
      return denied("DATA_ACCESS_CONTEXT_CONTRADICTORY");
    }

    const tenantDecision = evaluators.tenant({
      sourceTenant: context.tenantId,
      targetTenant: context.targetTenantId,
      domain: context.encryptionDomain,
    });
    const sovereigntyDecision = evaluators.sovereignty({
      domain: context.encryptionDomain,
      operation: "TRANSFER",
      tenant_id: context.tenantId,
      source_region: context.sourceRegion,
      target_region: context.targetRegion,
      runtime_locality: context.runtimeLocality,
      involves_execution: true,
    });
    const encryptionDecision = evaluators.encryption({
      domain: context.encryptionDomain,
      operation: "TRANSFER",
      tenant_id: context.tenantId,
      region: context.targetRegion,
    });

    if (!tenantDecision || !sovereigntyDecision || !encryptionDecision) {
      return denied("DATA_POLICY_RESULT_INVALID");
    }
    if (
      tenantDecision.allowed === tenantDecision.violation ||
      tenantDecision.sourceTenant !== context.tenantId ||
      tenantDecision.targetTenant !== context.targetTenantId ||
      tenantDecision.domain !== context.encryptionDomain
    ) {
      return denied("DATA_POLICY_RESULT_INVALID", {
        tenant: tenantDecision,
        sovereignty: sovereigntyDecision,
        encryption: encryptionDecision,
      });
    }
    if (!tenantDecision.allowed) {
      return denied("TENANT_BOUNDARY_DENIED", {
        tenant: tenantDecision,
        sovereignty: sovereigntyDecision,
        encryption: encryptionDecision,
      });
    }
    if (
      sovereigntyDecision.locality !== context.runtimeLocality ||
      (context.sourceRegion !== context.targetRegion &&
        sovereigntyDecision.allowed &&
        !sovereigntyDecision.crossRegionAllowed)
    ) {
      return denied("DATA_POLICY_RESULT_INVALID", {
        tenant: tenantDecision,
        sovereignty: sovereigntyDecision,
        encryption: encryptionDecision,
      });
    }
    if (!sovereigntyDecision.allowed) {
      return denied("SOVEREIGNTY_POLICY_DENIED", {
        tenant: tenantDecision,
        sovereignty: sovereigntyDecision,
        encryption: encryptionDecision,
      });
    }
    if (!encryptionDecision.allowed) {
      return denied("ENCRYPTION_POLICY_DENIED", {
        tenant: tenantDecision,
        sovereignty: sovereigntyDecision,
        encryption: encryptionDecision,
      });
    }

    const encryptionEvidence = context.encryptionEvidence;
    if (!encryptionEvidence) {
      return denied("ENCRYPTION_EVIDENCE_MISSING");
    }
    if (
      encryptionEvidence.contextId !== context.contextId ||
      encryptionEvidence.connectorIdentityId !== input.connectorIdentityId ||
      encryptionEvidence.domain !== context.encryptionDomain
    ) {
      return denied("DATA_ACCESS_CONTEXT_CONTRADICTORY");
    }
    const domainPolicy = getEncryptionDomainPolicy(context.encryptionDomain);
    if (
      (domainPolicy.encrypt_in_transit &&
        !encryptionEvidence.encryptedInTransit) ||
      (domainPolicy.encrypt_at_rest && !encryptionEvidence.encryptedAtRest) ||
      (encryptionDecision.encryptionRequired &&
        !encryptionEvidence.encryptedInTransit)
    ) {
      return denied("ENCRYPTION_DOWNGRADE");
    }

    const transportEvidence = context.transportEvidence;
    if (!transportEvidence) {
      return denied("TRANSPORT_EVIDENCE_MISSING");
    }
    if (
      transportEvidence.contextId !== context.contextId ||
      transportEvidence.connectorIdentityId !== input.connectorIdentityId
    ) {
      return denied("DATA_ACCESS_CONTEXT_CONTRADICTORY");
    }
    if (
      input.connectorBinding.transportScheme !== "HTTPS" ||
      transportEvidence.scheme !== input.connectorBinding.transportScheme ||
      !transportEvidence.secure
    ) {
      return denied("TRANSPORT_SECURITY_DENIED");
    }

    return Object.freeze({
      decision: "ADMITTED",
      context: copyContext(context),
      connectorIdentityId: input.connectorIdentityId,
      connectorRevision: input.connectorRevision,
      capabilityId: input.capability.id,
      authorizationReference: input.authorizationReference,
      credentialReference: input.connectorCredentialReference,
      tenantDecision: copyDecision(tenantDecision),
      sovereigntyDecision: copyDecision(sovereigntyDecision),
      encryptionDecision: copyDecision(encryptionDecision),
      admittedAt: input.evaluatedAt,
    });
  } catch {
    return denied("DATA_POLICY_EVALUATION_FAILED");
  }
}

export function isDataAccessAdmissionCurrent(
  admission: DataAccessPolicyAdmission,
  input: DataAccessPolicyInput
): boolean {
  const context = input.context;
  return Boolean(
    admission.decision === "ADMITTED" &&
    context &&
    context.encryptionEvidence &&
    context.transportEvidence &&
    admission.connectorIdentityId === input.connectorIdentityId &&
    admission.connectorRevision === input.connectorRevision &&
    admission.capabilityId === input.capability.id &&
    admission.context.contextId === context.contextId &&
    admission.context.tenantId === context.tenantId &&
    admission.context.targetTenantId === context.targetTenantId &&
    admission.context.sourceSystem === context.sourceSystem &&
    admission.context.sourceRegion === context.sourceRegion &&
    admission.context.targetRegion === context.targetRegion &&
    admission.context.runtimeLocality === context.runtimeLocality &&
    admission.context.encryptionDomain === context.encryptionDomain &&
    admission.context.encryptionEvidence.contextId ===
      context.encryptionEvidence.contextId &&
    admission.context.encryptionEvidence.connectorIdentityId ===
      context.encryptionEvidence.connectorIdentityId &&
    admission.context.encryptionEvidence.domain ===
      context.encryptionEvidence.domain &&
    admission.context.encryptionEvidence.encryptedInTransit ===
      context.encryptionEvidence.encryptedInTransit &&
    admission.context.encryptionEvidence.encryptedAtRest ===
      context.encryptionEvidence.encryptedAtRest &&
    admission.context.transportEvidence.contextId ===
      context.transportEvidence.contextId &&
    admission.context.transportEvidence.connectorIdentityId ===
      context.transportEvidence.connectorIdentityId &&
    admission.context.transportEvidence.scheme ===
      context.transportEvidence.scheme &&
    admission.context.transportEvidence.secure ===
      context.transportEvidence.secure &&
    admission.authorizationReference === input.authorizationReference &&
    admission.credentialReference === input.connectorCredentialReference
  );
}
