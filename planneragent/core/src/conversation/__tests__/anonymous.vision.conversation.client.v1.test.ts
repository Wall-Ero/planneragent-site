import { describe, expect, it, vi } from "vitest";
import { AnonymousConversationClientV1 } from "../../../../ui/conversation.client";

const response = (requestId: string, text: string) => new Response(JSON.stringify({ version: 1, request_id: requestId, text, posture: "PUBLIC_PRODUCT_ANSWER" }), { status: 200, headers: { "content-type": "application/json" } });

describe("ANONYMOUS-CONVERSATION-CLIENT-V1", () => {
  it("sends one canonical request to /conversation and returns its response", async () => {
    const fetcher = vi.fn(async (_url: unknown, init?: RequestInit) => { const body = JSON.parse(String(init?.body)); return response(body.request_id, "PlannerAgent answer"); });
    const client = new AnonymousConversationClientV1(fetcher as any), result = await client.send("  What can you do?  ");
    expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher.mock.calls[0]?.[0]).toBe("/conversation");
    expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({ version: 1, message: "What can you do?" });
    expect(String(fetcher.mock.calls[0]?.[0])).not.toContain("sandbox");
    expect(result).toMatchObject({ status: "RESPONSE", response: { text: "PlannerAgent answer" } });
  });

  it("truthfully aborts the active client request", async () => {
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn((_url: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => { signal = init?.signal ?? undefined; signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))); }));
    const client = new AnonymousConversationClientV1(fetcher as any), pending = client.send("What can PlannerAgent do?");
    expect(client.generating).toBe(true); client.stop(); expect(signal?.aborted).toBe(true); expect(client.generating).toBe(false); expect(await pending).toEqual({ status: "ABORTED" });
  });

  it("prevents an aborted older response from becoming current", async () => {
    let resolveFirst!: (response: Response) => void;
    const fetcher = vi.fn((_url: unknown, init?: RequestInit) => { const body = JSON.parse(String(init?.body)); if (fetcher.mock.calls.length === 1) return new Promise<Response>((resolve) => { resolveFirst = resolve; }); return Promise.resolve(response(body.request_id, "new")); });
    const client = new AnonymousConversationClientV1(fetcher as any), first = client.send("What is VISION?");
    client.stop(); const second = client.send("What is SENIOR?");
    resolveFirst(response(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)).request_id, "old"));
    expect(await first).toEqual({ status: "STALE" }); expect(await second).toMatchObject({ status: "RESPONSE", response: { text: "new" } });
  });

  it("returns bounded failure without fabricating text", async () => {
    const client = new AnonymousConversationClientV1(vi.fn(async () => new Response(JSON.stringify({ version: 1, request_id: "x", error: "SERVICE_UNAVAILABLE" }), { status: 503 })) as any);
    expect(await client.send("What can PlannerAgent do?")).toMatchObject({ status: "FAILURE" });
  });
});
