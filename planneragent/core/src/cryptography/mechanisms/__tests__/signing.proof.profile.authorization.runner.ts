import {
  authorizeMechanismsProofProfile,
  getFirstSigningProofProfile,
} from "../signing.proof.profile.authorization";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const request = {
  requestId: "50000000-0000-4000-8000-000000000001",
  profileId: "PLANNERAGENT_FDC_SIGN_V1",
  profileVersion: "1",
};
const authorization = authorizeMechanismsProofProfile(
  request,
  "60000000-0000-4000-8000-000000000001",
  "2026-07-26T10:00:00.000Z",
);
const profile = authorization.proofProfile;

assert(authorization.decision === "AUTHORIZED", "exact profile is authorized");
assert(Object.isFrozen(profile), "proof profile is immutable");
assert(
  profile?.signingScheme.signingInputTreatment.messageType === "RAW" &&
    profile.signingScheme.signingInputTreatment.digestTreatment.mode ===
      "SIGNING_SCHEME_INTERNAL",
  "RAW and signing-scheme internal digest treatment are inseparable",
);
assert(
  profile?.signingScheme.providerAlgorithm === "RSASSA_PSS_SHA_256",
  "one signing scheme is fixed",
);
assert(
  profile?.requiredKeyCapability.keyFamily === "RSA" &&
    profile.requiredKeyCapability.parameterConstraints.modulusBits === 2048 &&
    !("providerImplementation" in profile.requiredKeyCapability),
  "key requirements are provider-neutral",
);
assert(
  !("digestProfile" in (profile?.signingScheme.signingInputTreatment ?? {})),
  "RAW does not expose an independent digest profile",
);

const unknown = authorizeMechanismsProofProfile(
  { ...request, profileVersion: "2" },
  "60000000-0000-4000-8000-000000000002",
  "2026-07-26T10:00:00.000Z",
);
assert(
  unknown.denialReason === "MECHANISMS_PROOF_PROFILE_NOT_APPROVED",
  "unapproved tuple version fails closed",
);
assert(
  getFirstSigningProofProfile() === getFirstSigningProofProfile(),
  "profile resolution is deterministic",
);

console.log("Signing proof-profile authorization runner completed.");
