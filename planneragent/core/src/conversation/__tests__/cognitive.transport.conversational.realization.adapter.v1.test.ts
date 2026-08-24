import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { PublicCognitiveAdvisoryResponseV1 } from "../../governance/knowledge-exposure/transport";
import { parseRealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import { createPlannerAgentPublicCapabilityProjectionV1 } from "../planneragent.public.capabilities.v1";
import { createPlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";
import { AnonymousVisionConversationRateGuardV1 } from "../anonymous.vision.conversation.rate.v1";
import { runAnonymousVisionConversationV1 } from "../anonymous.vision.conversation.runtime.v1";
import {
  CognitiveTransportConversationalRealizationAdapterV1,
  type PublicCognitiveRealizationTransportV1,
} from "../cognition/cognitive.transport.conversational.realization.adapter.v1";
import { createConversationalProviderDescriptorV1, type ConversationalRealizationProviderV1, type SealedConversationalRealizationRequestV1 } from "../cognition/conversational.cognition.contracts.v1";

const route = Object.freeze({ request_id: "request-1", consumption_id: "public-conversation:request-1", provider: "openrouter" as const, model: "openrouter/free", api_key: "key", max_tokens: 700, temperature: 0.2 });
const request = (message = "What can you dot?") => Object.freeze({
  version: 1 as const,
  current_user_message: message,
  governed_meaning: createPlannerAgentPublicCapabilityProjectionV1(),
  voice_profile: createPlannerAgentVoiceProfileV1(),
  required_output_contract: "REALIZATION_ENVELOPE_V1" as const,
});
const advisory = (text: string) => ({ version: 1, provider: "openrouter", model: "openrouter/free", text, response_digest: "digest", evidence: {}, advisory_only: true }) as PublicCognitiveAdvisoryResponseV1;

describe("COGNITIVE-TRANSPORT-CONVERSATIONAL-REALIZATION-ADAPTER-V1", () => {
  it("implements only provider-neutral REALIZATION and returns raw output", async () => {
    const dispatchPublic = vi.fn(async () => advisory('{"version":1,"answer":"Raw answer."}'));
    const adapter: ConversationalRealizationProviderV1<ReturnType<typeof createPlannerAgentPublicCapabilityProjectionV1>> = new CognitiveTransportConversationalRealizationAdapterV1({ dispatchPublic }, route);
    expect(adapter.descriptor).toMatchObject({ provider_id: "openrouter", model_id: "openrouter/free", capabilities: ["REALIZATION"], retention_privacy_class: "NO_RETENTION" });
    expect(adapter.descriptor.capabilities).not.toContain("INTERPRETATION");
    await expect(adapter.realize(request())).resolves.toBe('{"version":1,"answer":"Raw answer."}');
  });

  it("preserves raw message, governed Product meaning, Voice, output requirement, and existing exposure shape", async () => {
    const input = request();
    const dispatchPublic = vi.fn(async ({ sealed }) => advisory(sealed.canonical_projection));
    const adapter = new CognitiveTransportConversationalRealizationAdapterV1({ dispatchPublic }, route);
    const raw = await adapter.realize(input);
    const call = dispatchPublic.mock.calls[0]?.[0];
    const exposed = JSON.parse(JSON.parse(raw).content);
    expect(exposed.USER_MESSAGE).toBe("What can you dot?");
    expect(exposed.PUBLIC_CAPABILITIES).toEqual(input.governed_meaning);
    expect(exposed.VOICE_PROFILE).toEqual(input.voice_profile);
    expect(input.required_output_contract).toBe("REALIZATION_ENVELOPE_V1");
    expect(call).toMatchObject({ provider: "openrouter", model: "openrouter/free", max_tokens: 700, temperature: 0.2, sealed: { purpose: "PUBLIC_PRODUCT_CONVERSATION", retention: "NO_RETENTION" } });
    expect(exposed).toHaveProperty("PUBLIC_INSTRUCTION");
  });

  it("leaves strict realization-envelope trust outside the adapter", async () => {
    const transport: PublicCognitiveRealizationTransportV1 = { dispatchPublic: async () => advisory("not an envelope") };
    const raw = await new CognitiveTransportConversationalRealizationAdapterV1(transport, route).realize(request());
    expect(raw).toBe("not an envelope");
    expect(parseRealizationEnvelopeV1(raw)).toBeUndefined();
    expectTypeOf<CognitiveTransportConversationalRealizationAdapterV1>().toMatchTypeOf<ConversationalRealizationProviderV1<ReturnType<typeof createPlannerAgentPublicCapabilityProjectionV1>>>();
  });

  it("makes the Product runtime invoke the provider-neutral seam while Core retains envelope acceptance", async () => {
    const realize = vi.fn(async (_input: SealedConversationalRealizationRequestV1<ReturnType<typeof createPlannerAgentPublicCapabilityProjectionV1>>) => '{"version":1,"answer":"Adapter answer."}');
    const provider: ConversationalRealizationProviderV1<ReturnType<typeof createPlannerAgentPublicCapabilityProjectionV1>> = {
      descriptor: createConversationalProviderDescriptorV1({ version: 1, provider_id: "test", adapter_id: "test", adapter_version: "1", model_id: "test", model_version: "1", capabilities: ["REALIZATION"], deployment_class: "TEST", retention_privacy_class: "NO_RETENTION" }),
      realize,
    };
    const result = await runAnonymousVisionConversationV1({
      request: { version: 1, request_id: "request-1", message: "What can you dot?" }, client_key: "client-1", api_key: "key", fetch: vi.fn() as any,
      rate_guard: new AnonymousVisionConversationRateGuardV1(), create_realization_provider: () => provider,
    });
    expect(result).toMatchObject({ posture: "PUBLIC_PRODUCT_ANSWER", text: "Adapter answer." });
    expect(realize).toHaveBeenCalledOnce();
    expect(realize.mock.calls[0]?.[0]).toMatchObject({ current_user_message: "What can you dot?", required_output_contract: "REALIZATION_ENVELOPE_V1", voice_profile: createPlannerAgentVoiceProfileV1(), governed_meaning: createPlannerAgentPublicCapabilityProjectionV1() });

    for (const raw of ["not-json", '{"version":1,"answer":""}']) {
      provider.realize = async () => raw;
      await expect(runAnonymousVisionConversationV1({
        request: { version: 1, request_id: `request-${raw.length}`, message: "What can PlannerAgent do?" }, client_key: `client-${raw.length}`, api_key: "key", fetch: vi.fn() as any,
        rate_guard: new AnonymousVisionConversationRateGuardV1(), create_realization_provider: () => provider,
      })).resolves.toMatchObject({ error: "SERVICE_UNAVAILABLE" });
    }
  });
});
