import type { AnonymousVisionConversationFailureV1, AnonymousVisionConversationResponseV1 } from "../core/src/conversation/anonymous.vision.conversation.contracts.v1";

export type AnonymousConversationClientResultV1 =
  | Readonly<{ status: "RESPONSE"; response: AnonymousVisionConversationResponseV1 }>
  | Readonly<{ status: "FAILURE"; failure?: AnonymousVisionConversationFailureV1 }>
  | Readonly<{ status: "ABORTED" | "STALE" }>;

export class AnonymousConversationClientV1 {
  private active?: Readonly<{ requestId: string; controller: AbortController }>;
  constructor(private readonly fetcher: typeof fetch = (input, init) => globalThis.fetch(input, init)) {}
  get generating() { return this.active !== undefined; }
  stop(): void { const active = this.active; this.active = undefined; active?.controller.abort(); }
  async send(message: string): Promise<AnonymousConversationClientResultV1> {
    const text = message.trim();
    if (!text) return { status: "FAILURE" };
    this.stop();
    const requestId = crypto.randomUUID(), controller = new AbortController();
    this.active = Object.freeze({ requestId, controller });
    try {
      const response = await this.fetcher("/conversation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ version: 1, request_id: requestId, message: text }), signal: controller.signal });
      const body = await response.json() as AnonymousVisionConversationResponseV1 | AnonymousVisionConversationFailureV1;
      if (this.active?.requestId !== requestId) return { status: "STALE" };
      if (!response.ok || "error" in body) return { status: "FAILURE", ...(body && "error" in body ? { failure: body } : {}) };
      if (body.version !== 1 || body.request_id !== requestId || typeof body.text !== "string" || !body.text.trim()) return { status: "FAILURE" };
      return { status: "RESPONSE", response: body };
    } catch (error) {
      if (controller.signal.aborted) return { status: "ABORTED" };
      return { status: "FAILURE" };
    } finally {
      if (this.active?.requestId === requestId) this.active = undefined;
    }
  }
}
