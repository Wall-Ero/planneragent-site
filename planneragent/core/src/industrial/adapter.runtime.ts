import {
  getInvocationCandidates,
  isInvocationSnapshotCurrent,
  type ConnectorHealth,
  type ConnectorInvocationSnapshot,
} from "./system.registry";
import { getCapabilityById } from "./capabilities";
import type {
  AuthenticatedWorkloadIdentity,
  ConnectorAccessDenial,
  ConnectorAccessServices,
  ConnectorExecutionAccess,
  WorkloadIdentityEvidence,
} from "./connector.access";

export type AdapterExecutionInput = {
  capability_id: string;
  payload: Record<string, unknown>;
  workload_identity: WorkloadIdentityEvidence;
};

export type AdapterRuntimeDenial =
  | ConnectorAccessDenial
  | "CAPABILITY_NOT_REGISTERED"
  | "NO_ELIGIBLE_CONNECTOR"
  | "AMBIGUOUS_ELIGIBLE_CONNECTORS"
  | "CONNECTOR_RUNTIME_INTEGRITY_FAILED"
  | "CONNECTOR_HEALTH_FAILED"
  | "CONNECTOR_HEALTH_INVALID"
  | "CONNECTOR_HEALTH_STALE"
  | "CONNECTOR_EXECUTION_FAILED"
  | "CONNECTOR_EXECUTION_TIMEOUT";

export type AdapterExecutionResult =
  | Readonly<{
      ok: true;
      capability_id: string;
      connector_id: string;
      connector_identity_id: string;
      output: unknown;
      executed_at: string;
    }>
  | Readonly<{
      ok: false;
      reason: string;
      denial: AdapterRuntimeDenial;
      diagnostic_id?: string;
    }>;

export type ConnectorRuntimeDiagnostic = Readonly<{
  diagnosticId: string;
  connectorIdentityId?: string;
  phase: "ACCESS" | "HEALTH" | "EXECUTION";
  code: AdapterRuntimeDenial;
  errorType?: string;
}>;

export type AdapterRuntimeOptions = Readonly<{
  executionTimeoutMs?: number;
  healthMaxAgeMs?: number;
  now?: () => number;
  recordDiagnostic?: (diagnostic: ConnectorRuntimeDiagnostic) => void;
}>;

const DEFAULT_EXECUTION_TIMEOUT_MS = 5_000;
const DEFAULT_HEALTH_MAX_AGE_MS = 30_000;
let diagnosticSequence = 0;

function denial(
  code: AdapterRuntimeDenial,
  reason: string,
  options: AdapterRuntimeOptions,
  phase?: ConnectorRuntimeDiagnostic["phase"],
  connectorIdentityId?: string,
  error?: unknown
): AdapterExecutionResult {
  if (!phase) {
    return Object.freeze({ ok: false, reason, denial: code });
  }

  diagnosticSequence += 1;
  const diagnosticId = `connector-diagnostic-${diagnosticSequence}`;
  options.recordDiagnostic?.(Object.freeze({
    diagnosticId,
    connectorIdentityId,
    phase,
    code,
    errorType: error instanceof Error ? error.constructor.name : undefined,
  }));

  return Object.freeze({
    ok: false,
    reason,
    denial: code,
    diagnostic_id: diagnosticId,
  });
}

function validateHealth(
  health: ConnectorHealth,
  connector: ConnectorInvocationSnapshot,
  now: number,
  maxAgeMs: number
): "VALID" | "INVALID" | "STALE" {
  if (
    !health ||
    typeof health.ok !== "boolean" ||
    health.connectorIdentityId !== connector.identity.identityId ||
    typeof health.checkedAt !== "string" ||
    !Number.isFinite(Date.parse(health.checkedAt)) ||
    (health.latencyMs !== undefined &&
      (!Number.isFinite(health.latencyMs) || health.latencyMs < 0))
  ) {
    return "INVALID";
  }

  const age = now - Date.parse(health.checkedAt);
  return age < 0 || age > maxAgeMs ? "STALE" : "VALID";
}

async function executeWithTimeout(
  connector: ConnectorInvocationSnapshot,
  input: AdapterExecutionInput,
  access: ConnectorExecutionAccess,
  timeoutMs: number
): Promise<
  | { kind: "SUCCESS"; output: Record<string, unknown> }
  | { kind: "FAILURE"; error: unknown }
  | { kind: "TIMEOUT" }
> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{ kind: "TIMEOUT" }>(resolve => {
    timeoutHandle = setTimeout(() => resolve({ kind: "TIMEOUT" }), timeoutMs);
  });
  const execution = connector
    .execute(input.capability_id, input.payload, access)
    .then(output => ({ kind: "SUCCESS" as const, output }))
    .catch(error => ({ kind: "FAILURE" as const, error }));

  const result = await Promise.race([execution, timeout]);
  if (timeoutHandle !== undefined) {
    clearTimeout(timeoutHandle);
  }
  return result;
}

export async function executeAdapter(
  input: AdapterExecutionInput,
  accessServices?: ConnectorAccessServices,
  options: AdapterRuntimeOptions = {}
): Promise<AdapterExecutionResult> {
  const capability = getCapabilityById(input.capability_id);
  if (!capability) {
    return denial(
      "CAPABILITY_NOT_REGISTERED",
      `Capability '${input.capability_id}' not registered`,
      options
    );
  }
  if (!accessServices) {
    return denial(
      "ACCESS_SERVICES_REQUIRED",
      "Connector access services are required",
      options
    );
  }

  let workload: AuthenticatedWorkloadIdentity | null;
  try {
    workload = await accessServices.authenticateWorkload(
      input.workload_identity
    );
  } catch (error) {
    return denial(
      "CONNECTOR_ACCESS_EVALUATION_FAILED",
      "Connector access evaluation failed",
      options,
      "ACCESS",
      undefined,
      error
    );
  }
  if (!workload) {
    return denial(
      "WORKLOAD_AUTHENTICATION_FAILED",
      "Workload authentication failed",
      options
    );
  }

  const candidates = getInvocationCandidates(input.capability_id);
  const authorized: ConnectorInvocationSnapshot[] = [];
  try {
    for (const candidate of candidates) {
      if (await accessServices.authorizeConnectorUse({
        workload,
        connectorIdentity: candidate.identity,
        capability: candidate.capability,
      })) {
        authorized.push(candidate);
      }
    }
  } catch (error) {
    return denial(
      "CONNECTOR_ACCESS_EVALUATION_FAILED",
      "Connector access evaluation failed",
      options,
      "ACCESS",
      undefined,
      error
    );
  }

  if (authorized.length === 0) {
    return denial(
      candidates.length === 0
        ? "NO_ELIGIBLE_CONNECTOR"
        : "CONNECTOR_AUTHORIZATION_DENIED",
      candidates.length === 0
        ? `No eligible connector supports capability '${input.capability_id}'`
        : "Connector use is not authorized",
      options
    );
  }
  if (authorized.length > 1) {
    return denial(
      "AMBIGUOUS_ELIGIBLE_CONNECTORS",
      `Multiple eligible connectors support capability '${input.capability_id}'`,
      options
    );
  }

  const connector = authorized[0];
  if (!connector || !isInvocationSnapshotCurrent(connector)) {
    return denial(
      "CONNECTOR_RUNTIME_INTEGRITY_FAILED",
      "Connector invocation identity is no longer current",
      options
    );
  }

  let executionAccess: ConnectorExecutionAccess;
  try {
    const credential = await accessServices.resolveConnectorCredential(
      connector.identity.credentialReference
    );
    if (
      !credential ||
      credential.credentialReference !==
        connector.identity.credentialReference ||
      credential.secret.length === 0
    ) {
      return denial(
        "CONNECTOR_CREDENTIAL_UNAVAILABLE",
        "Connector credential is unavailable",
        options
      );
    }
    executionAccess = Object.freeze({
      workload: Object.freeze({ ...workload }),
      credential: Object.freeze({ ...credential }),
    });
  } catch (error) {
    return denial(
      "CONNECTOR_ACCESS_EVALUATION_FAILED",
      "Connector access evaluation failed",
      options,
      "ACCESS",
      connector.identity.identityId,
      error
    );
  }

  let health: ConnectorHealth;
  try {
    health = await connector.health();
  } catch (error) {
    return denial(
      "CONNECTOR_HEALTH_FAILED",
      "Connector health evaluation failed",
      options,
      "HEALTH",
      connector.identity.identityId,
      error
    );
  }

  const now = options.now?.() ?? Date.now();
  const healthState = validateHealth(
    health,
    connector,
    now,
    options.healthMaxAgeMs ?? DEFAULT_HEALTH_MAX_AGE_MS
  );
  if (healthState === "INVALID") {
    return denial(
      "CONNECTOR_HEALTH_INVALID",
      "Connector health result is invalid",
      options
    );
  }
  if (healthState === "STALE") {
    return denial(
      "CONNECTOR_HEALTH_STALE",
      "Connector health result is stale",
      options
    );
  }
  if (!health.ok) {
    return denial(
      "CONNECTOR_HEALTH_FAILED",
      "Connector is unhealthy",
      options
    );
  }
  if (!isInvocationSnapshotCurrent(connector)) {
    return denial(
      "CONNECTOR_RUNTIME_INTEGRITY_FAILED",
      "Connector invocation identity changed before execution",
      options
    );
  }

  const execution = await executeWithTimeout(
    connector,
    input,
    executionAccess,
    options.executionTimeoutMs ?? DEFAULT_EXECUTION_TIMEOUT_MS
  );
  if (execution.kind === "TIMEOUT") {
    return denial(
      "CONNECTOR_EXECUTION_TIMEOUT",
      "Connector execution timed out",
      options,
      "EXECUTION",
      connector.identity.identityId
    );
  }
  if (execution.kind === "FAILURE") {
    return denial(
      "CONNECTOR_EXECUTION_FAILED",
      "Connector execution failed",
      options,
      "EXECUTION",
      connector.identity.identityId,
      execution.error
    );
  }
  if (!isInvocationSnapshotCurrent(connector)) {
    return denial(
      "CONNECTOR_RUNTIME_INTEGRITY_FAILED",
      "Connector invocation identity changed during execution",
      options
    );
  }

  return Object.freeze({
    ok: true,
    capability_id: input.capability_id,
    connector_id: connector.connectorId,
    connector_identity_id: connector.identity.identityId,
    output: execution.output,
    executed_at: new Date(now).toISOString(),
  });
}
