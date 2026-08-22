import { ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1, ANONYMOUS_VISION_CONVERSATION_MESSAGE_MAX_LENGTH_V1 } from "./anonymous.vision.conversation.contracts.v1";

export class AnonymousVisionConversationRateGuardV1 {
  private readonly buckets = new Map<string, number[]>();
  admit(input: Readonly<{ client_key: string; message_length: number; max_output_tokens: number; now_ms?: number }>): boolean {
    if (!input.client_key || input.client_key.length > 256 || input.message_length < 1 || input.message_length > ANONYMOUS_VISION_CONVERSATION_MESSAGE_MAX_LENGTH_V1 || input.max_output_tokens > ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1) return false;
    const now = input.now_ms ?? Date.now(), hits = (this.buckets.get(input.client_key) ?? []).filter((at) => now - at <= 60_000);
    if (hits.length >= 10 || hits.filter((at) => now - at <= 5_000).length >= 3) return false;
    hits.push(now); this.buckets.set(input.client_key, hits); return true;
  }
}
