import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendTwilioNotification } from "../twilio.hook";

describe("P7.2 — Twilio Notification Hook", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () =>
      new Response(null, { status: 201 })
    ) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends notification payload to Twilio API", async () => {
    const env = {
      TWILIO_ACCOUNT_SID: "AC_TEST",
      TWILIO_AUTH_TOKEN: "AUTH_TEST",
      TWILIO_FROM: "+10000000000"
    };

    const payload = {
      to: "+391234567890",
      message: "OPEN_SRL_THRESHOLD_REACHED"
    };

    const result = await sendTwilioNotification(env, payload);

    // comportamento canonico
    expect(result.ok).toBe(true);

    // fetch chiamata una sola volta
    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, options] = (fetch as any).mock.calls[0];

    // endpoint Twilio corretto
    expect(url).toContain("api.twilio.com");
    expect(options.method).toBe("POST");

    // body URL-encoded corretto
    const body = options.body as URLSearchParams;

    expect(body.get("From")).toBe(env.TWILIO_FROM);
    expect(body.get("To")).toBe(payload.to);
    expect(body.get("Body")).toBe(payload.message);
  });
});