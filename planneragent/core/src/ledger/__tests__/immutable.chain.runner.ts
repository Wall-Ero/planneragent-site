// ============================================================
// PlannerAgent — Immutable Governance Chain Runner
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/ledger/__tests__/
// immutable.chain.runner.ts
//
// STATUS
// ------------------------------------------------------------
// CANONICAL TEST RUNNER
//
// CATEGORY
// ------------------------------------------------------------
// Data Sovereignty & Trust
//
// DOMAIN
// ------------------------------------------------------------
// Immutable Governance Chain
//
// PURPOSE
// ------------------------------------------------------------
// Verify the canonical immutable-chain hardening contract.
//
// This runner verifies:
//
// 1. empty chain verification
// 2. canonical genesis creation
// 3. canonical chained append
// 4. stable payload hashing
// 5. payload tampering detection
// 6. record-hash tampering detection
// 7. chain identity tampering detection
// 8. tenant continuity detection
// 9. company continuity detection
// 10. ledger-domain continuity detection
// 11. encryption-domain continuity detection
// 12. previous-hash continuity detection
// 13. sequence continuity detection
// 14. false genesis previous hash detection
// 15. false genesis sequence detection
// 16. payload / record count mismatch detection
// 17. mutable-record detection
// 18. append tenant crossing rejected
// 19. append company crossing rejected
// 20. append ledger-domain crossing rejected
// 21. append encryption-domain crossing rejected
// 22. append from mutable previous record rejected
// 23. append from invalid previous chain identity rejected
// 24. append from invalid previous hash rejected
// 25. append from invalid previous sequence rejected
// 26. record identity separation
// 27. metadata defensive copying
// 28. source payload immutability
// 29. boundary verification
//
// The immutable chain preserves cryptographic integrity and
// sovereign continuity.
//
// It does not encrypt payloads.
// It does not authorize execution.
// It does not manufacture authenticity claims.
//
// ============================================================

import assert from "node:assert/strict";

import {
  appendImmutableRecord,
  verifyImmutableChain,
} from "../immutable.chain";

import type {
  AppendImmutableRecordInput,
  ImmutableChainRecord,
  ImmutableChainVerification,
} from "../immutable.chain";

import type {
  EncryptionDomain,
} from "../../security/encryption.domains";


// ============================================================
// TEST UTILITIES
// ============================================================

function pass(
  label: string
): void {

  console.log(
    `✅ ${label}`
  );

}


function cloneRecord(
  record: ImmutableChainRecord
): ImmutableChainRecord {

  return {

    ...record,

    metadata:
      record.metadata
        ? {
            ...record.metadata,
          }
        : undefined,

  };

}


function assertVerified(
  result: ImmutableChainVerification,
  label: string
): void {

  assert.equal(
    result.valid,
    true,
    `${label} valid`
  );

  assert.equal(
    result.continuityValid,
    true,
    `${label} continuity valid`
  );

  assert.equal(
    result.hashValid,
    true,
    `${label} hash valid`
  );

  assert.equal(
    result.immutable,
    true,
    `${label} immutable`
  );

  assert.equal(
    result.chainIdentityValid,
    true,
    `${label} chain identity valid`
  );

  assert.equal(
    result.tenantContinuityValid,
    true,
    `${label} tenant continuity valid`
  );

  assert.equal(
    result.companyContinuityValid,
    true,
    `${label} company continuity valid`
  );

  assert.equal(
    result.domainContinuityValid,
    true,
    `${label} domain continuity valid`
  );

  assert.equal(
    result.encryptionDomainContinuityValid,
    true,
    `${label} encryption-domain continuity valid`
  );

  assert.equal(
    result.payloadIntegrityValid,
    true,
    `${label} payload integrity valid`
  );

  assert.equal(
    result.recordHashIntegrityValid,
    true,
    `${label} record-hash integrity valid`
  );

  assert.equal(
    result.failureReason,
    undefined,
    `${label} exposes no failure reason`
  );

  assert.equal(
    result.brokenAt,
    undefined,
    `${label} exposes no broken record`
  );

}


function assertBroken(
  result: ImmutableChainVerification,
  expectedReason: string,
  label: string
): void {

  assert.equal(
    result.valid,
    false,
    `${label} invalid`
  );

  assert.equal(
    result.failureReason,
    expectedReason,
    `${label} failure reason preserved`
  );

  assert(
    result.summary.includes(
      "immutable_chain_broken"
    ),
    `${label} broken-chain summary preserved`
  );

  assert(
    result.summary.includes(
      expectedReason
    ),
    `${label} failure summary preserved`
  );

}


// ============================================================
// BASE CONTEXT
// ============================================================

const tenantId =
  "tenant-001";

const companyId =
  "company-001";

const encryptionDomain =
  "EXECUTION" as EncryptionDomain;

const alternateEncryptionDomain =
  "AUDIT" as EncryptionDomain;


// ============================================================
// PAYLOAD FIXTURES
// ============================================================

interface RuntimeFactPayload {

  factType: string;

  runtimeBatchId: string;

  sequence: number;

  outcome: string;

  nested: {
    retryable: boolean;
    authority: string;
  };

}


function buildPayload(
  sequence: number,
  outcome: string
): RuntimeFactPayload {

  return {

    factType:
      "PROVIDER_RUNTIME_EXECUTION_OUTCOME",

    runtimeBatchId:
      "runtime-chain-001",

    sequence,

    outcome,

    nested: {
      retryable:
        true,

      authority:
        "PROVIDER_RUNTIME",
    },

  };

}


// ============================================================
// CHAIN FIXTURE
// ============================================================

async function buildCanonicalChain(): Promise<{

  records: ImmutableChainRecord[];

  payloads: RuntimeFactPayload[];

}> {

  const payload1 =
    buildPayload(
      1,
      "RETRY_DECIDED"
    );

  const record1 =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload:
        payload1,

      metadata: {
        source:
          "P9N",
      },

    });

  const payload2 =
    buildPayload(
      2,
      "RETRY_EXECUTED"
    );

  const record2 =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload:
        payload2,

      previous:
        record1,

      metadata: {
        source:
          "P9O",
      },

    });

  const payload3 =
    buildPayload(
      3,
      "RETRY_COMPLETED"
    );

  const record3 =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload:
        payload3,

      previous:
        record2,

      metadata: {
        source:
          "P9P",
      },

    });

  return {

    records: [
      record1,
      record2,
      record3,
    ],

    payloads: [
      payload1,
      payload2,
      payload3,
    ],

  };

}


// ============================================================
// SCENARIO 1 — EMPTY CHAIN
// ============================================================

async function runEmptyChainScenario(): Promise<void> {

  const result =
    await verifyImmutableChain({

      records:
        [],

      payloads:
        [],

    });

  assertVerified(
    result,
    "empty chain"
  );

  assert.deepEqual(
    result.summary,
    [
      "empty_chain",
    ],
    "empty chain summary preserved"
  );

  pass("empty chain verified");

}


// ============================================================
// SCENARIO 2 — CANONICAL GENESIS
// ============================================================

async function runCanonicalGenesisScenario(): Promise<void> {

  const payload =
    buildPayload(
      1,
      "RETRY_DECIDED"
    );

  const record =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload,

    });

  assert.equal(
    record.previous_hash,
    null,
    "genesis previous hash is null"
  );

  assert.equal(
    record.sequence_number,
    1,
    "genesis sequence starts at one"
  );

  assert.equal(
    record.immutable,
    true,
    "genesis immutable flag preserved"
  );

  assert.equal(
    typeof record.record_id,
    "string",
    "genesis record identity assigned"
  );

  assert.equal(
    typeof record.chain_id,
    "string",
    "genesis chain identity assigned"
  );

  assert.equal(
    typeof record.payload_hash,
    "string",
    "genesis payload hash assigned"
  );

  assert.equal(
    typeof record.current_hash,
    "string",
    "genesis current hash assigned"
  );

  const result =
    await verifyImmutableChain({

      records: [
        record,
      ],

      payloads: [
        payload,
      ],

    });

  assertVerified(
    result,
    "canonical genesis"
  );

  pass("canonical genesis created and verified");

}


// ============================================================
// SCENARIO 3 — CANONICAL CHAINED APPEND
// ============================================================

async function runCanonicalChainedAppendScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  assert.equal(
    records[1].chain_id,
    records[0].chain_id,
    "chain identity preserved on second record"
  );

  assert.equal(
    records[2].chain_id,
    records[0].chain_id,
    "chain identity preserved on third record"
  );

  assert.equal(
    records[1].previous_hash,
    records[0].current_hash,
    "second record linked to genesis"
  );

  assert.equal(
    records[2].previous_hash,
    records[1].current_hash,
    "third record linked to second record"
  );

  assert.deepEqual(
    records.map(
      record =>
        record.sequence_number
    ),
    [
      1,
      2,
      3,
    ],
    "canonical sequence preserved"
  );

  const result =
    await verifyImmutableChain({

      records,

      payloads,

    });

  assertVerified(
    result,
    "canonical chain"
  );

  assert(
    result.summary.includes(
      "payload_integrity_verified"
    ),
    "payload integrity terminal summary preserved"
  );

  assert(
    result.summary.includes(
      "record_hash_integrity_verified"
    ),
    "record-hash integrity terminal summary preserved"
  );

  assert(
    result.summary.includes(
      "chain_continuity_verified"
    ),
    "chain continuity terminal summary preserved"
  );

  assert(
    result.summary.includes(
      "records:3"
    ),
    "record count summary preserved"
  );

  pass("canonical chained append verified");
  pass("full immutable-chain verification claims preserved");

}


// ============================================================
// SCENARIO 4 — STABLE PAYLOAD HASHING
// ============================================================

async function runStablePayloadHashingScenario(): Promise<void> {

  const payloadA = {

    alpha:
      "A",

    beta:
      2,

    nested: {
      z:
        true,

      a:
        "first",
    },

  };

  const payloadB = {

    nested: {
      a:
        "first",

      z:
        true,
    },

    beta:
      2,

    alpha:
      "A",

  };

  const record =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload:
        payloadA,

    });

  const result =
    await verifyImmutableChain({

      records: [
        record,
      ],

      payloads: [
        payloadB,
      ],

    });

  assertVerified(
    result,
    "stable payload hashing"
  );

  pass("stable payload hashing independent of object-key order");

}


// ============================================================
// SCENARIO 5 — PAYLOAD TAMPERING
// ============================================================

async function runPayloadTamperingScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const tamperedPayloads = [
    payloads[0],
    {
      ...payloads[1],

      outcome:
        "RETRY_EXECUTION_REWRITTEN",
    },
    payloads[2],
  ];

  const result =
    await verifyImmutableChain({

      records,

      payloads:
        tamperedPayloads,

    });

  assertBroken(
    result,
    "payload_hash_mismatch",
    "payload tampering"
  );

  assert.equal(
    result.hashValid,
    false,
    "payload tampering invalidates hash claim"
  );

  assert.equal(
    result.payloadIntegrityValid,
    false,
    "payload tampering invalidates payload integrity"
  );

  assert.equal(
    result.brokenAt,
    records[1].record_id,
    "payload tampering identifies broken record"
  );

  pass("payload tampering detected");

}


// ============================================================
// SCENARIO 6 — RECORD-HASH TAMPERING
// ============================================================

async function runRecordHashTamperingScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const tamperedRecords = [
    records[0],
    {
      ...cloneRecord(
        records[1]
      ),

      current_hash:
        "tampered-current-hash",
    },
    records[2],
  ];

  const result =
    await verifyImmutableChain({

      records:
        tamperedRecords,

      payloads,

    });

  assertBroken(
    result,
    "record_hash_mismatch",
    "record-hash tampering"
  );

  assert.equal(
    result.hashValid,
    false,
    "record-hash tampering invalidates hash claim"
  );

  assert.equal(
    result.recordHashIntegrityValid,
    false,
    "record-hash tampering invalidates record-hash integrity"
  );

  assert.equal(
    result.brokenAt,
    records[1].record_id,
    "record-hash tampering identifies broken record"
  );

  pass("record-hash tampering detected");

}


// ============================================================
// SCENARIOS 7–11 — SOVEREIGN CONTINUITY TAMPERING
// ============================================================

async function runSovereignContinuityTamperingScenarios(): Promise<void> {

  const cases: Array<{

    label: string;

    reason: string;

    mutate:
      (
        record:
          ImmutableChainRecord
      ) =>
        ImmutableChainRecord;

    assertion:
      (
        result:
          ImmutableChainVerification
      ) =>
        void;

  }> = [

    {

      label:
        "chain identity tampering",

      reason:
        "record_hash_mismatch",

      mutate:
        record => ({

          ...cloneRecord(
            record
          ),

          chain_id:
            "chain-other",
        }),

      assertion:
        result => {

          assert.equal(
            result.recordHashIntegrityValid,
            false,
            "chain identity tampering invalidates record hash"
          );

        },

    },

    {

      label:
        "tenant continuity tampering",

      reason:
        "record_hash_mismatch",

      mutate:
        record => ({

          ...cloneRecord(
            record
          ),

          tenant_id:
            "tenant-other",
        }),

      assertion:
        result => {

          assert.equal(
            result.recordHashIntegrityValid,
            false,
            "tenant tampering invalidates record hash"
          );

        },

    },

    {

      label:
        "company continuity tampering",

      reason:
        "record_hash_mismatch",

      mutate:
        record => ({

          ...cloneRecord(
            record
          ),

          company_id:
            "company-other",
        }),

      assertion:
        result => {

          assert.equal(
            result.recordHashIntegrityValid,
            false,
            "company tampering invalidates record hash"
          );

        },

    },

    {

      label:
        "ledger-domain continuity tampering",

      reason:
        "record_hash_mismatch",

      mutate:
        record => ({

          ...cloneRecord(
            record
          ),

          domain:
            "AUDIT",
        }),

      assertion:
        result => {

          assert.equal(
            result.recordHashIntegrityValid,
            false,
            "ledger-domain tampering invalidates record hash"
          );

        },

    },

    {

      label:
        "encryption-domain continuity tampering",

      reason:
        "record_hash_mismatch",

      mutate:
        record => ({

          ...cloneRecord(
            record
          ),

          encryption_domain:
            alternateEncryptionDomain,
        }),

      assertion:
        result => {

          assert.equal(
            result.recordHashIntegrityValid,
            false,
            "encryption-domain tampering invalidates record hash"
          );

        },

    },

  ];

  for (
    const testCase of cases
  ) {

    const {
      records,
      payloads,
    } =
      await buildCanonicalChain();

    const tamperedRecords = [
      records[0],
      testCase.mutate(
        records[1]
      ),
      records[2],
    ];

    const result =
      await verifyImmutableChain({

        records:
          tamperedRecords,

        payloads,

      });

    assertBroken(
      result,
      testCase.reason,
      testCase.label
    );

    testCase.assertion(
      result
    );

  }

  pass("hash-bound sovereign continuity tampering detected");

}


// ============================================================
// SCENARIO 12 — PREVIOUS-HASH CONTINUITY
// ============================================================

async function runPreviousHashContinuityScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const forgedPrevious =
    cloneRecord(
      records[1]
    );

  forgedPrevious.current_hash =
    "forged-predecessor-hash";

  const relinkedThird = {

    ...cloneRecord(
      records[2]
    ),

    previous_hash:
      "forged-predecessor-hash",

  };

  const result =
    await verifyImmutableChain({

      records: [
        records[0],
        forgedPrevious,
        relinkedThird,
      ],

      payloads,

    });

  assertBroken(
    result,
    "record_hash_mismatch",
    "forged predecessor hash"
  );

  pass("forged predecessor hash detected before false continuity claim");

}


// ============================================================
// SCENARIO 13 — SEQUENCE CONTINUITY
// ============================================================

async function runSequenceContinuityScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const tamperedRecords = [
    records[0],
    {
      ...cloneRecord(
        records[1]
      ),

      sequence_number:
        7,
    },
    records[2],
  ];

  const result =
    await verifyImmutableChain({

      records:
        tamperedRecords,

      payloads,

    });

  assertBroken(
    result,
    "record_hash_mismatch",
    "sequence tampering"
  );

  assert.equal(
    result.recordHashIntegrityValid,
    false,
    "sequence tampering invalidates record hash"
  );

  pass("sequence tampering detected");

}


// ============================================================
// SCENARIO 14 — FALSE GENESIS PREVIOUS HASH
// ============================================================

async function runFalseGenesisPreviousHashScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const falseGenesis = {

    ...cloneRecord(
      records[0]
    ),

    previous_hash:
      "non-null-genesis-link",

  };

  const result =
    await verifyImmutableChain({

      records: [
        falseGenesis,
        records[1],
        records[2],
      ],

      payloads,

    });

  assertBroken(
    result,
    "genesis_previous_hash_invalid",
    "false genesis previous hash"
  );

  assert.equal(
    result.continuityValid,
    false,
    "false genesis invalidates continuity"
  );

  pass("false genesis previous hash detected");

}


// ============================================================
// SCENARIO 15 — FALSE GENESIS SEQUENCE
// ============================================================

async function runFalseGenesisSequenceScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const falseGenesis = {

    ...cloneRecord(
      records[0]
    ),

    sequence_number:
      9,

  };

  const result =
    await verifyImmutableChain({

      records: [
        falseGenesis,
        records[1],
        records[2],
      ],

      payloads,

    });

  assertBroken(
    result,
    "genesis_sequence_invalid",
    "false genesis sequence"
  );

  assert.equal(
    result.continuityValid,
    false,
    "false genesis sequence invalidates continuity"
  );

  pass("false genesis sequence detected");

}


// ============================================================
// SCENARIO 16 — PAYLOAD / RECORD COUNT MISMATCH
// ============================================================

async function runPayloadRecordCountMismatchScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const result =
    await verifyImmutableChain({

      records,

      payloads:
        payloads.slice(
          0,
          2
        ),

    });

  assertBroken(
    result,
    "payload_record_count_mismatch",
    "payload / record count mismatch"
  );

  assert.equal(
    result.payloadIntegrityValid,
    false,
    "count mismatch invalidates payload-integrity claim"
  );

  pass("payload / record count mismatch detected");

}


// ============================================================
// SCENARIO 17 — MUTABLE RECORD
// ============================================================

async function runMutableRecordScenario(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const mutableRecord = {

    ...cloneRecord(
      records[1]
    ),

    immutable:
      false,

  } as unknown as ImmutableChainRecord;

  const result =
    await verifyImmutableChain({

      records: [
        records[0],
        mutableRecord,
        records[2],
      ],

      payloads,

    });

  assertBroken(
    result,
    "mutable_record_detected",
    "mutable record"
  );

  assert.equal(
    result.immutable,
    false,
    "mutable record invalidates immutable claim"
  );

  pass("mutable record detected");

}


// ============================================================
// APPEND REJECTION UTILITY
// ============================================================

async function assertAppendRejected(
  previous: ImmutableChainRecord,
  overrides: Partial<AppendImmutableRecordInput>,
  expectedToken: string,
  label: string
): Promise<void> {

  await assert.rejects(
    async () => {

      await appendImmutableRecord({

        tenant_id:
          tenantId,

        company_id:
          companyId,

        domain:
          "EXECUTION",

        encryption_domain:
          encryptionDomain,

        payload:
          buildPayload(
            4,
            "APPEND_PROBE"
          ),

        previous,

        ...overrides,

      });

    },
    (
      error:
        unknown
    ) => {

      assert(
        error instanceof Error,
        `${label} throws Error`
      );

      assert(
        error.message.includes(
          "IMMUTABLE_CHAIN_APPEND_REJECTED"
        ),
        `${label} append rejection contract preserved`
      );

      assert(
        error.message.includes(
          expectedToken
        ),
        `${label} rejection reason preserved`
      );

      return true;

    }
  );

}


// ============================================================
// SCENARIOS 18–21 — APPEND SOVEREIGN CROSSING REJECTED
// ============================================================

async function runAppendSovereignCrossingScenarios(): Promise<void> {

  const {
    records,
  } =
    await buildCanonicalChain();

  const previous =
    records[2];

  await assertAppendRejected(
    previous,
    {
      tenant_id:
        "tenant-other",
    },
    "tenant_continuity_violation",
    "tenant crossing"
  );

  await assertAppendRejected(
    previous,
    {
      company_id:
        "company-other",
    },
    "company_continuity_violation",
    "company crossing"
  );

  await assertAppendRejected(
    previous,
    {
      domain:
        "AUDIT",
    },
    "domain_continuity_violation",
    "ledger-domain crossing"
  );

  await assertAppendRejected(
    previous,
    {
      encryption_domain:
        alternateEncryptionDomain,
    },
    "encryption_domain_continuity_violation",
    "encryption-domain crossing"
  );

  pass("append tenant crossing rejected");
  pass("append company crossing rejected");
  pass("append ledger-domain crossing rejected");
  pass("append encryption-domain crossing rejected");

}


// ============================================================
// SCENARIO 22 — APPEND FROM MUTABLE PREVIOUS RECORD
// ============================================================

async function runAppendFromMutablePreviousScenario(): Promise<void> {

  const {
    records,
  } =
    await buildCanonicalChain();

  const previous = {

    ...cloneRecord(
      records[2]
    ),

    immutable:
      false,

  } as unknown as ImmutableChainRecord;

  await assertAppendRejected(
    previous,
    {},
    "previous_record_not_immutable",
    "mutable previous record"
  );

  pass("append from mutable previous record rejected");

}


// ============================================================
// SCENARIO 23 — INVALID PREVIOUS CHAIN IDENTITY
// ============================================================

async function runInvalidPreviousChainIdentityScenario(): Promise<void> {

  const {
    records,
  } =
    await buildCanonicalChain();

  const previous = {

    ...cloneRecord(
      records[2]
    ),

    chain_id:
      "",

  };

  await assertAppendRejected(
    previous,
    {},
    "previous_chain_identity_invalid",
    "invalid previous chain identity"
  );

  pass("append from invalid previous chain identity rejected");

}


// ============================================================
// SCENARIO 24 — INVALID PREVIOUS HASH
// ============================================================

async function runInvalidPreviousHashScenario(): Promise<void> {

  const {
    records,
  } =
    await buildCanonicalChain();

  const previous = {

    ...cloneRecord(
      records[2]
    ),

    current_hash:
      "",

  };

  await assertAppendRejected(
    previous,
    {},
    "previous_record_hash_invalid",
    "invalid previous hash"
  );

  pass("append from invalid previous hash rejected");

}


// ============================================================
// SCENARIO 25 — INVALID PREVIOUS SEQUENCE
// ============================================================

async function runInvalidPreviousSequenceScenario(): Promise<void> {

  const {
    records,
  } =
    await buildCanonicalChain();

  const previous = {

    ...cloneRecord(
      records[2]
    ),

    sequence_number:
      0,

  };

  await assertAppendRejected(
    previous,
    {},
    "previous_sequence_invalid",
    "invalid previous sequence"
  );

  pass("append from invalid previous sequence rejected");

}


// ============================================================
// SCENARIO 26 — RECORD IDENTITY SEPARATION
// ============================================================

async function runRecordIdentitySeparationScenario(): Promise<void> {

  const {
    records,
  } =
    await buildCanonicalChain();

  assert.equal(
    new Set(
      records.map(
        record =>
          record.chain_id
      )
    ).size,
    1,
    "one chain identity preserved"
  );

  assert.equal(
    new Set(
      records.map(
        record =>
          record.record_id
      )
    ).size,
    records.length,
    "each record has distinct record identity"
  );

  for (
    const record of records
  ) {

    assert.notEqual(
      record.record_id,
      record.chain_id,
      "record identity distinct from chain identity"
    );

  }

  pass("record identity separated from chain identity");

}


// ============================================================
// SCENARIO 27 — METADATA DEFENSIVE COPYING
// ============================================================

async function runMetadataDefensiveCopyingScenario(): Promise<void> {

  const metadata = {

    source:
      "P9T",

    authority:
      "AUDIT_EXECUTOR",

  };

  const record =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload:
        buildPayload(
          1,
          "RETRY_COMPLETED"
        ),

      metadata,

    });

  assert.deepEqual(
    record.metadata,
    metadata,
    "metadata value preserved"
  );

  assert.notEqual(
    record.metadata,
    metadata,
    "metadata copied defensively"
  );

  record.metadata!.source =
    "MUTATION_PROBE";

  assert.equal(
    metadata.source,
    "P9T",
    "source metadata not mutated"
  );

  pass("metadata copied defensively");

}


// ============================================================
// SCENARIO 28 — SOURCE PAYLOAD IMMUTABILITY
// ============================================================

async function runSourcePayloadImmutabilityScenario(): Promise<void> {

  const payload =
    buildPayload(
      1,
      "RETRY_COMPLETED"
    );

  const before =
    structuredClone(
      payload
    );

  const record =
    await appendImmutableRecord({

      tenant_id:
        tenantId,

      company_id:
        companyId,

      domain:
        "EXECUTION",

      encryption_domain:
        encryptionDomain,

      payload,

    });

  await verifyImmutableChain({

    records: [
      record,
    ],

    payloads: [
      payload,
    ],

  });

  assert.deepEqual(
    payload,
    before,
    "source payload preserved"
  );

  pass("source payload not mutated");

}


// ============================================================
// SCENARIO 29 — BOUNDARY VERIFICATION
// ============================================================

async function runBoundaryVerification(): Promise<void> {

  const {
    records,
    payloads,
  } =
    await buildCanonicalChain();

  const result =
    await verifyImmutableChain({

      records,

      payloads,

    });

  const value =
    result as unknown as
      Record<string, unknown>;

  const forbiddenFields = [

    "payloadEncrypted",

    "payloadDecrypted",

    "encryptionExecuted",

    "decryptionExecuted",

    "executionAuthorized",

    "runtimeExecutionAllowed",

    "providerApiCalled",

    "providerSdkCalled",

    "providerExecutionInvoked",

    "snapshotVerified",

    "tenantBoundaryEvaluated",

    "auditExecuted",

    "ledgerPersisted",

    "cryptographicSignatureVerified",

    "payloadAuthenticityVerified",

    "signerIdentityVerified",

  ];

  for (
    const field of forbiddenFields
  ) {

    assert(
      !(field in value),
      `cross-layer field not exposed: ${field}`
    );

  }

  pass("immutable-chain boundary verification completed");

}


// ============================================================
// RUNNER
// ============================================================

async function main(): Promise<void> {

  await runEmptyChainScenario();

  await runCanonicalGenesisScenario();

  await runCanonicalChainedAppendScenario();

  await runStablePayloadHashingScenario();

  await runPayloadTamperingScenario();

  await runRecordHashTamperingScenario();

  await runSovereignContinuityTamperingScenarios();

  await runPreviousHashContinuityScenario();

  await runSequenceContinuityScenario();

  await runFalseGenesisPreviousHashScenario();

  await runFalseGenesisSequenceScenario();

  await runPayloadRecordCountMismatchScenario();

  await runMutableRecordScenario();

  await runAppendSovereignCrossingScenarios();

  await runAppendFromMutablePreviousScenario();

  await runInvalidPreviousChainIdentityScenario();

  await runInvalidPreviousHashScenario();

  await runInvalidPreviousSequenceScenario();

  await runRecordIdentitySeparationScenario();

  await runMetadataDefensiveCopyingScenario();

  await runSourcePayloadImmutabilityScenario();

  await runBoundaryVerification();

  console.log("");
  console.log("========================================");
  console.log("IMMUTABLE GOVERNANCE CHAIN");
  console.log("========================================");
  console.log("");

  console.log("Canonical Chain:");
  console.log("✓ genesis previous_hash = null");
  console.log("✓ genesis sequence_number = 1");
  console.log("✓ one chain_id preserved across records");
  console.log("✓ distinct record_id assigned per record");
  console.log("✓ previous_hash links consecutive records");
  console.log("✓ sequence continuity preserved");

  console.log("");
  console.log("Cryptographic Integrity:");
  console.log("✓ payload hash recomputed from canonical payload");
  console.log("✓ stable payload serialization verified");
  console.log("✓ payload tampering detected");
  console.log("✓ current record hash recomputed");
  console.log("✓ record-hash tampering detected");
  console.log("✓ hash-bound chain material preserved");

  console.log("");
  console.log("Sovereign Continuity:");
  console.log("✓ chain identity bound into record hash");
  console.log("✓ tenant identity bound into record hash");
  console.log("✓ company identity bound into record hash");
  console.log("✓ ledger domain bound into record hash");
  console.log("✓ encryption domain bound into record hash");
  console.log("✓ append cannot cross tenant");
  console.log("✓ append cannot cross company");
  console.log("✓ append cannot cross ledger domain");
  console.log("✓ append cannot cross encryption domain");

  console.log("");
  console.log("Genesis and Continuity:");
  console.log("✓ false genesis previous hash rejected");
  console.log("✓ false genesis sequence rejected");
  console.log("✓ payload / record count mismatch rejected");
  console.log("✓ mutable record rejected");
  console.log("✓ invalid previous chain identity rejected");
  console.log("✓ invalid previous record hash rejected");
  console.log("✓ invalid previous sequence rejected");

  console.log("");
  console.log("Immutability:");
  console.log("✓ metadata copied defensively");
  console.log("✓ source metadata not mutated");
  console.log("✓ source payload not mutated");

  console.log("");
  console.log("Boundary Verification:");
  console.log("✓ no payload encryption");
  console.log("✓ no payload decryption");
  console.log("✓ no execution authorization");
  console.log("✓ no provider API / SDK calls");
  console.log("✓ no snapshot verification");
  console.log("✓ no tenant-boundary execution");
  console.log("✓ no audit execution");
  console.log("✓ no persistence claim");
  console.log("✓ no signature verification");
  console.log("✓ no payload-authenticity claim");
  console.log("✓ no signer-identity claim");

  console.log("");
  console.log("========================================");
  console.log("IMMUTABLE GOVERNANCE CHAIN VERIFIED");
  console.log("STATUS: COMPLETE");
  console.log("========================================");

}


main().catch(
  error => {

    console.error(
      error
    );

    process.exitCode =
      1;

  }
);