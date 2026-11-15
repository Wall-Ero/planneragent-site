import { fileURLToPath } from "node:url";
import { hybridDigestV1, hybridSnapshotV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { createInjectedExperimentManifestV1, OneShotTransportErrorV1,
  ONE_EXPERIMENT_HOSTED_INPUT_RISK_V1, ONE_EXPERIMENT_USAGE_POLICY_V1 } from "./live.contracts";

export const PREPARED_EXPERIMENT_ID_V1 = "teacher-realization-independent-step13pb-v1";
export const PREPARED_JOURNAL_NAMESPACE_V1 = "independent-step13pb-v1";
export const PREPARED_STATE_DIRECTORY_V1 = fileURLToPath(new URL("./independent-step13pb-v1/", import.meta.url));

// Data only. Never a native manifest or an operator attestation.
export function createPreparedExperimentManifestV1() {
  return hybridSnapshotV1({ ...createInjectedExperimentManifestV1(),
    experiment_id: PREPARED_EXPERIMENT_ID_V1, state_location: PREPARED_STATE_DIRECTORY_V1,
    authorization_evidence_ref: "NONE_OFFLINE_PREPARATION_ONLY",
    admission_policy: { ...ONE_EXPERIMENT_USAGE_POLICY_V1, experiment_id: PREPARED_EXPERIMENT_ID_V1,
      operator_decision: "PENDING_SEPARATE_HUMAN_APPROVAL" },
    hosted_input_risk: { ...ONE_EXPERIMENT_HOSTED_INPUT_RISK_V1, experiment_id: PREPARED_EXPERIMENT_ID_V1 },
  });
}

export function preparedExperimentChallengeV1() {
  return hybridSnapshotV1({ version: 1, manifest: createPreparedExperimentManifestV1(),
    authorization_state: "UNAUTHORIZED", operator_approval: null,
    not_before_utc: null, expires_at_utc: null,
    expiry_rule: "MISSING_INVALID_OR_NOW_AT_OR_AFTER_EXPIRY_DENIED",
    expiry_requires: "SEPARATE_REVIEWED_CONTRACT_AND_EXPLICIT_HUMAN_APPROVAL",
    replay_allowed: false, dispatch_enabled: false, credential_acquisition_enabled: false,
    truth_granted: false, authority_granted: false, execution_granted: false,
  });
}

export function preparedExperimentChallengeDigestV1(): string {
  return hybridDigestV1(preparedExperimentChallengeV1());
}

export function validatePreparedExperimentAuthorizationV1(_value: unknown): never {
  // No input traversal, dates, credentials or fabricated confirmation can turn preparation into authority.
  // A future reviewed contract must bind an explicit expiry and human decision to this challenge digest.
  throw new OneShotTransportErrorV1("PREPARED_EXPERIMENT_UNAUTHORIZED");
}
