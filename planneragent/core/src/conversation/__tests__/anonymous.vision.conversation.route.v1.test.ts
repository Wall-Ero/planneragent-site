import { describe, expect, it, vi } from "vitest";
import type { AnonymousVisionConversationFailureV1, AnonymousVisionConversationResponseV1 } from "../anonymous.vision.conversation.contracts.v1";
import { anonymousVisionConversationRouteV1 } from "../anonymous.vision.conversation.route.v1";
import * as clarification from "../anonymous.vision.conversation.clarification.v1";

const request = (body: unknown, headers: HeadersInit = {}) => new Request("https://core.test/conversation", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
// Keep these hosted-adapter cases outside the deterministic GENERAL_CAPABILITIES grammar.
const valid = { version: 1, request_id: "request-1", message: "What is VISION?" };

describe("ANONYMOUS-VISION-CONVERSATION-ROUTE-V1", () => {
  it("invokes default fetch through globalThis for the free OpenRouter conversation", async () => {
    const calls: Array<{ receiver: unknown; url: unknown; init?: RequestInit }> = [];
    const globalFetch = vi.fn(function (this: unknown, url: unknown, init?: RequestInit) {
      calls.push({ receiver: this, url, init });
      return Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ version: 1, answer: "Public answer" }) } }] }), { status: 200 }));
    });
    vi.stubGlobal("fetch", globalFetch);
    try {
      const response = await anonymousVisionConversationRouteV1(request(valid), { OPENROUTER_API_KEY: "secret" });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ version: 1, request_id: "request-1", text: "Public answer", posture: "PUBLIC_PRODUCT_ANSWER" });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.receiver).toBe(globalThis);
      expect(calls[0]?.url).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(JSON.parse(String(calls[0]?.init?.body)).model).toBe("openrouter/free");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("preserves an injected fetcher", async () => {
    const globalFetch = vi.fn();
    const injectedFetch = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ version: 1, answer: "Injected answer" }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", globalFetch);
    try {
      const response = await anonymousVisionConversationRouteV1(request({ ...valid, request_id: "request-injected" }), { OPENROUTER_API_KEY: "secret" }, { fetch: injectedFetch as any });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ posture: "PUBLIC_PRODUCT_ANSWER", text: "Injected answer" });
      expect(injectedFetch).toHaveBeenCalledOnce();
      expect(globalFetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("passes a valid anonymous request and trusted edge client key to the runtime", async () => {
    const run = vi.fn(async () => ({ version: 1, request_id: "request-1", text: "Public answer", posture: "PUBLIC_PRODUCT_ANSWER" }) as AnonymousVisionConversationResponseV1);
    const response = await anonymousVisionConversationRouteV1(request(valid, { "cf-connecting-ip": "203.0.113.8" }), { OPENROUTER_API_KEY: "secret" }, { run: run as any });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 1, request_id: "request-1", text: "Public answer", posture: "PUBLIC_PRODUCT_ANSWER" });
    expect(run).toHaveBeenCalledWith(expect.objectContaining({ request: valid, client_key: "203.0.113.8", api_key: "secret" }));
    expect(JSON.stringify(await run.mock.results[0]?.value)).not.toMatch(/transport|evidence|projection|system prompt|secret/i);
  });

  it("requires no authentication or organizational fields", async () => {
    const run = vi.fn(async () => ({ version: 1, request_id: "request-1", text: "Public answer", posture: "PUBLIC_PRODUCT_ANSWER" }) as AnonymousVisionConversationResponseV1);
    await anonymousVisionConversationRouteV1(request(valid), { OPENROUTER_API_KEY: "secret" }, { run: run as any });
    const runtimeInput = (run.mock.calls as unknown as Array<[Record<string, unknown>]>)[0]?.[0];
    for (const field of ["auth", "session", "company_id", "tenant_id", "actor_id", "attention", "baseline"]) expect(runtimeInput).not.toHaveProperty(field);
  });

  it.each([
    ["REQUEST_NOT_ADMITTED", 400],
    ["RATE_LIMITED", 429],
    ["SERVICE_UNAVAILABLE", 503],
  ] as const)("maps %s to a bounded status", async (error, status) => {
    const run = vi.fn(async () => ({ version: 1, request_id: "request-1", error }) as AnonymousVisionConversationFailureV1);
    const response = await anonymousVisionConversationRouteV1(request(valid), {}, { run: run as any });
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ version: 1, request_id: "request-1", error });
  });

  it("rejects malformed JSON and non-POST methods before runtime", async () => {
    const run = vi.fn();
    const malformed = await anonymousVisionConversationRouteV1(new Request("https://core.test/conversation", { method: "POST", body: "{" }), {}, { run: run as any });
    const method = await anonymousVisionConversationRouteV1(new Request("https://core.test/conversation"), {}, { run: run as any });
    expect(malformed.status).toBe(400); expect(method.status).toBe(405); expect(run).not.toHaveBeenCalled();
  });

  it.each([
    { version: 1, request_id: "request-1", text: "Register before introducing data.", posture: "REGISTRATION_REQUIRED" },
    { version: 1, request_id: "request-1", text: "Protected details are unavailable.", posture: "PROTECTED_INFORMATION" },
  ] as const)("preserves canonical non-provider posture $posture", async (result) => {
    const response = await anonymousVisionConversationRouteV1(request(valid), {}, { run: vi.fn(async () => result) as any });
    expect(await response.json()).toEqual(result);
  });
});

describe("STEP13R-C real clarification route", () => {
  const messages = ["Can it execute actions?", "Explain those domains.", "And the third one?",
    "Which of those are publicly available?", "What changed since my previous message?",
    "Can it do that?", "And the second one?", "What should I do now?", "Do that."];
  it.each(messages)("returns HTTP 200 with the unchanged correlated envelope for %s", async message => {
    const fetcher = vi.fn(), id = `route-clarify-${messages.indexOf(message)}`;
    const response = await anonymousVisionConversationRouteV1(request({ version: 1, request_id: id, message }, { "cf-connecting-ip": id }), {}, { fetch: fetcher });
    expect(response.status).toBe(200); expect(response.headers.get("content-type")).toBe("application/json");
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["posture", "request_id", "text", "version"]);
    expect(body).toMatchObject({ version: 1, request_id: id, posture: "PUBLIC_PRODUCT_ANSWER", text: expect.stringContaining("?") });
    expect(body.text).toContain("VISION is observation-only and cannot execute actions.");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns a correlated HTTP 429 after three clarifications in the existing burst window", async () => {
    const fetcher = vi.fn();
    for (let i = 0; i < 4; i++) {
      const id = `route-limited-${i}`;
      const response = await anonymousVisionConversationRouteV1(request({ version: 1, request_id: id, message: "Do that." }, { "cf-connecting-ip": "step13rc-route-rate" }), {}, { fetch: fetcher });
      expect(response.status).toBe(i < 3 ? 200 : 429);
      if (i === 3) expect(await response.json()).toEqual({ version: 1, request_id: id, error: "RATE_LIMITED" });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(["plan", "renderer"])("maps a real %s failure to correlated HTTP 503 with no hosted fallback", async stage => {
    const method = stage === "plan" ? "createAnonymousVisionClarificationPlanV1" : "renderAnonymousVisionClarificationV1";
    vi.spyOn(clarification, method).mockImplementationOnce(() => { throw new Error("PRIVATE_ROUTE_FAILURE"); });
    const fetcher = vi.fn(), id = `route-failure-${stage}`;
    try {
      const response = await anonymousVisionConversationRouteV1(request({ version: 1, request_id: id, message: "Do that." }, { "cf-connecting-ip": id }), {}, { fetch: fetcher });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ version: 1, request_id: id, error: "SERVICE_UNAVAILABLE" });
      expect(fetcher).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); }
  });

  it.each([
    { ...valid, message: "Do that.", history: ["invented previous turn"] },
    { ...valid, message: "Do that.", authority: true },
    { ...valid, message: "Do that.", version: 2 },
    { ...valid, message: "Write a poem about the moon" },
  ])("retains HTTP 400 for malformed or unrelated requests: %j", async body => {
    const fetcher = vi.fn();
    const response = await anonymousVisionConversationRouteV1(request(body), {}, { fetch: fetcher });
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: "REQUEST_NOT_ADMITTED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
