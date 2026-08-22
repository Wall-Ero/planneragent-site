export const ANONYMOUS_VISION_CONVERSATION_MESSAGE_MAX_LENGTH_V1 = 1_200;
export const ANONYMOUS_VISION_CONVERSATION_MAX_OUTPUT_TOKENS_V1 = 700;

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
