export const ANONYMOUS_VISION_CONVERSATION_MESSAGE_MAX_LENGTH_V1 = 1_200;
export const ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1 = 700;

// Same-origin transport metadata only; the V1 JSON schemas remain unchanged.
export const PUBLIC_CONVERSATION_ID_HEADER_V1 = "X-PA-Conversation-Id";
export const PUBLIC_CONVERSATION_CONTEXT_HEADER_V1 = "X-PA-Conversation-Context";
export const PUBLIC_CONVERSATION_ID_PATTERN_V1 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PUBLIC_CONVERSATION_CONTEXT_PATTERN_V1 = /^[0-9a-f]{64}$/;
export type PublicConversationContinuityMetadataV1 = Readonly<{ conversation_id: string; context_ref?: string; invalid_context?: true }>;

export type AnonymousVisionConversationRequestV1 = Readonly<{
  version: 1;
  request_id: string;
  message: string;
}>;

export type AnonymousVisionConversationResponseV1 = Readonly<{
  version: 1;
  request_id: string;
  text: string;
  posture: "PUBLIC_PRODUCT_ANSWER" | "REGISTRATION_REQUIRED" | "PROTECTED_INFORMATION" | "EXECUTION_UNAVAILABLE";
}>;

export type AnonymousVisionConversationFailureV1 = Readonly<{
  version: 1;
  request_id: string;
  error: "REQUEST_NOT_ADMITTED" | "RATE_LIMITED" | "SERVICE_UNAVAILABLE";
}>;
