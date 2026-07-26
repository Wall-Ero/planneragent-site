import { createHash } from "node:crypto";
import type {
  TrustedSignCompositionResult,
} from "./trusted.sign.composition";

export interface TrustedSignReplayReservation {
  readonly replayKey: string;
  readonly reservationId: string;
  readonly compositionId: string;
  readonly governanceDecisionId: string;
  readonly subjectId: string;
  readonly tenantId: string;
  readonly companyId: string;
  readonly providerKeyReference: string;
  readonly proofProfileId: string;
  readonly proofProfileVersion: string;
  readonly reservedAt: string;
}

export interface TrustedSignReplayReservationStore {
  reserveIfAbsent(
    reservation: TrustedSignReplayReservation,
  ): Promise<boolean>;
}

export type TrustedSignReplayCoordinationResult =
  | Readonly<{
      reserved: true;
      reservation: Readonly<TrustedSignReplayReservation>;
    }>
  | Readonly<{
      reserved: false;
      denialReason:
        | "TRUSTED_SIGN_COMPOSITION_REQUIRED"
        | "REPLAY_RESERVATION_IDENTITY_INVALID"
        | "REPLAY_RESERVATION_TIME_INVALID"
        | "SIGN_REPLAY_DETECTED"
        | "REPLAY_COORDINATION_FAILED";
    }>;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function deny(
  denialReason: Extract<TrustedSignReplayCoordinationResult, {
    reserved: false;
  }>["denialReason"],
): TrustedSignReplayCoordinationResult {
  return Object.freeze({ reserved: false, denialReason });
}

export async function reserveTrustedSignExecution(
  composition: TrustedSignCompositionResult,
  reservationId: string,
  reservedAt: string,
  store: TrustedSignReplayReservationStore,
): Promise<TrustedSignReplayCoordinationResult> {
  if (!composition.composed) return deny("TRUSTED_SIGN_COMPOSITION_REQUIRED");
  if (!UUID_V4.test(reservationId)) {
    return deny("REPLAY_RESERVATION_IDENTITY_INVALID");
  }
  if (
    !TIME.test(reservedAt) ||
    !Number.isFinite(Date.parse(reservedAt)) ||
    new Date(reservedAt).toISOString() !== reservedAt ||
    Date.parse(reservedAt) < Date.parse(composition.composedAt)
  ) return deny("REPLAY_RESERVATION_TIME_INVALID");

  const replayMaterial = [
    composition.governanceDecisionId,
    composition.subjectId,
    composition.tenantId,
    composition.companyId,
    composition.providerKeyReference,
    composition.proofProfileId,
    composition.proofProfileVersion,
  ].join("\u001f");
  const reservation: TrustedSignReplayReservation = Object.freeze({
    replayKey: createHash("sha256").update(replayMaterial, "utf8").digest("hex"),
    reservationId,
    compositionId: composition.compositionId,
    governanceDecisionId: composition.governanceDecisionId,
    subjectId: composition.subjectId,
    tenantId: composition.tenantId,
    companyId: composition.companyId,
    providerKeyReference: composition.providerKeyReference,
    proofProfileId: composition.proofProfileId,
    proofProfileVersion: composition.proofProfileVersion,
    reservedAt,
  });
  try {
    if (!(await store.reserveIfAbsent(reservation))) {
      return deny("SIGN_REPLAY_DETECTED");
    }
  } catch {
    return deny("REPLAY_COORDINATION_FAILED");
  }
  return Object.freeze({ reserved: true, reservation });
}

export interface TrustedSignReplayD1Database {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ meta?: { changes?: number } }>;
    };
  };
}

export class TrustedSignReplayD1Store
implements TrustedSignReplayReservationStore {
  constructor(private readonly db: TrustedSignReplayD1Database) {}

  async reserveIfAbsent(
    reservation: TrustedSignReplayReservation,
  ): Promise<boolean> {
    const result = await this.db.prepare(`
      INSERT INTO trusted_sign_replay_reservations (
        replay_key, reservation_id, composition_id,
        governance_decision_id, subject_id, tenant_id, company_id,
        provider_key_reference, proof_profile_id,
        proof_profile_version, reserved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(replay_key) DO NOTHING
    `).bind(
      reservation.replayKey,
      reservation.reservationId,
      reservation.compositionId,
      reservation.governanceDecisionId,
      reservation.subjectId,
      reservation.tenantId,
      reservation.companyId,
      reservation.providerKeyReference,
      reservation.proofProfileId,
      reservation.proofProfileVersion,
      reservation.reservedAt,
    ).run();
    return result.meta?.changes === 1;
  }
}
