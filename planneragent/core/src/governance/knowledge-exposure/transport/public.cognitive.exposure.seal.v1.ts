import { createHash } from "node:crypto";
import { deepCopyAndFreeze } from "../knowledge.projection.guard.v1";
import { CognitiveTransportError, type CognitiveProviderV1 } from "./cognitive.transport.contracts.v1";
import {
  PUBLIC_COGNITIVE_EXPOSURE_MANIFEST_ID_V1,
  PUBLIC_COGNITIVE_EXPOSURE_MAX_CONTENT_LENGTH_V1,
  PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1,
  type PublicCognitiveExposureV1,
  type SealedPublicCognitiveExposureV1,
} from "./public.cognitive.exposure.contracts.v1";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const identifier = (value: unknown) => typeof value === "string" && value.trim().length > 0 && value.length <= 256;
const requestBindingDigest = (input: Readonly<{ request_id: string; consumption_id: string; provider: string; model: string; projection_digest: string }>) =>
  digest(JSON.stringify([input.request_id, input.consumption_id, PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1, "NO_RETENTION", input.provider, input.model, input.projection_digest]));

function canonicalProjection(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CognitiveTransportError("COGNITIVE_MANIFEST_MISMATCH");
  const projection = value as Record<string, unknown>;
  if (Object.keys(projection).sort().join(",") !== "classification,content") throw new CognitiveTransportError("COGNITIVE_MANIFEST_MISMATCH");
  if (projection.classification !== "PUBLIC_SAFE") throw new CognitiveTransportError("COGNITIVE_MANIFEST_MISMATCH");
  if (typeof projection.content !== "string" || projection.content.trim().length === 0 || projection.content.length > PUBLIC_COGNITIVE_EXPOSURE_MAX_CONTENT_LENGTH_V1) {
    throw new CognitiveTransportError("COGNITIVE_REQUEST_TOO_LARGE");
  }
  return JSON.stringify({ classification: "PUBLIC_SAFE", content: projection.content });
}

export function sealPublicCognitiveExposureV1(input: PublicCognitiveExposureV1): SealedPublicCognitiveExposureV1 {
  if (!input || input.version !== 1 || input.trust_domain !== "PUBLIC" || input.scope !== "REQUEST_BOUND" || input.organizational_status !== "NON_ORGANIZATIONAL") {
    throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_INVALID");
  }
  if (input.purpose !== PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1) throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_PURPOSE_MISMATCH");
  if (input.retention !== "NO_RETENTION") throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_RETENTION_MISMATCH");
  if (!identifier(input.request_id) || !identifier(input.consumption_id)) throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_CONSUMPTION_MISMATCH");
  if (!identifier(input.model)) throw new CognitiveTransportError("COGNITIVE_MODEL_NOT_ADMITTED");
  const providerIdentity = `${input.provider}:${input.model}`;
  const canonical = canonicalProjection(input.projection);
  const projectionDigest = digest(canonical);
  return deepCopyAndFreeze({
    version: 1,
    trust_domain: "PUBLIC",
    scope: "REQUEST_BOUND",
    organizational_status: "NON_ORGANIZATIONAL",
    retention: "NO_RETENTION",
    purpose: PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1,
    manifest_id: PUBLIC_COGNITIVE_EXPOSURE_MANIFEST_ID_V1,
    request_id: input.request_id,
    consumption_id: input.consumption_id,
    provider: input.provider,
    provider_identity: providerIdentity,
    model: input.model,
    canonical_projection: canonical,
    canonical_projection_digest: projectionDigest,
    request_binding_digest: requestBindingDigest({ request_id: input.request_id, consumption_id: input.consumption_id, provider: input.provider, model: input.model, projection_digest: projectionDigest }),
  }) as SealedPublicCognitiveExposureV1;
}

export function verifySealedPublicCognitiveExposureV1(
  sealed: SealedPublicCognitiveExposureV1,
  provider: CognitiveProviderV1,
  model: string,
): void {
  if (!sealed || !Object.isFrozen(sealed) || sealed.trust_domain !== "PUBLIC" || sealed.scope !== "REQUEST_BOUND" || sealed.organizational_status !== "NON_ORGANIZATIONAL") {
    throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_INVALID");
  }
  if (sealed.purpose !== PUBLIC_COGNITIVE_EXPOSURE_PURPOSE_V1) throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_PURPOSE_MISMATCH");
  if (sealed.manifest_id !== PUBLIC_COGNITIVE_EXPOSURE_MANIFEST_ID_V1) throw new CognitiveTransportError("COGNITIVE_MANIFEST_MISMATCH");
  if (sealed.retention !== "NO_RETENTION") throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_RETENTION_MISMATCH");
  if (!identifier(sealed.request_id) || !identifier(sealed.consumption_id)) throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_CONSUMPTION_MISMATCH");
  if (sealed.provider !== provider) throw new CognitiveTransportError("COGNITIVE_PROVIDER_NOT_ADMITTED");
  if (sealed.model !== model || sealed.provider_identity !== `${provider}:${model}`) throw new CognitiveTransportError("COGNITIVE_MODEL_NOT_ADMITTED");
  if (digest(sealed.canonical_projection) !== sealed.canonical_projection_digest) throw new CognitiveTransportError("COGNITIVE_PROJECTION_MUTATED");
  if (sealed.request_binding_digest !== requestBindingDigest({ request_id: sealed.request_id, consumption_id: sealed.consumption_id, provider: sealed.provider, model: sealed.model, projection_digest: sealed.canonical_projection_digest })) throw new CognitiveTransportError("COGNITIVE_ELIGIBILITY_CONSUMPTION_MISMATCH");
  canonicalProjection(JSON.parse(sealed.canonical_projection));
}
