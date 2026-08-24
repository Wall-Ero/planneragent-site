import type { CognitiveProviderV1, PublicCognitiveAdvisoryResponseV1, SealedPublicCognitiveExposureV1 } from "../../governance/knowledge-exposure/transport";
import { sealPublicCognitiveExposureV1 } from "../../governance/knowledge-exposure/transport";
import type { PlannerAgentPublicCapabilityProjectionV1 } from "../planneragent.public.capabilities.v1";
import { PLANNERAGENT_PUBLIC_CONVERSATION_INSTRUCTION_V1 } from "../anonymous.vision.conversation.policy.v1";
import {
  createConversationalProviderDescriptorV1,
  type ConversationalProviderDescriptorV1,
  type ConversationalRealizationProviderV1,
  type SealedConversationalRealizationRequestV1,
} from "./conversational.cognition.contracts.v1";

export type CurrentPublicRealizationRouteV1 = Readonly<{
  request_id: string;
  consumption_id: string;
  provider: CognitiveProviderV1;
  model: string;
  api_key: string;
  max_tokens: number;
  temperature: number;
}>;

export interface PublicCognitiveRealizationTransportV1 {
  dispatchPublic(input: Readonly<{
    sealed: SealedPublicCognitiveExposureV1;
    provider: CognitiveProviderV1;
    model: string;
    api_key: string;
    max_tokens?: number;
    temperature?: number;
  }>): Promise<PublicCognitiveAdvisoryResponseV1>;
}

export class CognitiveTransportConversationalRealizationAdapterV1 implements ConversationalRealizationProviderV1<PlannerAgentPublicCapabilityProjectionV1> {
  readonly descriptor: ConversationalProviderDescriptorV1;

  constructor(private readonly transport: PublicCognitiveRealizationTransportV1, private readonly route: CurrentPublicRealizationRouteV1) {
    this.descriptor = createConversationalProviderDescriptorV1({
      version: 1,
      provider_id: route.provider,
      adapter_id: "cognitive-transport-public-realization",
      adapter_version: "1",
      model_id: route.model,
      model_version: "RUNTIME_SELECTED_UNVERSIONED",
      capabilities: ["REALIZATION"],
      deployment_class: "SHARED_REMOTE_PROVIDER",
      retention_privacy_class: "NO_RETENTION",
    });
  }

  async realize(input: SealedConversationalRealizationRequestV1<PlannerAgentPublicCapabilityProjectionV1>): Promise<string> {
    if (input.version !== 1 || input.required_output_contract !== "REALIZATION_ENVELOPE_V1") throw new TypeError("INVALID_CONVERSATIONAL_REALIZATION_REQUEST");
    const content = JSON.stringify({
      PUBLIC_INSTRUCTION: PLANNERAGENT_PUBLIC_CONVERSATION_INSTRUCTION_V1,
      PUBLIC_CAPABILITIES: input.governed_meaning,
      VOICE_PROFILE: input.voice_profile,
      USER_MESSAGE: input.current_user_message,
    });
    const sealed = sealPublicCognitiveExposureV1({
      version: 1,
      trust_domain: "PUBLIC",
      scope: "REQUEST_BOUND",
      organizational_status: "NON_ORGANIZATIONAL",
      retention: "NO_RETENTION",
      purpose: "PUBLIC_PRODUCT_CONVERSATION",
      request_id: this.route.request_id,
      consumption_id: this.route.consumption_id,
      provider: this.route.provider,
      model: this.route.model,
      projection: { classification: "PUBLIC_SAFE", content },
    });
    const result = await this.transport.dispatchPublic({
      sealed,
      provider: this.route.provider,
      model: this.route.model,
      api_key: this.route.api_key,
      max_tokens: this.route.max_tokens,
      temperature: this.route.temperature,
    });
    return result.text;
  }
}
