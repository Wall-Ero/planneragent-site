import { describe, expect, it, vi } from "vitest";
import type { AnonymousVisionConversationFailureV1, AnonymousVisionConversationResponseV1 } from "../anonymous.vision.conversation.contracts.v1";
import { anonymousVisionConversationRouteV1 } from "../anonymous.vision.conversation.route.v1";

const request = (body: unknown, headers: HeadersInit = {}) => new Request("https://core.test/conversation", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const valid = { version: 1, request_id: "request-1", message: "What can PlannerAgent do?" };

describe("ANONYMOUS-VISION-CONVERSATION-ROUTE-V1", () => {
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
