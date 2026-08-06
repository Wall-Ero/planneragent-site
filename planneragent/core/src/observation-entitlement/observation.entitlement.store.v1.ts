import type {
  ObservationEntitlementId,
  ObservationEntitlementV1,
} from "./observation.entitlement.contracts.v1";

export type TemporaryEntitlementState = "ACTIVE" | "CONSUMED" | "REVOKED";

export interface TemporaryObservationEntitlementStoreV1 {
  create(entitlement: ObservationEntitlementV1): Promise<void>;
  find(id: ObservationEntitlementId): Promise<Readonly<{
    entitlement: ObservationEntitlementV1;
    state: TemporaryEntitlementState;
  }> | null>;
  consume(id: ObservationEntitlementId): Promise<boolean>;
  revoke(id: ObservationEntitlementId): Promise<boolean>;
}

/** Process-local by design: OE-WU1 does not create durable observation rights. */
export class InMemoryTemporaryObservationEntitlementStoreV1
implements TemporaryObservationEntitlementStoreV1 {
  private readonly records = new Map<ObservationEntitlementId, {
    entitlement: ObservationEntitlementV1;
    state: TemporaryEntitlementState;
  }>();

  async create(entitlement: ObservationEntitlementV1): Promise<void> {
    if (this.records.has(entitlement.observation_entitlement_id)) {
      throw new Error("OBSERVATION_ENTITLEMENT_DUPLICATE");
    }
    this.records.set(entitlement.observation_entitlement_id, {
      entitlement,
      state: "ACTIVE",
    });
  }

  async find(id: ObservationEntitlementId) {
    const record = this.records.get(id);
    return record
      ? Object.freeze({ entitlement: record.entitlement, state: record.state })
      : null;
  }

  async consume(id: ObservationEntitlementId): Promise<boolean> {
    const record = this.records.get(id);
    if (!record || record.state !== "ACTIVE") return false;
    record.state = "CONSUMED";
    return true;
  }

  async revoke(id: ObservationEntitlementId): Promise<boolean> {
    const record = this.records.get(id);
    if (!record || record.state !== "ACTIVE") return false;
    record.state = "REVOKED";
    return true;
  }
}
