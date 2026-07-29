import {
  buildGovernedUploadOperationalContextV1,
} from "../contracts/invariants.v1";
import {
  identifier,
  type AuditLineageReference,
  type AuthorizationDecisionId,
  type ReplayStateReference,
} from "../contracts/identifiers.v1";
import type {
  AuthorizationDecisionV1,
  GovernedUploadOperationalContextV1,
} from "../contracts/track-a.v1";
import type { AuthorizationRepository } from "../persistence/repositories.v1";
import type { ResolvedOperationalParticipationV1 } from "../participation";
import {
  UploadAuthorizationRuntimeError,
  type GovernedUploadAuthorizationRequestV1,
  type GovernedUploadAuthorizationResultV1,
  type UploadAuthorizationConsumptionRequestV1,
  type UploadAuthorizationFailureCode,
} from "./authorization.contracts.v1";
import {
  D1UploadAuthorizationPersistence,
  type AuthorizationAuditRecord,
} from "./authorization.persistence.d1";
import type { UploadAuthorizationPolicyEvaluator } from "./authorization.policy.v1";

export interface UploadAuthorizationRuntimeDependencies {
  readonly authorizations: AuthorizationRepository;
  readonly persistence: D1UploadAuthorizationPersistence;
  readonly policy: UploadAuthorizationPolicyEvaluator;
  readonly ids: Readonly<{
    authorizationDecisionId(): AuthorizationDecisionId;
    authorizationAuditEventId(): string;
    replayStateReference(decisionId: AuthorizationDecisionId): ReplayStateReference;
  }>;
  readonly now: () => string;
}

export interface UploadAuthorizationRuntimePolicy {
  readonly executing_component: string;
}

function fail(code: UploadAuthorizationFailureCode): never {
  throw new UploadAuthorizationRuntimeError(code);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 1024;
}

export class GovernedUploadAuthorizationRuntime {
  constructor(
    private readonly dependencies: UploadAuthorizationRuntimeDependencies,
    private readonly runtimePolicy: UploadAuthorizationRuntimePolicy,
  ) {}

  async authorize(
    request: GovernedUploadAuthorizationRequestV1,
  ): Promise<GovernedUploadAuthorizationResultV1> {
    if (
      request?.version !== 1 ||
      request.participation?.version !== 1 ||
      !text(request.upload_id) ||
      !text(request.resource) ||
      !text(request.purpose) ||
      !text(request.correlation_id) ||
      !Array.isArray(request.causal_references)
    ) fail("AUTHORIZATION_INPUT_INVALID");

    const current = await this.revalidate(request.participation);
    const evaluatedAt = this.dependencies.now();
    const policy = await this.dependencies.policy.evaluate(Object.freeze({
      participation: Object.freeze({
        ...request.participation,
        baseline_permissions: Object.freeze([...current.permissions]),
      }),
      permission: "UPLOAD_DATA",
      resource: request.resource,
      purpose: request.purpose,
      evaluated_at: evaluatedAt,
    }));
    const decisionId = this.dependencies.ids.authorizationDecisionId();
    const expiresAt = new Date(Math.min(
      Date.parse(evaluatedAt) + policy.validity_ms,
      Date.parse((await this.sessionExpiry(request.participation.session_id))),
    )).toISOString();
    const decision: AuthorizationDecisionV1 = Object.freeze({
      version: 1,
      authorization_decision_id: decisionId,
      permission: "UPLOAD_DATA",
      decision: policy.decision,
      principal_id: request.participation.principal_id,
      session_id: request.participation.session_id,
      membership_id: request.participation.membership_id,
      tenant_id: request.participation.owning_tenant_id,
      company_id: request.participation.selected_company_id,
      resource: request.resource,
      purpose: request.purpose,
      policy_version: policy.policy_version,
      issued_at: evaluatedAt,
      expires_at: expiresAt,
      reason_codes: Object.freeze([...policy.reason_codes]),
    });
    await this.dependencies.authorizations.create(decision);
    await this.audit(request, decision, "POLICY_EVALUATED");

    const lineage = Object.freeze([
      ...request.participation.audit_lineage,
      ...request.causal_references,
    ]);
    const authorization = Object.freeze({
      decision,
      participation_context_id: request.participation.participation_context_id,
      upload_id: request.upload_id,
      correlation_id: request.correlation_id,
      audit_lineage: lineage,
    });
    await this.audit(request, decision, "DECISION_ISSUED");
    if (decision.decision === "DENIED") {
      return Object.freeze({ authorization });
    }

    await this.dependencies.persistence.bindGovernedUpload({
      authorization_decision_id: decisionId,
      participation_context_id: request.participation.participation_context_id,
      upload_id: request.upload_id,
      correlation_id: request.correlation_id,
      audit_lineage_json: JSON.stringify(lineage),
      created_at: evaluatedAt,
    });
    await this.dependencies.authorizations.issueConsumption(decisionId, evaluatedAt);
    const raw = {
      version: 1 as const,
      upload_operational_context_id: identifier(
        "UploadOperationalContextId",
        `upload-context:${decisionId}`,
      ),
      principal_id: decision.principal_id,
      session_id: decision.session_id,
      membership_id: decision.membership_id,
      tenant_id: decision.tenant_id,
      company_id: decision.company_id,
      authorization_decision_id: decisionId,
      permission: "UPLOAD_DATA" as const,
      upload_id: request.upload_id,
      resource: decision.resource,
      purpose: decision.purpose,
      policy_version: decision.policy_version,
      issued_at: decision.issued_at,
      expires_at: decision.expires_at,
      replay_state_reference: this.dependencies.ids.replayStateReference(decisionId),
      audit_lineage: lineage,
      correlation_id: request.correlation_id,
    };
    const governed = buildGovernedUploadOperationalContextV1(
      raw, request.participation, decision,
    ) as GovernedUploadOperationalContextV1 & { correlation_id: typeof request.correlation_id };
    return Object.freeze({ authorization, governed_context: governed });
  }

  async consume(
    context: GovernedUploadOperationalContextV1,
    request: UploadAuthorizationConsumptionRequestV1,
  ): Promise<void> {
    const decision = await this.dependencies.authorizations.find(request.authorization_decision_id);
    const binding = await this.dependencies.persistence.binding(request.authorization_decision_id);
    if (!decision || !binding) fail("AUTHORIZATION_SUBSTITUTED");
    if (decision.decision !== "ADMITTED") fail("AUTHORIZATION_POLICY_DENIED");
    if (Date.parse(decision.expires_at) <= Date.parse(this.dependencies.now())) {
      fail("AUTHORIZATION_EXPIRED");
    }
    if (
      context.authorization_decision_id !== decision.authorization_decision_id ||
      binding.upload_id !== request.upload_id ||
      context.upload_id !== request.upload_id ||
      decision.principal_id !== request.principal_id ||
      decision.session_id !== request.session_id ||
      decision.membership_id !== request.membership_id ||
      decision.company_id !== request.company_id ||
      decision.tenant_id !== request.tenant_id ||
      decision.resource !== request.resource ||
      decision.purpose !== request.purpose ||
      context.principal_id !== request.principal_id ||
      context.session_id !== request.session_id ||
      context.membership_id !== request.membership_id ||
      context.company_id !== request.company_id ||
      context.tenant_id !== request.tenant_id ||
      context.resource !== request.resource ||
      context.purpose !== request.purpose
    ) fail("AUTHORIZATION_SUBSTITUTED");

    await this.revalidate({
      version: 1,
      participation_context_id: binding.participation_context_id as ResolvedOperationalParticipationV1["participation_context_id"],
      principal_id: decision.principal_id,
      session_id: decision.session_id,
      membership_id: decision.membership_id,
      selected_company_id: decision.company_id,
      owning_tenant_id: decision.tenant_id,
      resolved_at: decision.issued_at,
      platform_role_ids: Object.freeze([]),
      platform_permission_ids: Object.freeze([]),
      baseline_permissions: Object.freeze(["UPLOAD_DATA"]),
      membership_state_version: "CURRENT_REVALIDATION",
      ownership_reference: await this.currentOwnershipReference(decision.company_id, decision.tenant_id),
      company_selection_reference: await this.currentSelectionReference(decision.session_id),
      audit_lineage: Object.freeze([]),
      correlation_id: request.correlation_id,
    });
    const consumed = await this.dependencies.authorizations.consume(
      decision.authorization_decision_id,
      this.dependencies.now(),
      `governed-upload:${request.upload_id}:${request.correlation_id}`,
    );
    if (!consumed) {
      await this.auditConsumption(decision, request, "CONSUMPTION_REJECTED", "AUTHORIZATION_ALREADY_CONSUMED");
      fail("AUTHORIZATION_ALREADY_CONSUMED");
    }
    await this.auditConsumption(decision, request, "CONSUMPTION_ADMITTED");
  }

  private async revalidate(context: ResolvedOperationalParticipationV1) {
    const current = await this.dependencies.persistence.currentState(context, this.dependencies.now());
    if (current.session_active !== 1) fail("AUTHORIZATION_SESSION_INELIGIBLE");
    if (current.principal_active !== 1) fail("AUTHORIZATION_PRINCIPAL_INELIGIBLE");
    if (current.membership_active !== 1) fail("AUTHORIZATION_MEMBERSHIP_INELIGIBLE");
    if (current.ownership_count !== 1) fail("AUTHORIZATION_TENANT_COMPANY_CONTRADICTORY");
    if (current.selection_current !== 1) fail("AUTHORIZATION_PARTICIPATION_STALE");
    return current;
  }

  private async sessionExpiry(sessionId: string): Promise<string> {
    const value = await this.dependencies.persistence.sessionExpiry(
      sessionId as ResolvedOperationalParticipationV1["session_id"],
    );
    if (!value) fail("AUTHORIZATION_SESSION_INELIGIBLE");
    return value;
  }

  private async currentOwnershipReference(companyId: string, tenantId: string): Promise<string> {
    const value = await this.dependencies.persistence.currentOwnershipReference(
      companyId as ResolvedOperationalParticipationV1["selected_company_id"],
      tenantId as ResolvedOperationalParticipationV1["owning_tenant_id"],
      this.dependencies.now(),
    );
    if (!value) fail("AUTHORIZATION_TENANT_COMPANY_CONTRADICTORY");
    return value;
  }

  private async currentSelectionReference(sessionId: string): Promise<string> {
    const value = await this.dependencies.persistence.currentSelectionReference(
      sessionId as ResolvedOperationalParticipationV1["session_id"],
    );
    if (!value) fail("AUTHORIZATION_PARTICIPATION_STALE");
    return value;
  }

  private audit(
    request: GovernedUploadAuthorizationRequestV1,
    decision: AuthorizationDecisionV1,
    eventKind: "POLICY_EVALUATED" | "DECISION_ISSUED",
  ) {
    return this.dependencies.persistence.appendAudit(
      this.dependencies.ids.authorizationAuditEventId(),
      this.auditRecord(decision, request.upload_id, request.correlation_id,
        request.causal_references, eventKind),
    );
  }

  private auditConsumption(
    decision: AuthorizationDecisionV1,
    request: UploadAuthorizationConsumptionRequestV1,
    eventKind: "CONSUMPTION_ADMITTED" | "CONSUMPTION_REJECTED",
    failureCode?: string,
  ) {
    return this.dependencies.persistence.appendAudit(
      this.dependencies.ids.authorizationAuditEventId(),
      this.auditRecord(decision, request.upload_id, request.correlation_id,
        Object.freeze([]), eventKind, failureCode),
    );
  }

  private auditRecord(
    decision: AuthorizationDecisionV1,
    uploadId: GovernedUploadOperationalContextV1["upload_id"],
    correlationId: string,
    causal: readonly AuditLineageReference[],
    eventKind: AuthorizationAuditRecord["event_kind"],
    failureCode?: string,
  ): AuthorizationAuditRecord {
    return Object.freeze({
      event_kind: eventKind,
      authorization_decision_id: decision.authorization_decision_id,
      decision_result: decision.decision,
      principal_id: decision.principal_id,
      session_id: decision.session_id,
      membership_id: decision.membership_id,
      company_id: decision.company_id,
      tenant_id: decision.tenant_id,
      upload_id: uploadId,
      resource: decision.resource,
      purpose: decision.purpose,
      policy_version: decision.policy_version,
      reason_codes: decision.reason_codes,
      ...(failureCode ? { failure_code: failureCode } : {}),
      correlation_id: correlationId,
      causal_references: causal,
      executing_component: this.runtimePolicy.executing_component,
      recorded_at: this.dependencies.now(),
    });
  }
}
