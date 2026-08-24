import { describe, expect, it, vi } from "vitest";
import { runAnonymousVisionConversationV1 } from "../anonymous.vision.conversation.runtime.v1";
import { AnonymousVisionConversationRateGuardV1 } from "../anonymous.vision.conversation.rate.v1";
import {
  OPENAI_CONVERSATIONAL_INTERPRETATION_SCHEMA_V1,
  OpenAIConversationalInterpretationAdapterV1,
  OpenAIConversationalInterpretationErrorV1,
} from "../cognition/openai.conversational.interpretation.adapter.v1";
import {
  CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1,
  createConversationalProviderDescriptorV1,
  sealConversationalInterpretationRequestV1,
  type ConversationalInterpretationProviderV1,
  type ConversationalInterpretationResultV1,
} from "../cognition/conversational.cognition.contracts.v1";
import { CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1 } from "../evaluation/conversational.interpretation.gold.corpus.v1";
import { calculateConversationalInterpretationShadowMetricsV1, ConversationalInterpretationShadowEvaluatorV1 } from "../evaluation/conversational.interpretation.shadow.evaluator.v1";

const invariant = CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1;
const result = (interaction: ConversationalInterpretationResultV1["interaction"], additions: Record<string, unknown> = {}) => ({
  version: 1, interaction, product_focus: null, audience_declaration: null, resolution: interaction === "AMBIGUOUS" ? "AMBIGUOUS" : interaction === "UNRELATED" ? "UNSUPPORTED" : "CLEAR", ...invariant, ...additions,
});
const openAIResponse = (value: unknown, changes: Record<string, unknown> = {}) => new Response(JSON.stringify({
  status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: typeof value === "string" ? value : JSON.stringify(value) }] }], ...changes,
}), { status: 200, headers: { "content-type": "application/json" } });
const adapter = (value: unknown) => {
  const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => openAIResponse(value));
  return { provider: new OpenAIConversationalInterpretationAdapterV1({ api_key: "secret", model: "reference-model", fetch: fetcher as any }), fetcher };
};

describe("OPENAI-CONVERSATIONAL-INTERPRETATION-SHADOW-V1", () => {
  it("declares only INTERPRETATION and keeps the Responses API wire contract adapter-local", async () => {
    const { provider, fetcher } = adapter(result("PRODUCT_QUESTION", { product_focus: "GENERAL_CAPABILITIES" }));
    const request = sealConversationalInterpretationRequestV1("What ca you dot?");
    await expect(provider.interpret(request)).resolves.toMatchObject({ interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES" });
    expect(provider.descriptor).toMatchObject({ provider_id: "openai", model_id: "reference-model", capabilities: ["INTERPRETATION"] });
    expect(provider.descriptor.capabilities).not.toContain("REALIZATION");
    const [url, init] = fetcher.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(body).toMatchObject({ model: "reference-model", store: false, tools: [], text: { format: { type: "json_schema", strict: true, schema: OPENAI_CONVERSATIONAL_INTERPRETATION_SCHEMA_V1 } } });
    expect(JSON.parse(body.input[0].content[0].text).raw_user_message).toBe("What ca you dot?");
    expect(JSON.stringify(body)).not.toMatch(/PUBLIC_CAPABILITIES|tenant|credential_reference|authority_proof/i);
  });

  it.each([
    ["Product", result("PRODUCT_QUESTION", { product_focus: "GENERAL_CAPABILITIES" }), "PRODUCT_QUESTION"],
    ["Audience", result("AUDIENCE_DECLARATION", { audience_declaration: { declared_role: "SCM" } }), "AUDIENCE_DECLARATION"],
    ["Operational", result("OPERATIONAL_DESCRIPTION"), "OPERATIONAL_DESCRIPTION"],
    ["Data", result("DATA_INTRODUCTION"), "DATA_INTRODUCTION"],
    ["Execution", result("EXECUTION_REQUEST"), "EXECUTION_REQUEST"],
    ["Protected", result("PROTECTED_DISCLOSURE"), "PROTECTED_DISCLOSURE"],
    ["Ambiguous", result("AMBIGUOUS"), "AMBIGUOUS"],
  ])("accepts strictly valid %s interpretation", async (_label, providerResult, interaction) => {
    await expect(adapter(providerResult).provider.interpret(sealConversationalInterpretationRequestV1("raw message"))).resolves.toMatchObject({ interaction });
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["authority grant", result("PRODUCT_QUESTION", { grants_authority: true })],
    ["execution grant", result("PRODUCT_QUESTION", { grants_execution: true })],
    ["unknown field", { ...result("PRODUCT_QUESTION"), provider_id: "openai" }],
    ["unknown taxonomy", result("PRODUCT_QUESTION", { interaction: "OTHER" })],
  ])("fails closed on %s", async (_label, providerResult) => {
    await expect(adapter(providerResult).provider.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
  });

  it("fails closed on incomplete, multiple-text, non-2xx, and unavailable configuration", async () => {
    const incomplete = new OpenAIConversationalInterpretationAdapterV1({ api_key: "key", model: "model", fetch: vi.fn(async () => openAIResponse(result("PRODUCT_QUESTION"), { status: "incomplete" })) as any });
    await expect(incomplete.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
    const multiple = new OpenAIConversationalInterpretationAdapterV1({ api_key: "key", model: "model", fetch: vi.fn(async () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "{}" }, { type: "output_text", text: "{}" }] }] }))) as any });
    await expect(multiple.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_RESPONSE_INVALID" });
    const failed = new OpenAIConversationalInterpretationAdapterV1({ api_key: "key", model: "model", fetch: vi.fn(async () => new Response("denied", { status: 500 })) as any });
    await expect(failed.interpret(sealConversationalInterpretationRequestV1("message"))).rejects.toMatchObject({ code: "PROVIDER_FAILURE" });
    expect(() => new OpenAIConversationalInterpretationAdapterV1({ api_key: "", model: "model" })).toThrowError(OpenAIConversationalInterpretationErrorV1);
  });

  it("evaluates the code-owned gold corpus and reports deterministic coverage gains without persistence", async () => {
    const byMessage = new Map(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.map((fixture) => [fixture.message, fixture]));
    const provider: ConversationalInterpretationProviderV1 = {
      descriptor: createConversationalProviderDescriptorV1({ version: 1, provider_id: "fake", adapter_id: "fake", adapter_version: "1", model_id: "fake", model_version: "1", capabilities: ["INTERPRETATION"], deployment_class: "TEST", retention_privacy_class: "TEST" }),
      interpret: async (request) => {
        const fixture = byMessage.get(request.raw_user_message)!;
        return Object.freeze({ version: 1, interaction: fixture.expected_interaction, ...(fixture.expected_product_focus ? { product_focus: fixture.expected_product_focus } : {}), ...(fixture.expects_audience_declaration ? { audience_declaration: Object.freeze({ declared_role: "user-declared role" }) } : {}), resolution: fixture.expected_resolution, ...invariant }) as ConversationalInterpretationResultV1;
      },
    };
    const evaluator = new ConversationalInterpretationShadowEvaluatorV1(provider);
    const observations = await Promise.all(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.map((fixture) => evaluator.evaluate(fixture)));
    const metrics = calculateConversationalInterpretationShadowMetricsV1(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1, observations);
    expect(metrics).toMatchObject({ total: 39, exact_interaction_accuracy: 1, hard_boundary_recall: 1, audience_declaration_recall: 1, product_question_accuracy: 1, operational_description_accuracy: 1, ambiguity_handling: 1, product_focus_accuracy: 1, high_risk_conflicts: 0, evaluation_failures: 0 });
    expect(observations.filter((value) => value.comparison === "COGNITIVE_COVERAGE_GAIN").map((value) => value.input_id)).toEqual(expect.arrayContaining(["audience-scm-manager", "audience-scm-typo", "audience-scm", "product-ca-dot"]));
    expect(Object.isFrozen(observations[0])).toBe(true);
    expect(Object.isFrozen(metrics)).toBe(true);
  });

  it("marks dangerous hard-boundary disagreement without changing routing", async () => {
    const provider: ConversationalInterpretationProviderV1 = { descriptor: adapter(result("PRODUCT_QUESTION")).provider.descriptor, interpret: async () => Object.freeze({ version: 1, interaction: "PRODUCT_QUESTION", resolution: "CLEAR", ...invariant }) };
    const fixture = CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.find((value) => value.input_id === "execution-reschedule")!;
    await expect(new ConversationalInterpretationShadowEvaluatorV1(provider).evaluate(fixture)).resolves.toMatchObject({ comparison: "CONFLICT", risk: "HIGH_RISK_CONFLICT" });
  });

  it("has no current runtime call site", async () => {
    const openAIFetch = vi.fn();
    new OpenAIConversationalInterpretationAdapterV1({ api_key: "key", model: "model", fetch: openAIFetch as any });
    const result = await runAnonymousVisionConversationV1({ request: { version: 1, request_id: "runtime-isolation", message: "Are you ready?" }, client_key: "client", api_key: "openrouter-key", fetch: vi.fn() as any, rate_guard: new AnonymousVisionConversationRateGuardV1() });
    expect(result).toMatchObject({ posture: "PUBLIC_PRODUCT_ANSWER" });
    expect(openAIFetch).not.toHaveBeenCalled();
  });
});
