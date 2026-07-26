// ============================================================
// PlannerAgent - Signing Proof-Profile Authorization
// ============================================================
//
// One immutable, versioned technical tuple. Downstream consumers may
// consume the tuple, but may not replace any individual element.
// ============================================================

export type SigningInputTreatment = Readonly<{
  messageType: "RAW";
  digestTreatment: Readonly<{
    mode: "SIGNING_SCHEME_INTERNAL";
  }>;
}>;

export interface SigningKeyCapabilityRequirement {
  readonly keyFamily: "RSA";
  readonly keyPurpose: "SIGN_VERIFY";
  readonly parameterConstraints: Readonly<{
    modulusBits: 2048;
  }>;
  readonly signingSchemeCompatibility: "RSASSA_PSS_SHA_256";
  readonly signingInputTreatmentCompatibility: "RAW";
}

export interface SigningSchemeProfile {
  readonly algorithmFamily: "RSA_PSS";
  readonly providerAlgorithm: "RSASSA_PSS_SHA_256";
  readonly parameterSet: Readonly<{
    maskGenerationFunction: "MGF1_SHA_256";
    saltLength: "DIGEST_LENGTH";
  }>;
  readonly signingInputTreatment: SigningInputTreatment;
  readonly signatureEncoding: "RAW_BYTES";
  readonly verificationMaterialFormat: "SPKI_DER";
}

export interface MechanismsProofProfile {
  readonly profileId: "PLANNERAGENT_FDC_SIGN_V1";
  readonly profileVersion: "1";
  readonly subjectSchema: "FINANCIAL_DECISION_COMMIT_V1";
  readonly subjectRepresentation: "CLOSED_APPLICATION_OBJECT";
  readonly canonicalizationProfile: "PLANNERAGENT_FDC_CANONICAL_V1";
  readonly domainSeparation: "PLANNERAGENT:FDC:SIGN:V1";
  readonly signingScheme: SigningSchemeProfile;
  readonly requiredKeyCapability: SigningKeyCapabilityRequirement;
}

export type MechanismsProofProfileAuthorizationDecision =
  | "AUTHORIZED"
  | "DENIED";

export type MechanismsProofProfileDenialReason =
  | "MECHANISMS_PROOF_PROFILE_REQUEST_INCOMPLETE"
  | "MECHANISMS_PROOF_PROFILE_REQUEST_IDENTITY_INVALID"
  | "MECHANISMS_PROOF_PROFILE_NOT_APPROVED"
  | "MECHANISMS_PROOF_PROFILE_TUPLE_INCOHERENT";

export interface MechanismsProofProfileAuthorizationRequest {
  readonly requestId: string;
  readonly profileId: string;
  readonly profileVersion: string;
}

export interface MechanismsProofProfileAuthorization {
  readonly authorizationId: string;
  readonly decision: MechanismsProofProfileAuthorizationDecision;
  readonly authorizedAt: string;
  readonly request: Readonly<MechanismsProofProfileAuthorizationRequest>;
  readonly proofProfile?: Readonly<MechanismsProofProfile>;
  readonly denialReason?: MechanismsProofProfileDenialReason;
}

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EXACT_UTC_MILLISECONDS =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

const FIRST_SIGNING_PROOF_PROFILE: MechanismsProofProfile = deepFreeze({
  profileId: "PLANNERAGENT_FDC_SIGN_V1",
  profileVersion: "1",
  subjectSchema: "FINANCIAL_DECISION_COMMIT_V1",
  subjectRepresentation: "CLOSED_APPLICATION_OBJECT",
  canonicalizationProfile: "PLANNERAGENT_FDC_CANONICAL_V1",
  domainSeparation: "PLANNERAGENT:FDC:SIGN:V1",
  signingScheme: {
    algorithmFamily: "RSA_PSS",
    providerAlgorithm: "RSASSA_PSS_SHA_256",
    parameterSet: {
      maskGenerationFunction: "MGF1_SHA_256",
      saltLength: "DIGEST_LENGTH",
    },
    signingInputTreatment: {
      messageType: "RAW",
      digestTreatment: {
        mode: "SIGNING_SCHEME_INTERNAL",
      },
    },
    signatureEncoding: "RAW_BYTES",
    verificationMaterialFormat: "SPKI_DER",
  },
  requiredKeyCapability: {
    keyFamily: "RSA",
    keyPurpose: "SIGN_VERIFY",
    parameterConstraints: {
      modulusBits: 2048,
    },
    signingSchemeCompatibility: "RSASSA_PSS_SHA_256",
    signingInputTreatmentCompatibility: "RAW",
  },
});

export function getFirstSigningProofProfile():
Readonly<MechanismsProofProfile> {
  return FIRST_SIGNING_PROOF_PROFILE;
}

function deny(
  request: MechanismsProofProfileAuthorizationRequest,
  authorizationId: string,
  authorizedAt: string,
  denialReason: MechanismsProofProfileDenialReason,
): Readonly<MechanismsProofProfileAuthorization> {
  return deepFreeze({
    authorizationId,
    decision: "DENIED",
    authorizedAt,
    request: { ...request },
    denialReason,
  });
}

export function authorizeMechanismsProofProfile(
  request: MechanismsProofProfileAuthorizationRequest,
  authorizationId: string,
  authorizedAt: string,
): Readonly<MechanismsProofProfileAuthorization> {
  if (
    typeof request?.profileId !== "string" ||
    request.profileId.length === 0 ||
    typeof request?.profileVersion !== "string" ||
    request.profileVersion.length === 0
  ) return deny(
    request,
    authorizationId,
    authorizedAt,
    "MECHANISMS_PROOF_PROFILE_REQUEST_INCOMPLETE",
  );

  if (
    !UUID_V4.test(request.requestId) ||
    !UUID_V4.test(authorizationId) ||
    !EXACT_UTC_MILLISECONDS.test(authorizedAt) ||
    !Number.isFinite(Date.parse(authorizedAt))
  ) return deny(
    request,
    authorizationId,
    authorizedAt,
    "MECHANISMS_PROOF_PROFILE_REQUEST_IDENTITY_INVALID",
  );

  if (
    request.profileId !== FIRST_SIGNING_PROOF_PROFILE.profileId ||
    request.profileVersion !== FIRST_SIGNING_PROOF_PROFILE.profileVersion
  ) return deny(
    request,
    authorizationId,
    authorizedAt,
    "MECHANISMS_PROOF_PROFILE_NOT_APPROVED",
  );

  const scheme = FIRST_SIGNING_PROOF_PROFILE.signingScheme;
  if (
    scheme.signingInputTreatment.messageType !== "RAW" ||
    scheme.signingInputTreatment.digestTreatment.mode !==
      "SIGNING_SCHEME_INTERNAL" ||
    scheme.providerAlgorithm !== "RSASSA_PSS_SHA_256" ||
    FIRST_SIGNING_PROOF_PROFILE.requiredKeyCapability
      .signingInputTreatmentCompatibility !== "RAW"
  ) return deny(
    request,
    authorizationId,
    authorizedAt,
    "MECHANISMS_PROOF_PROFILE_TUPLE_INCOHERENT",
  );

  return deepFreeze({
    authorizationId,
    decision: "AUTHORIZED",
    authorizedAt,
    request: { ...request },
    proofProfile: FIRST_SIGNING_PROOF_PROFILE,
  });
}
