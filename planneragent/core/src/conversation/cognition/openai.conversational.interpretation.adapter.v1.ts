import {
  createConversationalProviderDescriptorV1,
  parseConversationalInterpretationResultV1,
  type ConversationalInterpretationProviderV1,
  type ConversationalInterpretationResultV1,
  type ConversationalProviderDescriptorV1,
  type SealedConversationalInterpretationRequestV1,
} from "./conversational.cognition.contracts.v1";
import { canonicalizeConversationalInterpretationProviderResultV1, CONVERSATIONAL_INTERPRETATION_PROVIDER_INSTRUCTION_V1, CONVERSATIONAL_INTERPRETATION_STRUCTURED_SCHEMA_V1 } from "./conversational.interpretation.provider.protocol.v1";

export const OPENAI_CONVERSATIONAL_INTERPRETATION_INSTRUCTION_V1 = CONVERSATIONAL_INTERPRETATION_PROVIDER_INSTRUCTION_V1;
export const OPENAI_CONVERSATIONAL_INTERPRETATION_SCHEMA_V1 = CONVERSATIONAL_INTERPRETATION_STRUCTURED_SCHEMA_V1;

export type OpenAIConversationalInterpretationFailureCodeV1 = "CONFIGURATION_UNAVAILABLE" | "PROVIDER_FAILURE" | "PROVIDER_RESPONSE_INVALID";
export class OpenAIConversationalInterpretationErrorV1 extends Error {
  constructor(readonly code: OpenAIConversationalInterpretationFailureCodeV1) { super(code); this.name = "OpenAIConversationalInterpretationErrorV1"; }
}

export type OpenAIConversationalInterpretationConfigurationV1 = Readonly<{
  api_key: string;
  model: string;
  model_version?: string;
  fetch?: typeof fetch;
}>;

const responseText = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const response = value as Record<string, unknown>;
  if (response.status !== "completed" || !Array.isArray(response.output)) return undefined;
  const textItems = response.output.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const message = item as Record<string, unknown>;
    if (message.type !== "message" || !Array.isArray(message.content)) return [];
    return message.content.filter((part) => part && typeof part === "object" && !Array.isArray(part) && (part as Record<string, unknown>).type === "output_text").map((part) => (part as Record<string, unknown>).text);
  });
  return textItems.length === 1 && typeof textItems[0] === "string" && textItems[0].length > 0 ? textItems[0] : undefined;
};

export class OpenAIConversationalInterpretationAdapterV1 implements ConversationalInterpretationProviderV1 {
  readonly descriptor: ConversationalProviderDescriptorV1;
  private readonly fetcher: typeof fetch;

  constructor(private readonly configuration: OpenAIConversationalInterpretationConfigurationV1) {
    if (!configuration.api_key.trim() || !configuration.model.trim()) throw new OpenAIConversationalInterpretationErrorV1("CONFIGURATION_UNAVAILABLE");
    this.fetcher = configuration.fetch ?? ((...args) => globalThis.fetch(...args));
    this.descriptor = createConversationalProviderDescriptorV1({
      version: 1,
      provider_id: "openai",
      adapter_id: "openai-responses-conversational-interpretation",
      adapter_version: "1",
      model_id: configuration.model,
      model_version: configuration.model_version?.trim() || "CONFIGURED_MODEL_IDENTIFIER",
      capabilities: ["INTERPRETATION"],
      deployment_class: "SHARED_REMOTE_PROVIDER",
      retention_privacy_class: "STORE_DISABLED_PROVIDER_POLICY_UNQUALIFIED",
    });
  }

  async interpret(input: SealedConversationalInterpretationRequestV1): Promise<ConversationalInterpretationResultV1> {
    const body = JSON.stringify({
      model: this.configuration.model,
      store: false,
      instructions: OPENAI_CONVERSATIONAL_INTERPRETATION_INSTRUCTION_V1,
      input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(input) }] }],
      text: { format: { type: "json_schema", name: "planneragent_conversational_interpretation_v1", strict: true, schema: OPENAI_CONVERSATIONAL_INTERPRETATION_SCHEMA_V1 } },
      tools: [],
    });
    let response: Response;
    try {
      response = await this.fetcher("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${this.configuration.api_key}`, "Content-Type": "application/json" }, body });
    } catch { throw new OpenAIConversationalInterpretationErrorV1("PROVIDER_FAILURE"); }
    if (!response.ok) throw new OpenAIConversationalInterpretationErrorV1("PROVIDER_FAILURE");
    let parsedResponse: unknown;
    try { parsedResponse = await response.json(); } catch { throw new OpenAIConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID"); }
    const text = responseText(parsedResponse);
    if (!text) throw new OpenAIConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    let providerResult: unknown;
    try { providerResult = JSON.parse(text); } catch { throw new OpenAIConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID"); }
    const canonicalResult = canonicalizeConversationalInterpretationProviderResultV1(providerResult);
    const result = parseConversationalInterpretationResultV1(canonicalResult);
    if (!result) throw new OpenAIConversationalInterpretationErrorV1("PROVIDER_RESPONSE_INVALID");
    return result;
  }
}
