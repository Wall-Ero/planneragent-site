// ============================================================
// PlannerAgent — Runtime Verification Intake Translation Test
// ============================================================
//
// PATH
// ------------------------------------------------------------
// core/src/cryptography/provider/runtime-integration/
// P9K.provider.runtime.verification.intake.translation.test.ts
//
// PURPOSE
// ------------------------------------------------------------
// Canonical behavioral tests for
// translateProviderRuntimeVerificationIntake().
//
// These tests verify that:
//
// 1) runtime integration not ready
//    preserves raw providerExecutionFacts
//    but DOES NOT promote them into
//    verification-intake state
//
// 2) translation rejection
//    denies translation while preserving
//    provider execution facts and derived
//    execution observation state
//
// 3) missing provider execution facts
//    denies translation explicitly
//
// 4) successful translation
//    produces verification intake material
//    without performing runtime verification
//
// ============================================================

import { strict as assert } from "node:assert";
import test from "node:test";

import {
  translateProviderRuntimeVerificationIntake,
  type ProviderRuntimeVerificationIntakeTranslationDecision,
} from "./P9K.provider.runtime.verification.intake.translation";

import type {
  ProviderRuntimeExecutionFacts,
  ProviderRuntimeIntegrationResult,
} from "./P9K.provider.runtime.integration.contract";

// ============================================================
// FIXTURES
// ============================================================

function makeExecutionFacts(
  overrides: Partial<ProviderRuntimeExecutionFacts> = {}
): ProviderRuntimeExecutionFacts {
  return {
    providerCallAttempted: true,
    providerCallCompleted: true,
    providerReference: "erp-ref-001",
    providerRawStatus: "SUCCESS",
    providerRawErrorCode: undefined,
    ...overrides,
  };
}

function makeIntegrationResult(
  overrides: Partial<ProviderRuntimeIntegrationResult> = {}
): ProviderRuntimeIntegrationResult {
  return {
    runtimeIntegrationReady: true,

    providerContract: "ERP_POST_PRODUCTION_RECEIPT",
    providerImplementation: "ERP",
    operation: "POST_PRODUCTION_RECEIPT",

    providerResourceId: "resource-001",
    providerConfigurationRef: "cfg-001",
    providerCredentialRef: "cred-001",

    executionMetadata: {
      requestId: "req-001",
    },

    providerExecutionFacts: makeExecutionFacts(),

    summary: [
      "provider_runtime_integration_completed",
    ],

    ...overrides,
  } as ProviderRuntimeIntegrationResult;
}

function translate(
  integration: ProviderRuntimeIntegrationResult,
  translationDecision:
    ProviderRuntimeVerificationIntakeTranslationDecision =
      "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE"
) {
  return translateProviderRuntimeVerificationIntake({
    integration,
    translationDecision,
  });
}

// ============================================================
// TESTS
// ============================================================

test("P9K.2 — denies translation when runtime integration is not ready and preserves raw facts without promoting intake state", () => {
  const integration = makeIntegrationResult({
    runtimeIntegrationReady: false,
    providerExecutionFacts: makeExecutionFacts({
      providerCallAttempted: true,
      providerCallCompleted: true,
      providerReference: "erp-ref-not-ready",
      providerRawStatus: "PENDING",
      providerRawErrorCode: "WAITING_PROVIDER",
    }),
    summary: ["integration_not_ready_fixture"],
  });

  const result = translate(integration);

  assert.equal(
    result.translationStatus,
    "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED"
  );

  assert.equal(
    result.translationDecision,
    "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE"
  );

  assert.equal(result.verificationIntakeTranslated, false);
  assert.equal(result.verificationIntakeReady, false);

  // raw facts are preserved
  assert.deepEqual(
    result.providerExecutionFacts,
    integration.providerExecutionFacts
  );

  // but they are NOT promoted into verification-intake state
  assert.equal(result.providerExecutionObserved, false);
  assert.equal(result.providerExecutionCompleted, false);
  assert.equal(result.providerReference, undefined);
  assert.equal(result.providerRawStatus, undefined);
  assert.equal(result.providerRawErrorCode, undefined);

  assert.equal(
    result.denialReason,
    "PROVIDER_RUNTIME_INTEGRATION_NOT_READY"
  );

  assert.equal(result.verificationIntake, undefined);

  assert.deepEqual(result.integrationSummary, [
    "integration_not_ready_fixture",
  ]);

  assert.deepEqual(result.summary, [
    "integration_not_ready_fixture",
    "provider_runtime_integration_not_ready",
    "provider_runtime_verification_intake_not_translated",
  ]);
});

test("P9K.2 — denies translation when translation decision rejects intake translation but preserves execution observation state", () => {
  const integration = makeIntegrationResult({
    runtimeIntegrationReady: true,
    providerExecutionFacts: makeExecutionFacts({
      providerCallAttempted: true,
      providerCallCompleted: false,
      providerReference: "erp-ref-rejected",
      providerRawStatus: "ACCEPTED_BY_PROVIDER",
      providerRawErrorCode: "ASYNC_PENDING",
    }),
    summary: ["translation_rejected_fixture"],
  });

  const result = translate(
    integration,
    "REJECT_PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATION"
  );

  assert.equal(
    result.translationStatus,
    "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED"
  );

  assert.equal(
    result.translationDecision,
    "REJECT_PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATION"
  );

  assert.equal(result.verificationIntakeTranslated, false);
  assert.equal(result.verificationIntakeReady, false);

  // here execution facts ARE preserved and promoted as observed state,
  // because runtime integration itself was ready
  assert.deepEqual(
    result.providerExecutionFacts,
    integration.providerExecutionFacts
  );

  assert.equal(result.providerExecutionObserved, true);
  assert.equal(result.providerExecutionCompleted, false);
  assert.equal(result.providerReference, "erp-ref-rejected");
  assert.equal(result.providerRawStatus, "ACCEPTED_BY_PROVIDER");
  assert.equal(result.providerRawErrorCode, "ASYNC_PENDING");

  assert.equal(
    result.denialReason,
    "VERIFICATION_INTAKE_TRANSLATION_NOT_ALLOWED"
  );

  assert.equal(result.verificationIntake, undefined);

  assert.deepEqual(result.integrationSummary, [
    "translation_rejected_fixture",
  ]);

  assert.deepEqual(result.summary, [
    "translation_rejected_fixture",
    "verification_intake_translation_not_allowed",
    "provider_runtime_verification_intake_not_translated",
  ]);
});

test("P9K.2 — denies translation when provider execution facts are missing", () => {
  const integration = makeIntegrationResult({
    runtimeIntegrationReady: true,
    providerExecutionFacts: undefined,
    summary: ["missing_execution_facts_fixture"],
  });

  const result = translate(integration);

  assert.equal(
    result.translationStatus,
    "PROVIDER_RUNTIME_VERIFICATION_INTAKE_NOT_TRANSLATED"
  );

  assert.equal(
    result.translationDecision,
    "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE"
  );

  assert.equal(result.verificationIntakeTranslated, false);
  assert.equal(result.verificationIntakeReady, false);

  assert.equal(result.providerExecutionFacts, undefined);
  assert.equal(result.providerExecutionObserved, false);
  assert.equal(result.providerExecutionCompleted, false);
  assert.equal(result.providerReference, undefined);
  assert.equal(result.providerRawStatus, undefined);
  assert.equal(result.providerRawErrorCode, undefined);

  assert.equal(
    result.denialReason,
    "PROVIDER_EXECUTION_FACTS_MISSING"
  );

  assert.equal(result.verificationIntake, undefined);

  assert.deepEqual(result.integrationSummary, [
    "missing_execution_facts_fixture",
  ]);

  assert.deepEqual(result.summary, [
    "missing_execution_facts_fixture",
    "provider_execution_facts_missing",
    "provider_runtime_verification_intake_not_translated",
  ]);
});

test("P9K.2 — translates integration-ready execution facts into verification intake", () => {
  const integration = makeIntegrationResult({
    runtimeIntegrationReady: true,
    providerExecutionFacts: makeExecutionFacts({
      providerCallAttempted: true,
      providerCallCompleted: true,
      providerReference: "erp-ref-success",
      providerRawStatus: "SUCCESS",
      providerRawErrorCode: undefined,
    }),
    summary: ["translation_success_fixture"],
  });

  const result = translate(integration);

  assert.equal(
    result.translationStatus,
    "PROVIDER_RUNTIME_VERIFICATION_INTAKE_TRANSLATED"
  );

  assert.equal(
    result.translationDecision,
    "TRANSLATE_PROVIDER_RUNTIME_VERIFICATION_INTAKE"
  );

  assert.equal(result.verificationIntakeTranslated, true);
  assert.equal(result.verificationIntakeReady, true);

  assert.deepEqual(
    result.providerExecutionFacts,
    integration.providerExecutionFacts
  );

  assert.equal(result.providerExecutionObserved, true);
  assert.equal(result.providerExecutionCompleted, true);
  assert.equal(result.providerReference, "erp-ref-success");
  assert.equal(result.providerRawStatus, "SUCCESS");
  assert.equal(result.providerRawErrorCode, undefined);

  assert.equal(result.denialReason, undefined);

  assert.ok(result.verificationIntake);
  assert.equal(
    result.verificationIntake?.verificationIntakeReady,
    true
  );
  assert.equal(
    result.verificationIntake?.providerExecutionObserved,
    true
  );
  assert.equal(
    result.verificationIntake?.providerExecutionCompleted,
    true
  );
  assert.equal(
    result.verificationIntake?.providerReference,
    "erp-ref-success"
  );
  assert.equal(
    result.verificationIntake?.providerRawStatus,
    "SUCCESS"
  );
  assert.equal(
    result.verificationIntake?.providerRawErrorCode,
    undefined
  );

  assert.deepEqual(
    result.verificationIntake?.summary,
    [
      "provider_runtime_verification_intake_ready",
      "provider_execution_observed",
      "provider_execution_completed",
    ]
  );

  assert.deepEqual(result.integrationSummary, [
    "translation_success_fixture",
  ]);

  assert.deepEqual(result.summary, [
    "translation_success_fixture",
    "provider_runtime_verification_intake_translated",
  ]);
});
