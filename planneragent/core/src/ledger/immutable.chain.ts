// core/src/ledger/immutable.chain.ts
// ============================================================
// PlannerAgent — Immutable Governance Chain
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Create immutable governance-grade chained records for:
//
// - governance
// - cognition
// - execution
// - attention
// - auditability
//
// CORE PRINCIPLE
// ------------------------------------------------------------
// Governance history must not be rewritable.
//
// DOES NOT:
// - replace databases
// - encrypt payloads
// - authorize execution
//
// DOES:
// - create immutable chain links
// - preserve audit continuity
// - detect integrity breaks
// - provide governance traceability
//
// ============================================================

import type {
  EncryptionDomain,
} from "../security/encryption.domains";

// ============================================================
// LEDGER DOMAIN
// ============================================================

export type ImmutableLedgerDomain =
  | "GOVERNANCE"
  | "COGNITION"
  | "EXECUTION"
  | "ATTENTION"
  | "AUDIT";

// ============================================================
// CHAIN RECORD
// ============================================================

export interface ImmutableChainRecord {

  chain_id: string;

  tenant_id: string;

  company_id: string;

  domain:
    ImmutableLedgerDomain;

  encryption_domain:
    EncryptionDomain;

  previous_hash:
    string | null;

  current_hash:
    string;

  payload_hash:
    string;

  sequence_number:
    number;

  immutable: true;

  created_at: string;

  metadata?: Record<string, unknown>;
}

// ============================================================
// APPEND INPUT
// ============================================================

export interface AppendImmutableRecordInput {

  tenant_id: string;

  company_id: string;

  domain:
    ImmutableLedgerDomain;

  encryption_domain:
    EncryptionDomain;

  payload: unknown;

  previous?: ImmutableChainRecord | null;

  metadata?: Record<string, unknown>;
}

// ============================================================
// VERIFY RESULT
// ============================================================

export interface ImmutableChainVerification {

  valid: boolean;

  continuityValid: boolean;

  hashValid: boolean;

  immutable: boolean;

  brokenAt?: string;

  summary: string[];
}

// ============================================================
// MAIN APPEND
// ============================================================

export async function appendImmutableRecord(
  input: AppendImmutableRecordInput
): Promise<ImmutableChainRecord> {

  const payloadHash =
    await sha256Hex(
      stableStringify(
        input.payload
      )
    );

  const previousHash =
    input.previous?.current_hash ??
    null;

  const sequence =
    (input.previous?.sequence_number ?? 0) + 1;

  const chainMaterial =
    stableStringify({

      tenant_id:
        input.tenant_id,

      company_id:
        input.company_id,

      domain:
        input.domain,

      encryption_domain:
        input.encryption_domain,

      previous_hash:
        previousHash,

      payload_hash:
        payloadHash,

      sequence_number:
        sequence,
    });

  const currentHash =
    await sha256Hex(
      chainMaterial
    );

  return {

    chain_id:
      crypto.randomUUID(),

    tenant_id:
      input.tenant_id,

    company_id:
      input.company_id,

    domain:
      input.domain,

    encryption_domain:
      input.encryption_domain,

    previous_hash:
      previousHash,

    current_hash:
      currentHash,

    payload_hash:
      payloadHash,

    sequence_number:
      sequence,

    immutable: true,

    created_at:
      new Date()
        .toISOString(),

    metadata:
      input.metadata,
  };

}

// ============================================================
// VERIFY CHAIN
// ============================================================

export async function verifyImmutableChain(
  records: ImmutableChainRecord[]
): Promise<ImmutableChainVerification> {

  if (!records.length) {

    return {

      valid: true,

      continuityValid: true,

      hashValid: true,

      immutable: true,

      summary: [
        "empty_chain",
      ],
    };

  }

  for (
    let i = 0;
    i < records.length;
    i++
  ) {

    const current =
      records[i];

    // --------------------------------------------------------
    // IMMUTABLE FLAG
    // --------------------------------------------------------

    if (!current.immutable) {

      return fail(
        current.chain_id,
        "mutable_record_detected"
      );

    }

    // --------------------------------------------------------
    // CHAIN CONTINUITY
    // --------------------------------------------------------

    if (i > 0) {

      const previous =
        records[i - 1];

      if (
        current.previous_hash !==
        previous.current_hash
      ) {

        return fail(
          current.chain_id,
          "chain_continuity_broken"
        );

      }

      if (
        current.sequence_number !==
        previous.sequence_number + 1
      ) {

        return fail(
          current.chain_id,
          "sequence_integrity_broken"
        );

      }

    }

  }

  return {

    valid: true,

    continuityValid: true,

    hashValid: true,

    immutable: true,

    summary: [
      "immutable_chain_verified",
      `records:${records.length}`,
    ],
  };

}

// ============================================================
// FAIL
// ============================================================

function fail(
  chainId: string,
  reason: string
): ImmutableChainVerification {

  return {

    valid: false,

    continuityValid: false,

    hashValid: false,

    immutable: false,

    brokenAt:
      chainId,

    summary: [
      "immutable_chain_broken",
      reason,
    ],
  };

}

// ============================================================
// HASH
// ============================================================

async function sha256Hex(
  input: string
): Promise<string> {

  const enc =
    new TextEncoder();

  const data =
    enc.encode(input);

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return toHex(hash);

}

// ============================================================
// HEX
// ============================================================

function toHex(
  buffer: ArrayBuffer
): string {

  const bytes =
    new Uint8Array(buffer);

  return Array
    .from(bytes)
    .map(
      b =>
        b.toString(16)
          .padStart(2, "0")
    )
    .join("");

}

// ============================================================
// STABLE STRINGIFY
// ============================================================

function stableStringify(
  obj: unknown
): string {

  const seen =
    new WeakSet<object>();

  return JSON.stringify(
    obj,
    (_key, value) => {

      if (
        value &&
        typeof value === "object"
      ) {

        if (
          seen.has(value)
        ) {
          return undefined;
        }

        seen.add(value);

        if (
          Array.isArray(value)
        ) {
          return value;
        }

        const sorted:
          Record<string, unknown> = {};

        for (
          const key of Object.keys(value).sort()
        ) {

          sorted[key] =
            value[key];

        }

        return sorted;

      }

      return value;

    }
  );

}