import { getCapabilityById } from "./capabilities";
import type { CapabilityMap, IndustrialCapability } from "./uic.interface";
import {
  isConnectorIdentityCoherent,
  type ConnectorExecutionAccess,
  type ConnectorIdentity,
} from "./connector.access";
import type { ConnectorDataPolicyBinding } from "./data.access.policy";

export type ConnectorLifecycleState = "ENABLED" | "DISABLED" | "RETIRED";

export type ConnectorHealth = Readonly<{
  ok: boolean;
  connectorIdentityId: string;
  checkedAt: string;
  latencyMs?: number;
}>;

export type IndustrialConnector = {
  id: string;
  vendor: string;
  identity: ConnectorIdentity;
  dataPolicyBinding: ConnectorDataPolicyBinding;
  capabilities: readonly IndustrialCapability[];
  health(): Promise<ConnectorHealth>;
  execute(
    capabilityId: string,
    payload: Record<string, unknown>,
    access: ConnectorExecutionAccess
  ): Promise<Record<string, unknown>>;
};

export type ConnectorRegistrationResult = Readonly<{
  connectorId: string;
  identityId: string;
  lifecycle: ConnectorLifecycleState;
  revision: number;
  capabilityIds: readonly string[];
}>;

export type ConnectorLifecycleResult = Readonly<{
  connectorId: string;
  identityId: string;
  lifecycle: ConnectorLifecycleState;
  revision: number;
}>;

export type ConnectorInvocationSnapshot = Readonly<{
  connectorId: string;
  vendor: string;
  identity: ConnectorIdentity;
  dataPolicyBinding: ConnectorDataPolicyBinding;
  lifecycle: ConnectorLifecycleState;
  revision: number;
  capability: IndustrialCapability;
  health: IndustrialConnector["health"];
  execute: IndustrialConnector["execute"];
}>;

type ConnectorRecord = {
  readonly connector: Readonly<IndustrialConnector>;
  lifecycle: ConnectorLifecycleState;
  revision: number;
};

const recordsByIdentity = new Map<string, ConnectorRecord>();
const identityByConnectorId = new Map<string, string>();

function copyCapability(
  capability: IndustrialCapability
): Readonly<IndustrialCapability> {
  return Object.freeze({ ...capability });
}

function validateCapabilityDeclaration(
  capability: IndustrialCapability
): void {
  const canonical = getCapabilityById(capability.id);

  if (
    !canonical ||
    canonical.domain !== capability.domain ||
    canonical.verb !== capability.verb ||
    canonical.description !== capability.description
  ) {
    throw new Error(`Invalid capability declaration '${capability.id}'`);
  }
}

export function registerConnector(
  connector: IndustrialConnector
): ConnectorRegistrationResult {
  if (
    !isConnectorIdentityCoherent(connector.id, connector.identity) ||
    connector.vendor.trim().length === 0 ||
    typeof connector.health !== "function" ||
    typeof connector.execute !== "function" ||
    !connector.dataPolicyBinding ||
    connector.dataPolicyBinding.tenantId.trim().length === 0 ||
    connector.dataPolicyBinding.sourceSystem.trim().length === 0 ||
    connector.dataPolicyBinding.sourceRegion.trim().length === 0 ||
    connector.dataPolicyBinding.transportScheme !== "HTTPS"
  ) {
    throw new Error(`Connector '${connector.id}' has an incoherent implementation`);
  }

  if (recordsByIdentity.has(connector.identity.identityId)) {
    throw new Error(
      `Duplicate connector identity '${connector.identity.identityId}'`
    );
  }

  if (identityByConnectorId.has(connector.id)) {
    throw new Error(`Conflicting connector registration '${connector.id}'`);
  }

  if (connector.capabilities.length === 0) {
    throw new Error(`Connector '${connector.id}' declares no capabilities`);
  }

  const capabilityIds = new Set<string>();
  for (const capability of connector.capabilities) {
    validateCapabilityDeclaration(capability);
    if (capabilityIds.has(capability.id)) {
      throw new Error(
        `Connector '${connector.id}' declares duplicate capability '${capability.id}'`
      );
    }
    capabilityIds.add(capability.id);
  }

  const identity = Object.freeze({ ...connector.identity });
  const dataPolicyBinding = Object.freeze({ ...connector.dataPolicyBinding });
  const capabilities = Object.freeze(
    connector.capabilities.map(copyCapability)
  );
  const immutableConnector = Object.freeze({
    id: connector.id,
    vendor: connector.vendor,
    identity,
    dataPolicyBinding,
    capabilities,
    health: connector.health,
    execute: connector.execute,
  });
  const record: ConnectorRecord = {
    connector: immutableConnector,
    lifecycle: "ENABLED",
    revision: 1,
  };

  recordsByIdentity.set(identity.identityId, record);
  identityByConnectorId.set(connector.id, identity.identityId);

  return Object.freeze({
    connectorId: connector.id,
    identityId: identity.identityId,
    lifecycle: record.lifecycle,
    revision: record.revision,
    capabilityIds: Object.freeze([...capabilityIds].sort()),
  });
}

export function transitionConnectorLifecycle(
  identityId: string,
  target: Exclude<ConnectorLifecycleState, "ENABLED"> | "ENABLED"
): ConnectorLifecycleResult {
  const record = recordsByIdentity.get(identityId);
  if (!record) {
    throw new Error(`Connector identity '${identityId}' is not registered`);
  }
  if (record.lifecycle === "RETIRED") {
    throw new Error(`Connector identity '${identityId}' is retired`);
  }
  if (record.lifecycle === target) {
    throw new Error(`Connector identity '${identityId}' is already ${target}`);
  }

  record.lifecycle = target;
  record.revision += 1;

  return Object.freeze({
    connectorId: record.connector.id,
    identityId,
    lifecycle: record.lifecycle,
    revision: record.revision,
  });
}

export function getCapabilityMap(): CapabilityMap {
  const map: CapabilityMap = {};
  const records = [...recordsByIdentity.values()].sort((a, b) =>
    a.connector.identity.identityId.localeCompare(
      b.connector.identity.identityId
    )
  );

  for (const record of records) {
    for (const capability of record.connector.capabilities) {
      map[capability.id] = copyCapability(capability);
    }
  }

  return Object.freeze(map);
}

export async function getSystemRegistry() {
  const connectors = [...recordsByIdentity.values()]
    .sort((a, b) =>
      a.connector.identity.identityId.localeCompare(
        b.connector.identity.identityId
      )
    )
    .map(record =>
      Object.freeze({
        id: record.connector.id,
        vendor: record.connector.vendor,
        identity_id: record.connector.identity.identityId,
        lifecycle: record.lifecycle,
        revision: record.revision,
        capabilities: Object.freeze(
          record.connector.capabilities.map(capability => capability.id).sort()
        ),
      })
    );

  return Object.freeze({
    connectors: Object.freeze(connectors),
    capabilities: getCapabilityMap(),
  });
}

export function getInvocationCandidates(
  capabilityId: string
): readonly ConnectorInvocationSnapshot[] {
  const candidates = [...recordsByIdentity.values()]
    .filter(
      record =>
        record.lifecycle === "ENABLED" &&
        record.connector.capabilities.some(
          capability => capability.id === capabilityId
        )
    )
    .sort((a, b) =>
      a.connector.identity.identityId.localeCompare(
        b.connector.identity.identityId
      )
    )
    .map(record => {
      const capability = record.connector.capabilities.find(
        candidate => candidate.id === capabilityId
      );
      if (!capability) {
        throw new Error("Connector capability snapshot is incoherent");
      }
      return Object.freeze({
        connectorId: record.connector.id,
        vendor: record.connector.vendor,
        identity: record.connector.identity,
        dataPolicyBinding: record.connector.dataPolicyBinding,
        lifecycle: record.lifecycle,
        revision: record.revision,
        capability,
        health: record.connector.health,
        execute: record.connector.execute,
      });
    });

  return Object.freeze(candidates);
}

export function isInvocationSnapshotCurrent(
  snapshot: ConnectorInvocationSnapshot
): boolean {
  const record = recordsByIdentity.get(snapshot.identity.identityId);
  return Boolean(
    record &&
    record.connector.id === snapshot.connectorId &&
    record.connector.identity === snapshot.identity &&
    record.lifecycle === "ENABLED" &&
    record.revision === snapshot.revision
  );
}
