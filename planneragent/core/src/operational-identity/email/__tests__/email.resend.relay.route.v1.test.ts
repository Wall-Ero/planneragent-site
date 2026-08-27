import { describe, expect, it, vi } from "vitest";
import type { Env } from "../../../types/env";
import { emailResendRelayRouteV1 } from "../email.resend.relay.route.v1";

const env = { EMAIL_WEBHOOK_TOKEN: "relay-secret", RESEND_API_KEY: "resend-secret", EMAIL_FROM: "PlannerAgent <identity@example.com>" } as Env;
const request = (body: unknown, token = "relay-secret") => new Request("https://planneragent.test/internal/email/relay", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
const payload = { to: "Person@EXAMPLE.COM", from: env.EMAIL_FROM!, subject: "Verify", body: "Code <123> & keep\nprivate" };

describe("protected Resend email relay v1", () => {
  it("authenticates, validates, escapes, and hands off once to the existing provider boundary", async () => {
    const send = vi.fn(async () => ({ id: "message-1" }));
    const response = await emailResendRelayRouteV1(request(payload), env, send);
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ version: 1, status: "MESSAGE_ACCEPTED_FOR_DELIVERY" });
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({ apiKey: "resend-secret", to: "Person@example.com", from: env.EMAIL_FROM, subject: "Verify", html: "Code &lt;123&gt; &amp; keep<br>private" });
  });
  it("rejects missing, malformed, and wrong bearer credentials", async () => {
    const send = vi.fn();
    for (const authorization of [undefined, "relay-secret", "Bearer wrong"]) {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (authorization) headers.authorization = authorization;
      const response = await emailResendRelayRouteV1(new Request("https://planneragent.test/internal/email/relay", { method: "POST", headers, body: JSON.stringify(payload) }), env, send);
      expect(response.status).toBe(401);
    }
    expect(send).not.toHaveBeenCalled();
  });
  it("fails closed when relay token, Resend key, or configured sender is absent", async () => {
    const send = vi.fn();
    expect((await emailResendRelayRouteV1(request(payload), { ...env, EMAIL_WEBHOOK_TOKEN: undefined }, send)).status).toBe(503);
    expect((await emailResendRelayRouteV1(request(payload), { ...env, RESEND_API_KEY: undefined }, send)).status).toBe(503);
    expect((await emailResendRelayRouteV1(request(payload), { ...env, EMAIL_FROM: undefined }, send)).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects sender override, unexpected fields, malformed recipients, and unbounded values", async () => {
    const send = vi.fn();
    const cases = [{ ...payload, from: "attacker@example.com" }, { ...payload, principal_id: "principal-attacker" }, { ...payload, to: "invalid" }, { ...payload, subject: "x".repeat(201) }];
    for (const body of cases) expect((await emailResendRelayRouteV1(request(body), env, send)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
  it("maps provider failure to a safe response without identity semantics or webhook recursion", async () => {
    const send = vi.fn(async () => { throw new Error("provider body with sensitive internals"); });
    const response = await emailResendRelayRouteV1(request(payload), env, send);
    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).toBe('{"version":1,"error":"DELIVERY_FAILED"}');
    expect(text).not.toMatch(/principal|session|registered|provider body|resend-secret|relay-secret/i);
    expect(send).toHaveBeenCalledOnce();
  });
});
