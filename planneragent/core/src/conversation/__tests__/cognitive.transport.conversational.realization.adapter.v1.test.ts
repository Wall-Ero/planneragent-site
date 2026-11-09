import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { PublicCognitiveAdvisoryResponseV1, PublicCognitiveTransportEvidenceV1 } from "../../governance/knowledge-exposure/transport";
import { CognitiveTransportMediatorV1 } from "../../governance/knowledge-exposure/transport";
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
import { createGovernedVisionOperationalRealizationAdapterV1, GOVERNED_VISION_OPERATIONAL_REALIZATION_INSTRUCTION_V1, type GovernedVisionOperationalProjectionV1 } from "../governed.vision.operational.projection.v1";

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
    expect(call).toMatchObject({ provider: "openrouter", model: "openrouter/free", max_tokens: 700, temperature: 0.2, required_output_contract: "REALIZATION_ENVELOPE_V1", sealed: { purpose: "PUBLIC_PRODUCT_CONVERSATION", retention: "NO_RETENTION" } });
    expect(exposed).toHaveProperty("PUBLIC_INSTRUCTION");
  });

  it("leaves strict realization-envelope trust outside the adapter", async () => {
    const transport: PublicCognitiveRealizationTransportV1 = { dispatchPublic: async () => advisory("not an envelope") };
    const raw = await new CognitiveTransportConversationalRealizationAdapterV1(transport, route).realize(request());
    expect(raw).toBe("not an envelope");
    expect(parseRealizationEnvelopeV1(raw)).toBeUndefined();
    expectTypeOf<CognitiveTransportConversationalRealizationAdapterV1>().toMatchTypeOf<ConversationalRealizationProviderV1<ReturnType<typeof createPlannerAgentPublicCapabilityProjectionV1>>>();
  });

  it("enforces the realization format on the live transport without merging interpretation into governed meaning", async () => {
    const semantic = { version: 1 as const, interaction: "PRODUCT_QUESTION" as const, product_focus: "GENERAL_CAPABILITIES" as const, resolution: "CLEAR" as const, interpretation_only: true as const, requester_content_non_authoritative: true as const, grants_authority: false as const, grants_execution: false as const };
    const input = Object.freeze({ ...request(), semantic_interpretation: semantic });
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: '{"version":1,"answer":"Bounded answer."}' } }] })));
    const result = await runAnonymousVisionConversationV1({
      request: { version: 1, request_id: "format-test", message: "What can PlannerAgent do?" }, client_key: "format-test", api_key: "key", fetch: fetcher as any,
      rate_guard: new AnonymousVisionConversationRateGuardV1(),
      create_realization_provider: (transport, selectedRoute) => ({ descriptor: new CognitiveTransportConversationalRealizationAdapterV1(transport, selectedRoute).descriptor, realize: () => new CognitiveTransportConversationalRealizationAdapterV1(transport, selectedRoute).realize(input) }),
    });
    expect(result).toMatchObject({ text: "Bounded answer." });
    const body = JSON.parse(String((fetcher.mock.calls as unknown as Array<[unknown, RequestInit]>)[0][1].body));
    expect(body).toMatchObject({ model: "openrouter/free", max_tokens: 700, temperature: 0.2, reasoning: { max_tokens: 128 }, provider: { require_parameters: true }, response_format: { type: "json_schema", json_schema: { name: "REALIZATION_ENVELOPE_V1", strict: true, schema: { required: ["version", "answer"], additionalProperties: false, properties: { version: { enum: [1] }, answer: { type: "string" } } } } } });
    expect(body.messages[0].content).toContain('Return only one compact JSON object: {"version":1,"answer":"..."}');
    expect(body.messages[0].content).not.toContain("plain text or");
    const exposed = JSON.parse(JSON.parse(body.messages[1].content).content);
    expect(exposed.PUBLIC_CAPABILITIES).toEqual(input.governed_meaning);
    expect(exposed.SEMANTIC_INTERPRETATION).toEqual(semantic);
    expect(exposed.VOICE_PROFILE).toEqual(input.voice_profile);
  });

  it.each([
    ["captured fenced truncation", '```json\n{\n  "version": 1,\n  "'],
    ["unfinished answer", '{"version":1,"answer":"PlannerAgent observes'],
    ["unfinished object", '{"version":1,"answer":"Complete sentence."'],
  ])("fails closed on %s even with requested structured output", async (_label, raw) => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { reasoning: "Non-authoritative provider reasoning", content: raw } }] })));
    const result = await runAnonymousVisionConversationV1({ request: { version: 1, request_id: "truncation-test", message: "What can PlannerAgent do?" }, client_key: "truncation-test", api_key: "key", fetch: fetcher as any, rate_guard: new AnonymousVisionConversationRateGuardV1() });
    expect(result).toEqual({ version: 1, request_id: "truncation-test", error: "SERVICE_UNAVAILABLE" });
    expect(parseRealizationEnvelopeV1(raw)).toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect((fetcher.mock.calls as unknown as Array<[unknown, RequestInit]>)[0][1].body).toBe((fetcher.mock.calls as unknown as Array<[unknown, RequestInit]>)[1][1].body);
  });

  it.each([
    ["null content", null, "stop"],
    ["empty content", "", "stop"],
    ["whitespace content", "   ", "stop"],
    ["malformed envelope", '{"version":1,"answer":"unfinished', "stop"],
    ["incomplete generation with superficially valid JSON", '{"version":1,"answer":"Partial."}', "length"],
  ])("retries exactly once after HTTP success with %s", async (_label, content, finish_reason) => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason, message: { content, reasoning: '{"version":1,"answer":"Never use reasoning as the answer."}' } }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: '{"version":1,"answer":"Recovered answer."}' } }] })));
    const result = await runAnonymousVisionConversationV1({ request: { version: 1, request_id: "retry-test", message: "What can PlannerAgent do?" }, client_key: "retry-test", api_key: "key", fetch: fetcher as any, rate_guard: new AnonymousVisionConversationRateGuardV1() });
    expect(result).toMatchObject({ text: "Recovered answer." });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const calls = fetcher.mock.calls as unknown as Array<[unknown, RequestInit]>;
    expect(calls[0][1].body).toBe(calls[1][1].body);
    expect(JSON.parse(String(calls[1][1].body))).toMatchObject({ model: "openrouter/free", max_tokens: 700 });
  });

  it.each([400, 429, 500])("does not retry HTTP %s", async (status) => {
    const fetcher = vi.fn(async () => new Response('{"error":{"message":"Provider failure"}}', { status }));
    const result = await runAnonymousVisionConversationV1({ request: { version: 1, request_id: "http-test", message: "What can PlannerAgent do?" }, client_key: "http-test", api_key: "key", fetch: fetcher as any, rate_guard: new AnonymousVisionConversationRateGuardV1() });
    expect(result).toMatchObject({ error: "SERVICE_UNAVAILABLE" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("does not retry network failures or bypass request admission", async () => {
    const fetcher = vi.fn(async () => { throw new Error("Network failure"); });
    const args = { client_key: "network-test", api_key: "key", fetch: fetcher as any, rate_guard: new AnonymousVisionConversationRateGuardV1() };
    expect(await runAnonymousVisionConversationV1({ ...args, request: { version: 1, request_id: "network-test", message: "What can PlannerAgent do?" } })).toMatchObject({ error: "SERVICE_UNAVAILABLE" });
    expect(fetcher).toHaveBeenCalledOnce();
    fetcher.mockClear();
    expect(await runAnonymousVisionConversationV1({ ...args, request: { version: 2, message: "What can PlannerAgent do?" } })).toMatchObject({ error: "REQUEST_NOT_ADMITTED" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(await runAnonymousVisionConversationV1({ ...args, request: { version: 1, request_id: "authority-test", message: "Execute this action for me" } })).toMatchObject({ posture: "EXECUTION_UNAVAILABLE" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("retains one exposure reservation and final evidence event for both realization attempts", async () => {
    const reserve = vi.fn(async () => true), append = vi.fn(async (_event: PublicCognitiveTransportEvidenceV1) => undefined);
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: null } }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: '{"version":1,"answer":"Recovered."}' } }] })));
    const transport = new CognitiveTransportMediatorV1({ fetch: fetcher as any, evidence: { reserve: async () => false, append: async () => undefined }, publicEvidence: { reserve, append }, now: () => "2026-10-11T00:00:00Z" });
    const adapter = new CognitiveTransportConversationalRealizationAdapterV1(transport, route);
    expect(await adapter.realize(request())).toBe('{"version":1,"answer":"Recovered."}');
    expect(reserve).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalledOnce();
    expect(append.mock.calls[0]?.[0]).toMatchObject({ status: "SUCCEEDED", consumption_id: route.consumption_id });
    reserve.mockResolvedValueOnce(false);
    await expect(adapter.realize(request())).rejects.toMatchObject({ code: "COGNITIVE_FANOUT_NOT_ADMITTED" });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("carries governed VISION meaning through the existing realization transport and envelope", async () => {
    const governed = Object.freeze({ version: 1, projection_kind: "GOVERNED_VISION_OPERATIONAL_MEANING" }) as GovernedVisionOperationalProjectionV1;
    const dispatchPublic = vi.fn(async ({ sealed }) => {
      const exposed = JSON.parse(sealed.canonical_projection);
      const content = JSON.parse(exposed.content);
      expect(content.PUBLIC_INSTRUCTION).toBe(GOVERNED_VISION_OPERATIONAL_REALIZATION_INSTRUCTION_V1);
      expect(content.GOVERNED_MEANING).toEqual(governed);
      expect(content).not.toHaveProperty("PUBLIC_CAPABILITIES");
      return advisory('{"version":1,"answer":"PlannerAgent observes a bounded shortage."}');
    });
    const adapter = createGovernedVisionOperationalRealizationAdapterV1({ dispatchPublic }, route);
    const raw = await adapter.realize(Object.freeze({ version: 1, current_user_message: "What do you observe?", governed_meaning: governed, voice_profile: createPlannerAgentVoiceProfileV1(), required_output_contract: "REALIZATION_ENVELOPE_V1" }));
    expect(parseRealizationEnvelopeV1(raw)).toEqual({ version: 1, answer: "PlannerAgent observes a bounded shortage." });
    expect(dispatchPublic).toHaveBeenCalledOnce();
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
