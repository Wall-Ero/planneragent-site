// ============================================================
// PlannerAgent - Verification Material Infrastructure Control
// ============================================================
//
// STATUS
// ------------------------------------------------------------
// CANONICAL SOURCE OF TRUTH
//
// CATEGORY
// ------------------------------------------------------------
// Infrastructure Control
//
// PURPOSE
// ------------------------------------------------------------
// Resolve one exact, structurally complete verification-material
// reference for future Mathematical Verification.
//
// This domain resolves infrastructure material references.
// It does not verify signatures, execute mathematics, produce
// proofs, admit trust, or certify authenticity.
//
// ============================================================


// ============================================================
// MATERIAL KIND
// ============================================================

export type VerificationMaterialKind =
  | "PUBLIC_KEY"
  | "CERTIFICATE"
  | "VERIFICATION_PARAMETER_SET";


// ============================================================
// MATERIAL RECORD
// ============================================================
//
// Infrastructure sources expose references, never raw private
// key material, secrets, credentials, or plaintext.
//
// ============================================================

export interface VerificationMaterialInfrastructureRecord {

  materialId:
    string;

  materialKind:
    VerificationMaterialKind;

  materialVersion:
    string;

  materialDigest:
    string;

  materialDigestAlgorithm:
    string;

  immutableLocationReference:
    string;

  verificationContextId:
    string;

  tenantId:
    string;

  companyId:
    string;

}


// ============================================================
// RESOLUTION REQUEST
// ============================================================

export interface VerificationMaterialResolutionRequest {

  materialId:
    string;

  requiredMaterialKind:
    VerificationMaterialKind;

  verificationContextId:
    string;

  tenantId:
    string;

  companyId:
    string;

}


// ============================================================
// IMMUTABLE MATERIAL REFERENCE
// ============================================================

export interface ResolvedVerificationMaterialReference {

  readonly materialId:
    string;

  readonly materialKind:
    VerificationMaterialKind;

  readonly materialVersion:
    string;

  readonly materialDigest:
    string;

  readonly materialDigestAlgorithm:
    string;

  readonly immutableLocationReference:
    string;

  readonly verificationContextId:
    string;

  readonly tenantId:
    string;

  readonly companyId:
    string;

}


// ============================================================
// RESOLUTION FAILURE
// ============================================================

export type VerificationMaterialResolutionFailureReason =
  | "VERIFICATION_MATERIAL_REQUEST_INCOMPLETE"
  | "VERIFICATION_MATERIAL_NOT_FOUND"
  | "VERIFICATION_MATERIAL_AMBIGUOUS"
  | "VERIFICATION_MATERIAL_INCOMPLETE"
  | "VERIFICATION_MATERIAL_INCOHERENT";


// ============================================================
// RESOLUTION RESULT
// ============================================================

export interface VerificationMaterialResolutionResult {

  resolutionStatus:
    | "VERIFICATION_MATERIAL_RESOLVED"
    | "VERIFICATION_MATERIAL_NOT_RESOLVED";

  resolutionAttempted:
    boolean;

  materialLocated:
    boolean;

  materialStructurallyComplete:
    boolean;

  materialCoherent:
    boolean;

  materialResolved:
    boolean;

  failureReason?:
    VerificationMaterialResolutionFailureReason;

  materialReference?:
    Readonly<ResolvedVerificationMaterialReference>;

  summary:
    string[];

}


// ============================================================
// STRUCTURAL HELPERS
// ============================================================

function isNonEmptyString(
  value:
    unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}


function requestIsComplete(
  request:
    VerificationMaterialResolutionRequest
): boolean {

  return (
    isNonEmptyString(request.materialId) &&
    isNonEmptyString(request.requiredMaterialKind) &&
    isNonEmptyString(request.verificationContextId) &&
    isNonEmptyString(request.tenantId) &&
    isNonEmptyString(request.companyId)
  );

}


function materialIsStructurallyComplete(
  material:
    VerificationMaterialInfrastructureRecord
): boolean {

  return (
    isNonEmptyString(material.materialId) &&
    isNonEmptyString(material.materialKind) &&
    isNonEmptyString(material.materialVersion) &&
    isNonEmptyString(material.materialDigest) &&
    isNonEmptyString(material.materialDigestAlgorithm) &&
    isNonEmptyString(material.immutableLocationReference) &&
    isNonEmptyString(material.verificationContextId) &&
    isNonEmptyString(material.tenantId) &&
    isNonEmptyString(material.companyId)
  );

}


function materialIsCoherentWithRequest(
  request:
    VerificationMaterialResolutionRequest,
  material:
    VerificationMaterialInfrastructureRecord
): boolean {

  return (
    material.materialId === request.materialId &&
    material.materialKind === request.requiredMaterialKind &&
    material.verificationContextId === request.verificationContextId &&
    material.tenantId === request.tenantId &&
    material.companyId === request.companyId
  );

}


function unresolvedResult(
  failureReason:
    VerificationMaterialResolutionFailureReason,
  materialLocated:
    boolean,
  materialStructurallyComplete:
    boolean,
  materialCoherent:
    boolean,
  summary:
    string
): VerificationMaterialResolutionResult {

  return {

    resolutionStatus:
      "VERIFICATION_MATERIAL_NOT_RESOLVED",

    resolutionAttempted:
      true,

    materialLocated,

    materialStructurallyComplete,

    materialCoherent,

    materialResolved:
      false,

    failureReason,

    summary: [
      summary,
      "verification_material_not_resolved",
      "fail_closed",
    ],

  };

}


function immutableReferenceFrom(
  material:
    VerificationMaterialInfrastructureRecord
): Readonly<ResolvedVerificationMaterialReference> {

  return Object.freeze({

    materialId:
      material.materialId,

    materialKind:
      material.materialKind,

    materialVersion:
      material.materialVersion,

    materialDigest:
      material.materialDigest,

    materialDigestAlgorithm:
      material.materialDigestAlgorithm,

    immutableLocationReference:
      material.immutableLocationReference,

    verificationContextId:
      material.verificationContextId,

    tenantId:
      material.tenantId,

    companyId:
      material.companyId,

  });

}


// ============================================================
// VERIFICATION MATERIAL RESOLUTION
// ============================================================

export function resolveVerificationMaterial(
  request:
    VerificationMaterialResolutionRequest,
  availableMaterials:
    readonly VerificationMaterialInfrastructureRecord[]
): VerificationMaterialResolutionResult {

  if (!requestIsComplete(request)) {

    return unresolvedResult(
      "VERIFICATION_MATERIAL_REQUEST_INCOMPLETE",
      false,
      false,
      false,
      "verification_material_request_incomplete"
    );

  }

  const exactMatches =
    availableMaterials.filter(
      material =>
        material.materialId ===
          request.materialId
    );

  if (exactMatches.length === 0) {

    return unresolvedResult(
      "VERIFICATION_MATERIAL_NOT_FOUND",
      false,
      false,
      false,
      "verification_material_not_found"
    );

  }

  if (exactMatches.length !== 1) {

    return unresolvedResult(
      "VERIFICATION_MATERIAL_AMBIGUOUS",
      true,
      false,
      false,
      "verification_material_ambiguous"
    );

  }

  const material =
    exactMatches[0];

  if (!materialIsStructurallyComplete(material)) {

    return unresolvedResult(
      "VERIFICATION_MATERIAL_INCOMPLETE",
      true,
      false,
      false,
      "verification_material_incomplete"
    );

  }

  if (
    !materialIsCoherentWithRequest(
      request,
      material
    )
  ) {

    return unresolvedResult(
      "VERIFICATION_MATERIAL_INCOHERENT",
      true,
      true,
      false,
      "verification_material_incoherent"
    );

  }

  return {

    resolutionStatus:
      "VERIFICATION_MATERIAL_RESOLVED",

    resolutionAttempted:
      true,

    materialLocated:
      true,

    materialStructurallyComplete:
      true,

    materialCoherent:
      true,

    materialResolved:
      true,

    materialReference:
      immutableReferenceFrom(
        material
      ),

    summary: [
      "verification_material_located",
      "verification_material_structurally_complete",
      "verification_material_coherent",
      "verification_material_reference_resolved",
    ],

  };

}


// ============================================================
// BOUNDARY
// ============================================================
//
// Resolution != Mathematical Verification
// Resolution != Cryptographic Proof
// Resolution != Trust Admission
// Resolution != Authenticity Certification
//
// This domain imports no Mechanism, Governance, Provider Runtime,
// P9V, P9W, or P9X implementation.
//
// ============================================================
