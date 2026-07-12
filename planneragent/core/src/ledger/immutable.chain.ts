// core/src/ledger/immutable.chain.ts
// ============================================================
// PlannerAgent — Immutable Governance Chain
// Canonical Source of Truth
// ============================================================
//
// PURPOSE
// ------------------------------------------------------------
// Create and verify immutable governance-grade chained records
// for:
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
// - prove payload authenticity through a secret or private key
//
// DOES:
// - create immutable chain links
// - preserve audit continuity
// - verify record-hash integrity
// - verify chain continuity
// - verify chain identity continuity
// - verify tenant/company/domain continuity
// - verify encryption-domain continuity
// - detect cryptographic integrity breaks
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

  record_id: string;

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
// VERIFY INPUT
// ============================================================

export interface VerifyImmutableChainInput {

  records:
    ImmutableChainRecord[];

  payloads:
    unknown[];
}


// ============================================================
// VERIFY RESULT
// ============================================================

export interface ImmutableChainVerification {

  valid: boolean;

  continuityValid: boolean;

  hashValid: boolean;

  immutable: boolean;

  chainIdentityValid: boolean;

  tenantContinuityValid: boolean;

  companyContinuityValid: boolean;

  domainContinuityValid: boolean;

  encryptionDomainContinuityValid: boolean;

  payloadIntegrityValid: boolean;

  recordHashIntegrityValid: boolean;

  brokenAt?: string;

  failureReason?: string;

  summary: string[];
}


// ============================================================
// MAIN APPEND
// ============================================================

export async function appendImmutableRecord(
  input: AppendImmutableRecordInput
): Promise<ImmutableChainRecord> {

  assertAppendInputCoherent(
    input
  );

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

  const chainId =
    input.previous?.chain_id ??
    crypto.randomUUID();

  const chainMaterial =
    stableStringify({

      chain_id:
        chainId,

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

    record_id:
      crypto.randomUUID(),

    chain_id:
      chainId,

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

    immutable:
      true,

    created_at:
      new Date()
        .toISOString(),

    metadata:
      input.metadata
        ? {
            ...input.metadata,
          }
        : undefined,

  };

}


// ============================================================
// VERIFY CHAIN
// ============================================================

export async function verifyImmutableChain(
  input:
    VerifyImmutableChainInput
): Promise<ImmutableChainVerification> {

  const records =
    input.records;

  const payloads =
    input.payloads;

  if (
    records.length !==
    payloads.length
  ) {

    return fail(
      records[0]?.record_id,
      "payload_record_count_mismatch",
      {
        payloadIntegrityValid:
          false,
      }
    );

  }

  if (!records.length) {

    return {

      valid:
        true,

      continuityValid:
        true,

      hashValid:
        true,

      immutable:
        true,

      chainIdentityValid:
        true,

      tenantContinuityValid:
        true,

      companyContinuityValid:
        true,

      domainContinuityValid:
        true,

      encryptionDomainContinuityValid:
        true,

      payloadIntegrityValid:
        true,

      recordHashIntegrityValid:
        true,

      summary: [
        "empty_chain",
      ],

    };

  }

  const genesis =
    records[0];

  // ----------------------------------------------------------
  // GENESIS INTEGRITY
  // ----------------------------------------------------------

  if (
    genesis.previous_hash !==
    null
  ) {

    return fail(
      genesis.record_id,
      "genesis_previous_hash_invalid",
      {
        continuityValid:
          false,
      }
    );

  }

  if (
    genesis.sequence_number !==
    1
  ) {

    return fail(
      genesis.record_id,
      "genesis_sequence_invalid",
      {
        continuityValid:
          false,
      }
    );

  }

  for (
    let i = 0;
    i < records.length;
    i++
  ) {

    const current =
      records[i];

    const payload =
      payloads[i];

    // --------------------------------------------------------
    // RECORD SHAPE
    // --------------------------------------------------------

    if (
      !current.record_id ||
      typeof current.record_id !== "string"
    ) {

      return fail(
        current.record_id,
        "record_identity_missing"
      );

    }

    if (
      !current.chain_id ||
      typeof current.chain_id !== "string"
    ) {

      return fail(
        current.record_id,
        "chain_identity_missing",
        {
          chainIdentityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // IMMUTABLE FLAG
    // --------------------------------------------------------

    if (
      current.immutable !==
      true
    ) {

      return fail(
        current.record_id,
        "mutable_record_detected",
        {
          immutable:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // PAYLOAD HASH INTEGRITY
    // --------------------------------------------------------

    const expectedPayloadHash =
      await sha256Hex(
        stableStringify(
          payload
        )
      );

    if (
      current.payload_hash !==
      expectedPayloadHash
    ) {

      return fail(
        current.record_id,
        "payload_hash_mismatch",
        {
          hashValid:
            false,

          payloadIntegrityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // RECORD HASH INTEGRITY
    // --------------------------------------------------------

    const expectedCurrentHash =
      await computeRecordHash(
        current
      );

    if (
      current.current_hash !==
      expectedCurrentHash
    ) {

      return fail(
        current.record_id,
        "record_hash_mismatch",
        {
          hashValid:
            false,

          recordHashIntegrityValid:
            false,
        }
      );

    }

    if (
      i === 0
    ) {

      continue;

    }

    const previous =
      records[i - 1];

    // --------------------------------------------------------
    // CHAIN IDENTITY CONTINUITY
    // --------------------------------------------------------

    if (
      current.chain_id !==
      previous.chain_id
    ) {

      return fail(
        current.record_id,
        "chain_identity_broken",
        {
          continuityValid:
            false,

          chainIdentityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // TENANT CONTINUITY
    // --------------------------------------------------------

    if (
      current.tenant_id !==
      previous.tenant_id
    ) {

      return fail(
        current.record_id,
        "tenant_continuity_broken",
        {
          continuityValid:
            false,

          tenantContinuityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // COMPANY CONTINUITY
    // --------------------------------------------------------

    if (
      current.company_id !==
      previous.company_id
    ) {

      return fail(
        current.record_id,
        "company_continuity_broken",
        {
          continuityValid:
            false,

          companyContinuityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // DOMAIN CONTINUITY
    // --------------------------------------------------------

    if (
      current.domain !==
      previous.domain
    ) {

      return fail(
        current.record_id,
        "domain_continuity_broken",
        {
          continuityValid:
            false,

          domainContinuityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // ENCRYPTION-DOMAIN CONTINUITY
    // --------------------------------------------------------

    if (
      current.encryption_domain !==
      previous.encryption_domain
    ) {

      return fail(
        current.record_id,
        "encryption_domain_continuity_broken",
        {
          continuityValid:
            false,

          encryptionDomainContinuityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // CHAIN CONTINUITY
    // --------------------------------------------------------

    if (
      current.previous_hash !==
      previous.current_hash
    ) {

      return fail(
        current.record_id,
        "chain_continuity_broken",
        {
          continuityValid:
            false,
        }
      );

    }

    // --------------------------------------------------------
    // SEQUENCE CONTINUITY
    // --------------------------------------------------------

    if (
      current.sequence_number !==
      previous.sequence_number + 1
    ) {

      return fail(
        current.record_id,
        "sequence_integrity_broken",
        {
          continuityValid:
            false,
        }
      );

    }

  }

  return {

    valid:
      true,

    continuityValid:
      true,

    hashValid:
      true,

    immutable:
      true,

    chainIdentityValid:
      true,

    tenantContinuityValid:
      true,

    companyContinuityValid:
      true,

    domainContinuityValid:
      true,

    encryptionDomainContinuityValid:
      true,

    payloadIntegrityValid:
      true,

    recordHashIntegrityValid:
      true,

    summary: [
      "immutable_chain_verified",
      "payload_integrity_verified",
      "record_hash_integrity_verified",
      "chain_continuity_verified",
      "sequence_continuity_verified",
      "chain_identity_verified",
      "tenant_continuity_verified",
      "company_continuity_verified",
      "domain_continuity_verified",
      "encryption_domain_continuity_verified",
      `records:${records.length}`,
    ],

  };

}


// ============================================================
// APPEND COHERENCE
// ============================================================

function assertAppendInputCoherent(
  input:
    AppendImmutableRecordInput
): void {

  const previous =
    input.previous;

  if (!previous) {

    return;

  }

  if (
    previous.immutable !==
    true
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | previous_record_not_immutable"
    );

  }

  if (
    previous.tenant_id !==
    input.tenant_id
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | tenant_continuity_violation"
    );

  }

  if (
    previous.company_id !==
    input.company_id
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | company_continuity_violation"
    );

  }

  if (
    previous.domain !==
    input.domain
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | domain_continuity_violation"
    );

  }

  if (
    previous.encryption_domain !==
    input.encryption_domain
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | encryption_domain_continuity_violation"
    );

  }

  if (
    !previous.chain_id ||
    typeof previous.chain_id !== "string"
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | previous_chain_identity_invalid"
    );

  }

  if (
    !previous.current_hash ||
    typeof previous.current_hash !== "string"
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | previous_record_hash_invalid"
    );

  }

  if (
    !Number.isInteger(
      previous.sequence_number
    ) ||
    previous.sequence_number < 1
  ) {

    throw new Error(
      "IMMUTABLE_CHAIN_APPEND_REJECTED | previous_sequence_invalid"
    );

  }

}


// ============================================================
// RECORD HASH
// ============================================================

async function computeRecordHash(
  record:
    Pick<
      ImmutableChainRecord,
      | "chain_id"
      | "tenant_id"
      | "company_id"
      | "domain"
      | "encryption_domain"
      | "previous_hash"
      | "payload_hash"
      | "sequence_number"
    >
): Promise<string> {

  const chainMaterial =
    stableStringify({

      chain_id:
        record.chain_id,

      tenant_id:
        record.tenant_id,

      company_id:
        record.company_id,

      domain:
        record.domain,

      encryption_domain:
        record.encryption_domain,

      previous_hash:
        record.previous_hash,

      payload_hash:
        record.payload_hash,

      sequence_number:
        record.sequence_number,

    });

  return sha256Hex(
    chainMaterial
  );

}


// ============================================================
// FAIL
// ============================================================

function fail(
  recordId:
    string | undefined,
  reason:
    string,
  overrides?:
    Partial<
      Omit<
        ImmutableChainVerification,
        | "valid"
        | "brokenAt"
        | "failureReason"
        | "summary"
      >
    >
): ImmutableChainVerification {

  return {

    valid:
      false,

    continuityValid:
      overrides?.continuityValid ??
      true,

    hashValid:
      overrides?.hashValid ??
      true,

    immutable:
      overrides?.immutable ??
      true,

    chainIdentityValid:
      overrides?.chainIdentityValid ??
      true,

    tenantContinuityValid:
      overrides?.tenantContinuityValid ??
      true,

    companyContinuityValid:
      overrides?.companyContinuityValid ??
      true,

    domainContinuityValid:
      overrides?.domainContinuityValid ??
      true,

    encryptionDomainContinuityValid:
      overrides?.encryptionDomainContinuityValid ??
      true,

    payloadIntegrityValid:
      overrides?.payloadIntegrityValid ??
      true,

    recordHashIntegrityValid:
      overrides?.recordHashIntegrityValid ??
      true,

    brokenAt:
      recordId,

    failureReason:
      reason,

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
  input:
    string
): Promise<string> {

  const enc =
    new TextEncoder();

  const data =
    enc.encode(
      input
    );

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return toHex(
    hash
  );

}


// ============================================================
// HEX
// ============================================================

function toHex(
  buffer:
    ArrayBuffer
): string {

  const bytes =
    new Uint8Array(
      buffer
    );

  return Array
    .from(
      bytes
    )
    .map(
      b =>
        b
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");

}


// ============================================================
// STABLE STRINGIFY
// ============================================================

function stableStringify(
  obj:
    unknown
): string {

  const seen =
    new WeakSet<object>();

  return JSON.stringify(
    obj,
    (
      _key,
      value
    ) => {

      if (
        value &&
        typeof value === "object"
      ) {

        if (
          seen.has(
            value
          )
        ) {

          return undefined;

        }

        seen.add(
          value
        );

        if (
          Array.isArray(
            value
          )
        ) {

          return value;

        }

        const sorted:
          Record<string, unknown> = {};

        for (
          const key of Object
            .keys(
              value
            )
            .sort()
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