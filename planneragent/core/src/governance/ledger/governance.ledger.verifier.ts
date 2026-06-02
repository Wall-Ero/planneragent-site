// core/src/governance/ledger/governance.ledger.verifier.ts
// ============================================================
// PlannerAgent — Governance Ledger Verifier
// Canonical Source of Truth
// ============================================================

import type {
  GovernanceLedgerRecord,
  GovernanceLedgerVerification,
} from "./governance.ledger.types";

export function verifyGovernanceLedger(
  records: GovernanceLedgerRecord[]
): GovernanceLedgerVerification {

  if (!records.length) {

    return {

      valid: true,

      immutable: true,

      continuityValid: true,

      sequenceValid: true,

      duplicateIdsDetected: false,

      summary: [
        "empty_ledger",
      ],
    };
  }

  const seenLedgerIds =
    new Set<string>();

  for (
    let i = 0;
    i < records.length;
    i++
  ) {

    const current =
      records[i];

    // ========================================================
    // IMMUTABILITY CHECK
    // ========================================================

    if (
      !current.immutable
    ) {

      return {

        valid: false,

        immutable: false,

        continuityValid: false,

        sequenceValid: false,

        duplicateIdsDetected: false,

        brokenAt:
          current.ledger_id,

        summary: [
          "mutable_record_detected",
        ],
      };
    }

    // ========================================================
    // DUPLICATE LEDGER ID CHECK
    // ========================================================

    if (
      seenLedgerIds.has(
        current.ledger_id
      )
    ) {

      return {

        valid: false,

        immutable: true,

        continuityValid: false,

        sequenceValid: false,

        duplicateIdsDetected: true,

        brokenAt:
          current.ledger_id,

        summary: [
          "duplicate_ledger_id_detected",
        ],
      };
    }

    seenLedgerIds.add(
      current.ledger_id
    );

    // ========================================================
    // CONTINUITY CHECK
    // ========================================================

    if (i > 0) {

      const previous =
        records[i - 1];

      if (
        current.previous_hash !==
        previous.current_hash
      ) {

        return {

          valid: false,

          immutable: true,

          continuityValid: false,

          sequenceValid: false,

          duplicateIdsDetected: false,

          brokenAt:
            current.ledger_id,

          summary: [
            "ledger_continuity_broken",
          ],
        };
      }

      // ======================================================
      // SEQUENCE CHECK
      // ======================================================

      if (
        current.sequence_number !==
        previous.sequence_number + 1
      ) {

        return {

          valid: false,

          immutable: true,

          continuityValid: true,

          sequenceValid: false,

          duplicateIdsDetected: false,

          brokenAt:
            current.ledger_id,

          summary: [
            "ledger_sequence_broken",
          ],
        };
      }
    }
  }

  return {

    valid: true,

    immutable: true,

    continuityValid: true,

    sequenceValid: true,

    duplicateIdsDetected: false,

    summary: [
      "immutable_governance_ledger_verified",
      "ledger_continuity_verified",
      "ledger_sequence_verified",
      "duplicate_ledger_ids_not_detected",
    ],
  };
}