import type { AnonymousVisionConversationFailureV1, AnonymousVisionConversationResponseV1 } from "../core/src/conversation/anonymous.vision.conversation.contracts.v1";
import { PUBLIC_CONVERSATION_ID_HEADER_V1, PUBLIC_CONVERSATION_CONTEXT_HEADER_V1, PUBLIC_CONVERSATION_CONTEXT_PATTERN_V1 } from "../core/src/conversation/anonymous.vision.conversation.contracts.v1";

export type AnonymousConversationClientResultV1 =
  | Readonly<{ status: "RESPONSE"; response: AnonymousVisionConversationResponseV1 }>
  | Readonly<{ status: "FAILURE"; failure?: AnonymousVisionConversationFailureV1 }>
  | Readonly<{ status: "ABORTED" | "STALE" }>;

export class AnonymousConversationClientV1 {
  private active?: Readonly<{ requestId: string; controller: AbortController }>;
  private conversationId = crypto.randomUUID();
  private continuityRef?: string;
  constructor(private readonly fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init)) {}
  get generating() { return this.active !== undefined; }
  stop(): void { const active = this.active; this.active = undefined; active?.controller.abort(); if (active) this.resetContinuity(); }
  private resetContinuity(): void { this.continuityRef = undefined; this.conversationId = crypto.randomUUID(); }
  reset(): void { this.stop(); this.resetContinuity(); }
  async send(message: string): Promise<AnonymousConversationClientResultV1> {
    const text = message.trim();
    if (!text) return { status: "FAILURE" };
    this.stop();
    const requestId = crypto.randomUUID(), controller = new AbortController();
    this.active = Object.freeze({ requestId, controller });
    try {
      const response = await this.fetcher("/conversation", { method: "POST", mode: "same-origin", redirect: "error", headers: { "content-type": "application/json", [PUBLIC_CONVERSATION_ID_HEADER_V1]: this.conversationId, ...(this.continuityRef ? { [PUBLIC_CONVERSATION_CONTEXT_HEADER_V1]: this.continuityRef } : {}) }, body: JSON.stringify({ version: 1, request_id: requestId, message: text }), signal: controller.signal });
      const body = await response.json() as AnonymousVisionConversationResponseV1 | AnonymousVisionConversationFailureV1;
      if (this.active?.requestId !== requestId) return { status: "STALE" };
      if (!body || typeof body !== "object" || !response.ok || "error" in body) { this.resetContinuity(); return { status: "FAILURE", ...(body && typeof body === "object" && "error" in body ? { failure: body } : {}) }; }
      if (body.version !== 1 || body.request_id !== requestId || typeof body.text !== "string" || !body.text.trim()) { this.resetContinuity(); return { status: "FAILURE" }; }
      const ref = response.headers.get(PUBLIC_CONVERSATION_CONTEXT_HEADER_V1);
      this.continuityRef = ref && PUBLIC_CONVERSATION_CONTEXT_PATTERN_V1.test(ref) ? ref : undefined;
      return { status: "RESPONSE", response: body };
    } catch (error) {
      if (controller.signal.aborted) return { status: "ABORTED" };
      if (this.active?.requestId !== requestId) return { status: "STALE" };
      this.resetContinuity();
      return { status: "FAILURE" };
    } finally {
      if (this.active?.requestId === requestId) this.active = undefined;
    }
  }
}
