import { describe, expect, it, vi } from "vitest";
import { AnonymousConversationClientV1 } from "../../../../ui/conversation.client";
import { PUBLIC_CONVERSATION_ID_HEADER_V1 as ID, PUBLIC_CONVERSATION_CONTEXT_HEADER_V1 as CONTEXT } from "../anonymous.vision.conversation.contracts.v1";

const response = (requestId: string, text: string) => new Response(JSON.stringify({ version: 1, request_id: requestId, text, posture: "PUBLIC_PRODUCT_ANSWER" }), { status: 200, headers: { "content-type": "application/json" } });

describe("ANONYMOUS-CONVERSATION-CLIENT-V1", () => {
  it("invokes the default browser fetch through globalThis at call time", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async function (this: typeof globalThis, _url: string | URL | Request, init?: RequestInit) { expect(this).toBe(globalThis); const body = JSON.parse(String(init?.body)); return response(body.request_id, "Default fetch answer"); });
    try {
      const result = await new AnonymousConversationClientV1().send("What can you do?");
      expect(fetcher).toHaveBeenCalledWith("/conversation", expect.objectContaining({ method: "POST" }));
      expect(result).toMatchObject({ status: "RESPONSE", response: { text: "Default fetch answer" } });
    } finally {
      fetcher.mockRestore();
    }
  });

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

describe("STEP13S isolated opaque client continuity", () => {
  const reply = (requestId: string, ref?: string) => {
    const result = response(requestId, "Qualified public answer");
    if (ref !== undefined) result.headers.set(CONTEXT, ref);
    return result;
  };
  it("returns the issued opaque reference only on the next same-origin request, with unchanged JSON", async () => {
    const calls: Array<{ body: Record<string, unknown>; headers: Headers; init: RequestInit }> = [];
    const client = new AnonymousConversationClientV1(vi.fn(async (url, init) => {
      expect(url).toBe("/conversation");
      const body = JSON.parse(String(init?.body)); calls.push({ body, headers: new Headers(init?.headers), init: init! });
      return reply(body.request_id, calls.length === 1 ? "a".repeat(64) : undefined);
    }) as typeof fetch);
    await client.send("Which domains does PlannerAgent support?"); await client.send("Explain the third one."); await client.send("Explain the third one.");
    expect(calls[0].headers.get(ID)).toMatch(/^[0-9a-f-]{36}$/); expect(calls[0].headers.has(CONTEXT)).toBe(false);
    expect(calls[1].headers.get(ID)).toBe(calls[0].headers.get(ID)); expect(calls[1].headers.get(CONTEXT)).toBe("a".repeat(64));
    expect(calls[2].headers.has(CONTEXT)).toBe(false);
    for (const call of calls) {
      expect(Object.keys(call.body).sort()).toEqual(["message", "request_id", "version"]);
      expect(call.init.mode).toBe("same-origin"); expect(call.init.redirect).toBe("error");
    }
  });

  it("does not share a conversation identifier or context across client instances", async () => {
    const headers: Headers[] = [];
    const fetcher = vi.fn(async (_url, init) => { headers.push(new Headers(init?.headers)); return reply(JSON.parse(String(init?.body)).request_id, "a".repeat(64)); }) as typeof fetch;
    const a = new AnonymousConversationClientV1(fetcher), b = new AnonymousConversationClientV1(fetcher);
    await a.send("Which domains does PlannerAgent support?"); await b.send("Explain the third one.");
    expect(headers[0].get(ID)).not.toBe(headers[1].get(ID)); expect(headers[1].has(CONTEXT)).toBe(false);
  });

  it.each(["", "short", "A".repeat(64), "a".repeat(65)])("never retains malformed context header %s", async ref => {
    const headers: Headers[] = [];
    const client = new AnonymousConversationClientV1(vi.fn(async (_url, init) => {
      headers.push(new Headers(init?.headers)); return reply(JSON.parse(String(init?.body)).request_id, ref);
    }) as typeof fetch);
    await client.send("Which domains does PlannerAgent support?"); await client.send("Explain the third one.");
    expect(headers[1].has(CONTEXT)).toBe(false);
  });

  it.each(["stop", "reset"])("%s clears context and ignores a delayed answer", async action => {
    const calls: Array<{ body: { request_id: string }; headers: Headers }> = [];
    let release!: () => void;
    const client = new AnonymousConversationClientV1(vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)); calls.push({ body, headers: new Headers(init?.headers) });
      if (calls.length === 2) return new Promise<Response>(resolve => { release = () => resolve(reply(body.request_id, "b".repeat(64))); });
      return reply(body.request_id, calls.length === 1 ? "a".repeat(64) : undefined);
    }) as typeof fetch);
    await client.send("Which domains does PlannerAgent support?"); const pending = client.send("Explain the third one.");
    if (action === "stop") client.stop(); else client.reset();
    release(); expect(await pending).toEqual({ status: "STALE" });
    await client.send("Explain the third one.");
    expect(calls[2].headers.has(CONTEXT)).toBe(false); expect(calls[2].headers.get(ID)).not.toBe(calls[0].headers.get(ID));
  });

  it("cannot replace a newer accepted reference with a stale response", async () => {
    const headers: Headers[] = []; let release!: () => void;
    const client = new AnonymousConversationClientV1(vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)); headers.push(new Headers(init?.headers));
      if (headers.length === 1) return new Promise<Response>(resolve => { release = () => resolve(reply(body.request_id, "a".repeat(64))); });
      return reply(body.request_id, headers.length === 2 ? "b".repeat(64) : undefined);
    }) as typeof fetch);
    const old = client.send("Which domains does PlannerAgent support?"); client.stop();
    await client.send("Which domains does PlannerAgent support?"); release(); expect(await old).toEqual({ status: "STALE" });
    await client.send("Explain the third one."); expect(headers[2].get(CONTEXT)).toBe("b".repeat(64));
  });

  it.each(["correlation", "http", "transport", "invalid-json", "null-body"])("discards context after %s failure", async fault => {
    const headers: Headers[] = [];
    const client = new AnonymousConversationClientV1(vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)); headers.push(new Headers(init?.headers));
      if (headers.length === 2) {
        if (fault === "transport") throw new TypeError("offline transport failure");
        if (fault === "invalid-json") return new Response("{");
        if (fault === "null-body") return Response.json(null);
        if (fault === "http") return new Response("{}", { status: 503 });
        return reply("wrong-request-id", "b".repeat(64));
      }
      return reply(body.request_id, headers.length === 1 ? "a".repeat(64) : undefined);
    }) as typeof fetch);
    await client.send("Which domains does PlannerAgent support?"); expect(await client.send("What is VISION?")).toMatchObject({ status: "FAILURE" });
    await client.send("Explain the third one.");
    expect(headers[2].has(CONTEXT)).toBe(false); expect(headers[2].get(ID)).not.toBe(headers[0].get(ID));
  });
});
