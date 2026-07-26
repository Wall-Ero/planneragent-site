import assert from "node:assert/strict";

import {
  decideGovernanceSignRequest,
  evaluateGovernanceSignExecutionEligibility,
  type GovernanceSignRequest,
} from "../governance.sign.decision";

const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const DECISION_ID = "22222222-2222-4222-8222-222222222222";

function request(
  overrides: Partial<GovernanceSignRequest> = {},
): GovernanceSignRequest {
  return {
    requestId: REQUEST_ID,
    tenantId: "tenant-001",
    companyId: "company-001",
    operation: "SIGN",
    subjectId: "fdc-subject-001",
    authorityReference: "authority-policy-001",
    requestedAt: "2026-07-26T10:00:00.000Z",
    validFrom: "2026-07-26T10:00:00.000Z",
    validUntil: "2026-07-26T10:05:00.000Z",
    ...overrides,
  };
}

function decide(
  overrides: Partial<Parameters<typeof decideGovernanceSignRequest>[0]> = {},
) {
  return decideGovernanceSignRequest({
    request: request(),
    decisionId: DECISION_ID,
    decidedAt: "2026-07-26T10:00:00.000Z",
    determination: "AUTHORIZE",
    ...overrides,
  });
}

const authorized = decide();
assert.equal(authorized.decision, "AUTHORIZED");
assert.equal(authorized.denialReason, undefined);
assert.equal(authorized.request.operation, "SIGN");

const eligible = evaluateGovernanceSignExecutionEligibility(
  authorized,
  "2026-07-26T10:02:00.000Z",
);
assert.equal(eligible.eligible, true);
assert.equal(eligible.withinValidityWindow, true);

const denied = decide({ determination: "DENY" });
assert.equal(denied.decision, "DENIED");
assert.equal(
  denied.denialReason,
  "GOVERNANCE_SIGN_LEGITIMACY_NOT_AUTHORIZED",
);

const missingIdentity = decide({
  request: request({ requestId: "" }),
});
assert.equal(missingIdentity.decision, "DENIED");
assert.equal(
  missingIdentity.denialReason,
  "GOVERNANCE_SIGN_REQUEST_INCOMPLETE",
);

const malformedIdentity = decide({
  request: request({ requestId: "request-001" }),
});
assert.equal(
  malformedIdentity.denialReason,
  "GOVERNANCE_SIGN_REQUEST_IDENTITY_INVALID",
);

const scopeMismatch = decide({
  request: request({
    tenantId: "same-scope",
    companyId: "same-scope",
  }),
});
assert.equal(
  scopeMismatch.denialReason,
  "GOVERNANCE_SIGN_REQUEST_SCOPE_INCOHERENT",
);

const invalidValidity = decide({
  request: request({
    validFrom: "2026-07-26T10:06:00.000Z",
    validUntil: "2026-07-26T10:05:00.000Z",
  }),
});
assert.equal(
  invalidValidity.denialReason,
  "GOVERNANCE_SIGN_REQUEST_VALIDITY_INVALID",
);

const expired = evaluateGovernanceSignExecutionEligibility(
  authorized,
  "2026-07-26T10:05:00.001Z",
);
assert.equal(expired.eligible, false);
assert.equal(expired.reason, "GOVERNANCE_SIGN_DECISION_EXPIRED");
assert.equal(authorized.decision, "AUTHORIZED");

const notYetValid = evaluateGovernanceSignExecutionEligibility(
  authorized,
  "2026-07-26T09:59:59.999Z",
);
assert.equal(notYetValid.reason, "GOVERNANCE_SIGN_DECISION_NOT_YET_VALID");

const invalidEligibilityTime = evaluateGovernanceSignExecutionEligibility(
  authorized,
  "2026-07-26T10:00:00Z",
);
assert.equal(
  invalidEligibilityTime.reason,
  "GOVERNANCE_SIGN_ELIGIBILITY_TIME_INVALID",
);

const source = request();
const immutable = decide({ request: source });
(source as { subjectId: string }).subjectId = "mutated-source";
assert.equal(immutable.request.subjectId, "fdc-subject-001");
assert.equal(Object.isFrozen(immutable), true);
assert.equal(Object.isFrozen(immutable.request), true);
assert.equal(Object.isFrozen(immutable.summary), true);

const boundary = immutable as unknown as Record<string, unknown>;
assert.equal("provider" in boundary, false);
assert.equal("signature" in boundary, false);
assert.equal("executed" in boundary, false);
assert.equal("replay" in boundary, false);

console.log("GOVERNANCE SIGN DECISION VERIFIED");

