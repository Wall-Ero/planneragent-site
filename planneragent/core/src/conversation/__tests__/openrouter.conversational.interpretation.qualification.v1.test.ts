import { describe, expect, it, vi } from "vitest";
import { runAnonymousVisionConversationV1 } from "../anonymous.vision.conversation.runtime.v1";
import { AnonymousVisionConversationRateGuardV1 } from "../anonymous.vision.conversation.rate.v1";
import { CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1, sealConversationalInterpretationRequestV1 } from "../cognition/conversational.cognition.contracts.v1";
import { CONVERSATIONAL_INTERPRETATION_STRUCTURED_SCHEMA_V1 } from "../cognition/conversational.interpretation.provider.protocol.v1";
import { OpenRouterConversationalInterpretationAdapterV1, OpenRouterConversationalInterpretationErrorV1 } from "../cognition/openrouter.conversational.interpretation.adapter.v1";
import { CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1 } from "../evaluation/conversational.interpretation.gold.corpus.v1";
import { ConversationalInterpretationShadowEvaluatorV1 } from "../evaluation/conversational.interpretation.shadow.evaluator.v1";

const invariant = CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1;
const result = (changes: Record<string, unknown> = {}) => ({ version: 1, interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES", audience_declaration: null, resolution: "CLEAR", ...invariant, ...changes });
const response = (value: unknown, changes: Record<string, unknown> = {}) => new Response(JSON.stringify({ model: "vendor/pinned-model", provider: "provider-a", choices: [{ message: { content: typeof value === "string" ? value : JSON.stringify(value) } }], ...changes }), { status: 200 });
const adapter = (value: unknown) => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response(value));
  const evidence = vi.fn();
  return { provider: new OpenRouterConversationalInterpretationAdapterV1({ api_key: "secret", model: "vendor/pinned-model", fetch: fetcher as any, on_evidence: evidence }), fetcher, evidence };
};

describe("OPENROUTER-CONVERSATIONAL-INTERPRETATION-QUALIFICATION-V1", () => {
  it("implements INTERPRETATION only and isolates the pinned structured OpenRouter wire request", async () => {
    const { provider, fetcher, evidence } = adapter(result());
    const request = sealConversationalInterpretationRequestV1("What ca you dot?");
    const interpreted = await provider.interpret(request);
    expect(provider.descriptor).toMatchObject({ provider_id: "openrouter", model_id: "vendor/pinned-model", capabilities: ["INTERPRETATION"] });
    expect(provider.descriptor.capabilities).not.toContain("REALIZATION");
    const [url, init] = fetcher.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(body).toMatchObject({ model: "vendor/pinned-model", temperature: 0, tools: [], provider: { require_parameters: true, data_collection: "deny" }, response_format: { type: "json_schema", json_schema: { strict: true, schema: CONVERSATIONAL_INTERPRETATION_STRUCTURED_SCHEMA_V1 } } });
    expect(JSON.parse(body.messages[1].content).raw_user_message).toBe("What ca you dot?");
    expect(interpreted).toEqual({ version: 1, interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES", resolution: "CLEAR", ...invariant });
    expect(interpreted).not.toHaveProperty("provider");
    expect(evidence).toHaveBeenCalledWith({ version: 1, requested_model: "vendor/pinned-model", returned_model: "vendor/pinned-model", returned_provider: "provider-a", adapter_id: "openrouter-chat-completions-conversational-interpretation", adapter_version: "1" });
  });

  it.each(["", "openrouter/free", " openrouter/free ", "openrouter/auto"])("rejects unavailable or unpinned qualification model: %s", (model) => {
    expect(() => new OpenRouterConversationalInterpretationAdapterV1({ api_key: "key", model })).toThrowError(OpenRouterConversationalInterpretationErrorV1);
  });

  it.each([
    ["malformed output", "not-json"],
    ["authority grant", result({ grants_authority: true })],
    ["execution grant", result({ grants_execution: true })],
    ["unknown field", { ...result(), provider_id: "openrouter" }],
  ])("fails closed on %s", async (_label, providerResult) => {
    await expect(adapter(providerResult).provider.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
  });

  it("fails closed on returned model substitution, non-2xx, and multiple choices", async () => {
    const substituted = new OpenRouterConversationalInterpretationAdapterV1({ api_key: "key", model: "vendor/pinned-model", fetch: vi.fn(async () => response(result(), { model: "other/model" })) as any });
    await expect(substituted.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_IDENTITY_MISMATCH" });
    const failed = new OpenRouterConversationalInterpretationAdapterV1({ api_key: "key", model: "vendor/pinned-model", fetch: vi.fn(async () => new Response("denied", { status: 500 })) as any });
    await expect(failed.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_FAILURE" });
    const multiple = new OpenRouterConversationalInterpretationAdapterV1({ api_key: "key", model: "vendor/pinned-model", fetch: vi.fn(async () => response(result(), { choices: [{ message: { content: "{}" } }, { message: { content: "{}" } }] })) as any });
    await expect(multiple.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
  });

  it("injects into the existing provider-neutral evaluator without altering the gold corpus", async () => {
    const fixture = CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.find((value) => value.input_id === "product-ca-dot")!;
    const observation = await new ConversationalInterpretationShadowEvaluatorV1(adapter(result()).provider).evaluate(fixture);
    expect(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1).toHaveLength(39);
    expect(observation).toMatchObject({ cognitive_result: { interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES" }, comparison: "COGNITIVE_COVERAGE_GAIN", risk: "NONE" });
  });

  it("has no active conversation runtime call site", async () => {
    const openRouterInterpretationFetch = vi.fn();
    new OpenRouterConversationalInterpretationAdapterV1({ api_key: "key", model: "vendor/pinned-model", fetch: openRouterInterpretationFetch as any });
    const runtimeFetch = vi.fn();
    const runtimeResult = await runAnonymousVisionConversationV1({ request: { version: 1, request_id: "runtime-isolation", message: "Are you ready?" }, client_key: "client", api_key: "key", fetch: runtimeFetch as any, rate_guard: new AnonymousVisionConversationRateGuardV1() });
    expect(runtimeResult).toMatchObject({ posture: "PUBLIC_PRODUCT_ANSWER" });
    expect(openRouterInterpretationFetch).not.toHaveBeenCalled();
    expect(runtimeFetch).not.toHaveBeenCalled();
  });
});
