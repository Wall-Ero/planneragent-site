// ============================================================
// PlannerAgent - Verification Material Infrastructure Runner
// ============================================================

import assert from "node:assert/strict";

import {
  resolveVerificationMaterial,
} from "../verification.material.infrastructure.control";

import type {
  VerificationMaterialInfrastructureRecord,
  VerificationMaterialResolutionRequest,
  VerificationMaterialResolutionResult,
} from "../verification.material.infrastructure.control";


function pass(
  label:
    string
): void {

  console.log(
    `✅ ${label}`
  );

}


function cloneValue<T>(
  value:
    T
): T {

  return JSON.parse(
    JSON.stringify(value)
  ) as T;

}


function buildRequest(
  overrides?:
    Partial<VerificationMaterialResolutionRequest>
): VerificationMaterialResolutionRequest {

  return {

    materialId:
      "verification-material-001",

    requiredMaterialKind:
      "PUBLIC_KEY",

    verificationContextId:
      "verification-context-001",

    tenantId:
      "tenant-001",

    companyId:
      "company-001",

    ...overrides,

  };

}


function buildMaterial(
  overrides?:
    Partial<VerificationMaterialInfrastructureRecord>
): VerificationMaterialInfrastructureRecord {

  return {

    materialId:
      "verification-material-001",

    materialKind:
      "PUBLIC_KEY",

    materialVersion:
      "version-001",

    materialDigest:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

    materialDigestAlgorithm:
      "SHA-256",

    immutableLocationReference:
      "kms://verification-material/version-001",

    verificationContextId:
      "verification-context-001",

    tenantId:
      "tenant-001",

    companyId:
      "company-001",

    ...overrides,

  };

}


function assertNotResolved(
  result:
    VerificationMaterialResolutionResult,
  expectedReason:
    VerificationMaterialResolutionResult["failureReason"]
): void {

  assert.equal(
    result.resolutionStatus,
    "VERIFICATION_MATERIAL_NOT_RESOLVED"
  );

  assert.equal(
    result.materialResolved,
    false
  );

  assert.equal(
    result.failureReason,
    expectedReason
  );

  assert.equal(
    result.materialReference,
    undefined
  );

  assert(
    result.summary.includes(
      "fail_closed"
    )
  );

}


function assertNoForbiddenResponsibilities(
  result:
    VerificationMaterialResolutionResult
): void {

  const forbiddenFields = [
    "signatureVerified",
    "mathematicalVerificationPerformed",
    "cryptographicProof",
    "trustAdmitted",
    "trustLevel",
    "authenticityCertified",
    "p9xCalled",
  ];

  for (const field of forbiddenFields) {

    assert.equal(
      field in result,
      false,
      `forbidden responsibility not exposed: ${field}`
    );

  }

}


function runDeterministicResolutionScenario():
  VerificationMaterialResolutionResult {

  const request =
    buildRequest();

  const target =
    buildMaterial();

  const unrelated =
    buildMaterial({
      materialId:
        "verification-material-unrelated",
    });

  const first =
    resolveVerificationMaterial(
      request,
      [unrelated, target]
    );

  const second =
    resolveVerificationMaterial(
      request,
      [target, unrelated]
    );

  assert.equal(
    first.materialResolved,
    true
  );

  assert.deepEqual(
    first,
    second,
    "resolution is independent of source order"
  );

  assert.deepEqual(
    first.materialReference,
    buildMaterial(),
    "exact immutable reference resolved"
  );

  pass("exact material resolution deterministic");
  pass("source ordering does not affect resolution");

  return first;

}


function runImmutabilityScenario(): void {

  const request =
    buildRequest();

  const materials = [
    buildMaterial(),
  ];

  const requestBefore =
    cloneValue(request);

  const materialsBefore =
    cloneValue(materials);

  const result =
    resolveVerificationMaterial(
      request,
      materials
    );

  assert.equal(
    Object.isFrozen(
      result.materialReference
    ),
    true,
    "resolved reference is runtime-immutable"
  );

  assert.notStrictEqual(
    result.materialReference,
    materials[0],
    "resolved reference is a defensive copy"
  );

  assert.deepEqual(
    request,
    requestBefore,
    "request remains unchanged"
  );

  assert.deepEqual(
    materials,
    materialsBefore,
    "source material remains unchanged"
  );

  pass("resolved reference immutable");
  pass("request and source material unchanged");

}


function runFailClosedScenarios(): void {

  assertNotResolved(
    resolveVerificationMaterial(
      buildRequest({
        materialId: "",
      }),
      [buildMaterial()]
    ),
    "VERIFICATION_MATERIAL_REQUEST_INCOMPLETE"
  );

  assertNotResolved(
    resolveVerificationMaterial(
      buildRequest(),
      []
    ),
    "VERIFICATION_MATERIAL_NOT_FOUND"
  );

  assertNotResolved(
    resolveVerificationMaterial(
      buildRequest(),
      [
        buildMaterial(),
        buildMaterial(),
      ]
    ),
    "VERIFICATION_MATERIAL_AMBIGUOUS"
  );

  assertNotResolved(
    resolveVerificationMaterial(
      buildRequest(),
      [
        buildMaterial({
          materialDigest: "",
        }),
      ]
    ),
    "VERIFICATION_MATERIAL_INCOMPLETE"
  );

  assertNotResolved(
    resolveVerificationMaterial(
      buildRequest(),
      [
        buildMaterial({
          tenantId:
            "different-tenant",
        }),
      ]
    ),
    "VERIFICATION_MATERIAL_INCOHERENT"
  );

  pass("absent material fails closed");
  pass("incomplete material fails closed");
  pass("ambiguous material fails closed");
  pass("incoherent material fails closed");

}


function runNoFallbackScenario(): void {

  const result =
    resolveVerificationMaterial(
      buildRequest({
        materialId:
          "verification-material-missing",
      }),
      [buildMaterial()]
    );

  assertNotResolved(
    result,
    "VERIFICATION_MATERIAL_NOT_FOUND"
  );

  assert.equal(
    result.materialLocated,
    false,
    "same-kind material is not an implicit fallback"
  );

  pass("no implicit fallback by material kind");

}


function main(): void {

  const resolved =
    runDeterministicResolutionScenario();

  runImmutabilityScenario();

  runFailClosedScenarios();

  runNoFallbackScenario();

  assertNoForbiddenResponsibilities(
    resolved
  );

  pass("no Mathematical Verification responsibility");
  pass("no Cryptographic Proof responsibility");
  pass("no Trust Admission responsibility");
  pass("no Authenticity Certification responsibility");
  pass("no P9X dependency");

  console.log("");
  console.log("========================================");
  console.log("VERIFICATION MATERIAL INFRASTRUCTURE CONTROL");
  console.log("========================================");
  console.log("STATUS: COMPLETE");

}

main();
