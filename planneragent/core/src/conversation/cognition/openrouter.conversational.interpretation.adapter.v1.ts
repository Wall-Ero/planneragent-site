import { createConversationalProviderDescriptorV1, parseConversationalInterpretationResultV1, type ConversationalInterpretationProviderV1, type ConversationalInterpretationResultV1, type ConversationalProviderDescriptorV1, type SealedConversationalInterpretationRequestV1 } from "./conversational.cognition.contracts.v1";
import { canonicalizeConversationalInterpretationProviderResultV1, CONVERSATIONAL_INTERPRETATION_PROVIDER_INSTRUCTION_V1, CONVERSATIONAL_INTERPRETATION_STRUCTURED_SCHEMA_V1 } from "./conversational.interpretation.provider.protocol.v1";

export type OpenRouterConversationalInterpretationFailureCodeV1 = "CONFIGURATION_UNAVAILABLE" | "QUALIFICATION_MODEL_NOT_PINNED" | "PROVIDER_FAILURE" | "PROVIDER_IDENTITY_MISMATCH" | "PROVIDER_RESPONSE_INVALID";
export class OpenRouterConversationalInterpretationErrorV1 extends Error {
  constructor(readonly code: OpenRouterConversationalInterpretationFailureCodeV1) { super(code); this.name = "OpenRouterConversationalInterpretationErrorV1"; }
}

export type OpenRouterConversationalInterpretationEvidenceV1 = Readonly<{
  version: 1;
  requested_model: string;
  returned_model: string;
  returned_provider?: string;
  adapter_id: "openrouter-chat-completions-conversational-interpretation";
  adapter_version: "1";
}>;

export type OpenRouterConversationalInterpretationConfigurationV1 = Readonly<{
  api_key: string;
  model: string;
  fetch?: typeof fetch;
  on_evidence?: (evidence: OpenRouterConversationalInterpretationEvidenceV1) => void;
}>;

const pinnedModel = (value: string) => value.length > 0 && value !== "openrouter/free" && value !== "openrouter/auto";

export class OpenRouterConversationalInterpretationAdapterV1 implements ConversationalInterpretationProviderV1 {
  readonly descriptor: ConversationalProviderDescriptorV1;
  private readonly fetcher: typeof fetch;
  private readonly model: string;

  constructor(private readonly configuration: OpenRouterConversationalInterpretationConfigurationV1) {
    this.model = configuration.model.trim();
    if (!configuration.api_key.trim() || !this.model) throw new OpenRouterConversationalInterpretationErrorV1("CONFIGURATION_UNAVAILABLE");
    if (!pinnedModel(this.model)) throw new OpenRouterConversationalInterpretationErrorV1("QUALIFICATION_MODEL_NOT_PINNED");
    this.fetcher = configuration.fetch ?? ((...args) => globalThis.fetch(...args));
    this.descriptor = createConversationalProviderDescriptorV1({ version: 1, provider_id: "openrouter", adapter_id: "openrouter-chat-completions-conversational-interpretation", adapter_version: "1", model_id: this.model, model_version: "PINNED_CONFIGURED_MODEL_IDENTIFIER", capabilities: ["INTERPRETATION"], deployment_class: "SHARED_REMOTE_PROVIDER", retention_privacy_class: "DATA_COLLECTION_DENIED_PROVIDER_POLICY_UNQUALIFIED" });
  }

  async interpret(input: SealedConversationalInterpretationRequestV1): Promise<ConversationalInterpretationResultV1> {
    const body = JSON.stringify({
      model: this.model,
      messages: [{ role: "system", content: CONVERSATIONAL_INTERPRETATION_PROVIDER_INSTRUCTION_V1 }, { role: "user", content: JSON.stringify(input) }],
      response_format: { type: "json_schema", json_schema: { name: "planneragent_conversational_interpretation_v1", strict: true, schema: CONVERSATIONAL_INTERPRETATION_STRUCTURED_SCHEMA_V1 } },
      provider: { require_parameters: true, data_collection: "deny" },
      tools: [],
      temperature: 0,
    });
    let response: Response;
    try { response = await this.fetcher("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${this.configuration.api_key}`, "Content-Type": "application/json" }, body }); }
    catch { throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_FAILURE"); }
    if (!response.ok) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_FAILURE");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID"); }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    const root = payload as Record<string, unknown>, returnedModel = root.model;
    if (typeof returnedModel !== "string" || returnedModel !== this.model) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_IDENTITY_MISMATCH");
    if (!Array.isArray(root.choices) || root.choices.length !== 1) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    const choice = root.choices[0];
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    const message = (choice as Record<string, unknown>).message;
    if (!message || typeof message !== "object" || Array.isArray(message)) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    const content = (message as Record<string, unknown>).content;
    if (typeof content !== "string" || content.length === 0) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    let providerResult: unknown;
    try { providerResult = JSON.parse(content); } catch { throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID"); }
    const result = parseConversationalInterpretationResultV1(canonicalizeConversationalInterpretationProviderResultV1(providerResult));
    if (!result) throw new OpenRouterConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    const returnedProvider = typeof root.provider === "string" && root.provider.trim() ? root.provider : undefined;
    this.configuration.on_evidence?.(Object.freeze({ version: 1, requested_model: this.model, returned_model: returnedModel, ...(returnedProvider ? { returned_provider: returnedProvider } : {}), adapter_id: "openrouter-chat-completions-conversational-interpretation", adapter_version: "1" }));
    return result;
  }
}
