import type { RealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import type { PlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";

export const CONVERSATIONAL_CAPABILITIES_V1 = Object.freeze(["INTERPRETATION", "REALIZATION"] as const);
export type ConversationalCapabilityV1 = (typeof CONVERSATIONAL_CAPABILITIES_V1)[number];

export type ConversationalProviderDescriptorV1 = Readonly<{
  version: 1;
  provider_id: string;
  adapter_id: string;
  adapter_version: string;
  model_id: string;
  model_version: string;
  capabilities: readonly ConversationalCapabilityV1[];
  deployment_class: string;
  retention_privacy_class: string;
}>;

export function createConversationalProviderDescriptorV1(input: ConversationalProviderDescriptorV1): ConversationalProviderDescriptorV1 {
  const text = [input.provider_id, input.adapter_id, input.adapter_version, input.model_id, input.model_version, input.deployment_class, input.retention_privacy_class];
  if (input.version !== 1 || text.some((value) => typeof value !== "string" || value.trim().length === 0)) throw new TypeError("INVALID_CONVERSATIONAL_PROVIDER_DESCRIPTOR");
  if (!Array.isArray(input.capabilities) || input.capabilities.length === 0 || new Set(input.capabilities).size !== input.capabilities.length || input.capabilities.some((value) => !CONVERSATIONAL_CAPABILITIES_V1.includes(value))) throw new TypeError("INVALID_CONVERSATIONAL_PROVIDER_DESCRIPTOR");
  return Object.freeze({ ...input, capabilities: Object.freeze([...input.capabilities]) });
}

export const CONVERSATIONAL_INTERACTIONS_V1 = Object.freeze([
  "AUDIENCE_DECLARATION", "PRODUCT_QUESTION", "OPERATIONAL_DESCRIPTION", "CONVERSATIONAL_CONTINUITY", "DATA_INTRODUCTION",
  "EXECUTION_REQUEST", "PROTECTED_DISCLOSURE", "UNRELATED", "AMBIGUOUS",
] as const);
export type ConversationalInteractionV1 = (typeof CONVERSATIONAL_INTERACTIONS_V1)[number];

export const CONVERSATIONAL_PRODUCT_FOCUSES_V1 = Object.freeze(["GENERAL_CAPABILITIES", "TIER", "DOMAIN", "LIMITATION", "GETTING_STARTED"] as const);
export type ConversationalProductFocusV1 = (typeof CONVERSATIONAL_PRODUCT_FOCUSES_V1)[number];
export type ConversationalInterpretationResolutionV1 = "CLEAR" | "AMBIGUOUS" | "UNSUPPORTED";

export const CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1 = Object.freeze({
  interpretation_only: true,
  requester_content_non_authoritative: true,
  grants_authority: false,
  grants_execution: false,
} as const);

export type SealedConversationalInterpretationRequestV1 = Readonly<{
  version: 1;
  raw_user_message: string;
  allowed_interactions: typeof CONVERSATIONAL_INTERACTIONS_V1;
  invariants: typeof CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1;
  required_result_contract: "CONVERSATIONAL_INTERPRETATION_RESULT_V1";
}>;

export function sealConversationalInterpretationRequestV1(rawUserMessage: string): SealedConversationalInterpretationRequestV1 {
  if (typeof rawUserMessage !== "string" || rawUserMessage.length === 0) throw new TypeError("INVALID_CONVERSATIONAL_INTERPRETATION_REQUEST");
  return Object.freeze({
    version: 1,
    raw_user_message: rawUserMessage,
    allowed_interactions: CONVERSATIONAL_INTERACTIONS_V1,
    invariants: CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1,
    required_result_contract: "CONVERSATIONAL_INTERPRETATION_RESULT_V1",
  });
}

export type ConversationalInterpretationResultV1 = Readonly<{
  version: 1;
  interaction: ConversationalInteractionV1;
  product_focus?: ConversationalProductFocusV1;
  audience_declaration?: Readonly<{ declared_role: string }>;
  resolution: ConversationalInterpretationResolutionV1;
  interpretation_only: true;
  requester_content_non_authoritative: true;
  grants_authority: false;
  grants_execution: false;
}>;

const RESULT_KEYS = Object.freeze(["audience_declaration", "grants_authority", "grants_execution", "interaction", "interpretation_only", "product_focus", "requester_content_non_authoritative", "resolution", "version"] as const);
const isExactObject = (value: unknown, allowedKeys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => allowedKeys.includes(key));

export function parseConversationalInterpretationResultV1(value: unknown): ConversationalInterpretationResultV1 | undefined {
  if (!isExactObject(value, RESULT_KEYS)) return undefined;
  if (value.version !== 1 || !CONVERSATIONAL_INTERACTIONS_V1.includes(value.interaction as ConversationalInteractionV1)) return undefined;
  if (value.resolution !== "CLEAR" && value.resolution !== "AMBIGUOUS" && value.resolution !== "UNSUPPORTED") return undefined;
  if (value.interpretation_only !== true || value.requester_content_non_authoritative !== true || value.grants_authority !== false || value.grants_execution !== false) return undefined;
  if ((value.interaction === "AMBIGUOUS") !== (value.resolution === "AMBIGUOUS")) return undefined;

  const hasProductFocus = Object.hasOwn(value, "product_focus");
  if (hasProductFocus && (!CONVERSATIONAL_PRODUCT_FOCUSES_V1.includes(value.product_focus as ConversationalProductFocusV1) || value.interaction !== "PRODUCT_QUESTION")) return undefined;

  const hasAudience = Object.hasOwn(value, "audience_declaration");
  if (hasAudience !== (value.interaction === "AUDIENCE_DECLARATION")) return undefined;
  if (hasAudience) {
    if (!isExactObject(value.audience_declaration, ["declared_role"])) return undefined;
    const role = value.audience_declaration.declared_role;
    if (typeof role !== "string" || role.length === 0 || role.length > 128 || role !== role.trim()) return undefined;
  }

  return Object.freeze({
    version: 1,
    interaction: value.interaction,
    ...(hasProductFocus ? { product_focus: value.product_focus as ConversationalProductFocusV1 } : {}),
    ...(hasAudience ? { audience_declaration: Object.freeze({ declared_role: (value.audience_declaration as Record<string, unknown>).declared_role as string }) } : {}),
    resolution: value.resolution,
    ...CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1,
  }) as ConversationalInterpretationResultV1;
}

export interface ConversationalInterpretationProviderV1 {
  readonly descriptor: ConversationalProviderDescriptorV1;
  interpret(input: SealedConversationalInterpretationRequestV1): Promise<ConversationalInterpretationResultV1>;
}

export type SealedConversationalRealizationRequestV1<TGovernedMeaning> = Readonly<{
  version: 1;
  current_user_message: string;
  governed_meaning: TGovernedMeaning;
  voice_profile: PlannerAgentVoiceProfileV1;
  required_output_contract: "REALIZATION_ENVELOPE_V1";
}>;

export interface ConversationalRealizationProviderV1<TGovernedMeaning = unknown> {
  readonly descriptor: ConversationalProviderDescriptorV1;
  realize(input: SealedConversationalRealizationRequestV1<TGovernedMeaning>): Promise<string>;
}

export type ConversationalRealizationEnvelopeV1 = RealizationEnvelopeV1;
