import { describe, expect, it, vi } from "vitest";
import { deepCopyAndFreeze } from "../../knowledge.projection.guard.v1";
import type { CognitiveTransportEvidenceRepositoryV1 } from "../cognitive.transport.contracts.v1";
import { CognitiveTransportMediatorV1 } from "../cognitive.transport.mediator.v1";
import { verifySealedCognitiveExposureV1 } from "../cognitive.exposure.seal.v1";
import type { PublicCognitiveExposureV1, PublicCognitiveTransportEvidenceRepositoryV1, PublicCognitiveTransportEvidenceV1 } from "../public.cognitive.exposure.contracts.v1";
import { sealPublicCognitiveExposureV1, verifySealedPublicCognitiveExposureV1 } from "../public.cognitive.exposure.seal.v1";

function exposure(overrides: Record<string, unknown> = {}): PublicCognitiveExposureV1 {
  return {
    version: 1,
    trust_domain: "PUBLIC",
    scope: "REQUEST_BOUND",
    organizational_status: "NON_ORGANIZATIONAL",
    retention: "NO_RETENTION",
    purpose: "PUBLIC_PRODUCT_CONVERSATION",
    request_id: "request-1",
    consumption_id: "consumption-1",
    provider: "openai",
    model: "model-1",
    projection: { classification: "PUBLIC_SAFE", content: "Public product facts" },
    ...overrides,
  } as PublicCognitiveExposureV1;
}

class PublicEvidence implements PublicCognitiveTransportEvidenceRepositoryV1 {
  used = new Set<string>();
  events: PublicCognitiveTransportEvidenceV1[] = [];
  async reserve(id: string) { if (this.used.has(id)) return false; this.used.add(id); return true; }
  async append(event: PublicCognitiveTransportEvidenceV1) { this.events.push(event); }
}

const governedEvidence: CognitiveTransportEvidenceRepositoryV1 = { reserve: async () => true, append: async () => undefined };

describe("PUBLIC-COGNITIVE-EXPOSURE-V1", () => {
  it("seals and verifies public request-bound content deterministically without organizational identity", () => {
    const first = sealPublicCognitiveExposureV1(exposure());
    const second = sealPublicCognitiveExposureV1(exposure());
    expect(first).toEqual(second);
    expect(() => verifySealedPublicCognitiveExposureV1(first, "openai", "model-1")).not.toThrow();
    expect(first).toMatchObject({ trust_domain: "PUBLIC", scope: "REQUEST_BOUND", organizational_status: "NON_ORGANIZATIONAL", retention: "NO_RETENTION", purpose: "PUBLIC_PRODUCT_CONVERSATION" });
    for (const field of ["principal_id", "session_id", "membership_id", "tenant_id", "company_id", "actor_id", "oag_actor_id", "baseline_snapshot_id"]) expect(first).not.toHaveProperty(field);
  });

  it.each([
    ["purpose", { purpose: "EXPLANATION" }],
    ["retention", { retention: "TRANSIENT_PROCESSING" }],
    ["request binding", { request_id: "" }],
    ["arbitrary projection", { projection: { classification: "PUBLIC_SAFE", content: "safe", internal: { secret: true } } }],
  ])("rejects invalid %s", (_label, change) => expect(() => sealPublicCognitiveExposureV1(exposure(change))).toThrow(/COGNITIVE_/));

  it.each([
    ["projection", (sealed: any) => ({ ...sealed, canonical_projection: '{"classification":"PUBLIC_SAFE","content":"changed"}' })],
    ["provider", (sealed: any) => ({ ...sealed, provider: "anthropic" })],
    ["model", (sealed: any) => ({ ...sealed, model: "other" })],
    ["manifest", (sealed: any) => ({ ...sealed, manifest_id: "other@1" })],
    ["request binding", (sealed: any) => ({ ...sealed, request_id: "request-2" })],
  ])("rejects sealed %s mutation", (_label, mutate) => {
    const changed = deepCopyAndFreeze(mutate(sealPublicCognitiveExposureV1(exposure()))) as any;
    expect(() => verifySealedPublicCognitiveExposureV1(changed, "openai", "model-1")).toThrow(/COGNITIVE_/);
  });

  it("keeps public and governed trust domains mutually exclusive", () => {
    const sealed = sealPublicCognitiveExposureV1(exposure());
    expect(() => verifySealedCognitiveExposureV1(sealed as any, "openai", "model-1")).toThrow();
    expect(() => verifySealedPublicCognitiveExposureV1({ eligibility: {} } as any, "openai", "model-1")).toThrow(/COGNITIVE_/);
  });

  it("dispatches through the existing provider transport only after public verification", async () => {
    const publicEvidence = new PublicEvidence();
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ output_text: "Public answer", usage: { input_tokens: 2, output_tokens: 3 } })));
    const mediator = new CognitiveTransportMediatorV1({ fetch: fetcher as any, evidence: governedEvidence, publicEvidence, now: () => "2026-08-22T12:00:00.000Z" });
    const sealed = sealPublicCognitiveExposureV1(exposure());
    const response = await mediator.dispatchPublic({ sealed, provider: "openai", model: "model-1", api_key: "secret" });
    expect(response).toMatchObject({ text: "Public answer", advisory_only: true, evidence: { request_id: "request-1", consumption_id: "consumption-1", retention: "NO_RETENTION" } });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(publicEvidence.events).toHaveLength(1);
    expect(JSON.stringify(publicEvidence.events)).not.toMatch(/Public product facts|Public answer|secret|company|tenant|principal|membership|session/i);
  });

  it("fails invalid public exposure before provider invocation and creates no persistent store", async () => {
    const publicEvidence = new PublicEvidence();
    const fetcher = vi.fn();
    const mediator = new CognitiveTransportMediatorV1({ fetch: fetcher as any, evidence: governedEvidence, publicEvidence, now: () => "now" });
    const changed = deepCopyAndFreeze({ ...sealPublicCognitiveExposureV1(exposure()), model: "other" }) as any;
    await expect(mediator.dispatchPublic({ sealed: changed, provider: "openai", model: "model-1", api_key: "secret" })).rejects.toMatchObject({ code: "COGNITIVE_MODEL_NOT_ADMITTED" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(publicEvidence.events).toHaveLength(0);
    expect(mediator).not.toHaveProperty("memory");
  });
});
