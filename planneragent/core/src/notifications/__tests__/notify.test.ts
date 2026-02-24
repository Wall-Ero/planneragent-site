// core/src/notifications/__tests__/notify.test.ts
// =====================================================
// P7.4 — Notifications Dispatcher Tests (Canonical)
// Verifies:
// - whatsapp success
// - fallback email when whatsapp fails
// - template rendering errors are surfaced deterministically
// =====================================================

import { describe, it, expect } from "vitest";
import { createNotifier } from "../notify";

describe("P7.4 — notify dispatcher", () => {
  it("succeeds on whatsapp primary", async () => {
    const notify = createNotifier({
      sendWhatsApp: async (_env, _input) => ({ ok: true }),
      sendEmail: async () => ({ ok: false, reason: "SHOULD_NOT_BE_CALLED" })
    });

    const res = await notify(
      {},
      {
        channel: "whatsapp",
        to: "+391111111111",
        template: "TRIAL_STARTED",
        vars: { plan: "JUNIOR", trial_days: 30 }
      }
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.primary.channel).toBe("whatsapp");
      expect(res.rendered.body.length).toBeGreaterThan(0);
    }
  });

  it("falls back to email if whatsapp fails", async () => {
    let emailCalled = 0;

    const notify = createNotifier({
      sendWhatsApp: async () => ({ ok: false, reason: "TWILIO_HTTP_ERROR" }),
      sendEmail: async () => {
        emailCalled += 1;
        return { ok: true };
      }
    });

    const res = await notify(
      { EMAIL_WEBHOOK_URL: "https://example.test" },
      {
        channel: "whatsapp",
        to: "+392222222222",
        template: "OPEN_SRL_TRIGGERED",
        vars: {},
        fallback: { email_to: "founder@example.com" }
      }
    );

    expect(emailCalled).toBe(1);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.fallback?.channel).toBe("email");
    }
  });

  it("fails deterministically on missing template vars", async () => {
    const notify = createNotifier({
      sendWhatsApp: async () => ({ ok: true }),
      sendEmail: async () => ({ ok: true })
    });

    const res = await notify(
      {},
      {
        channel: "email",
        to: "x@y.com",
        template: "TRIAL_STARTED",
        vars: { plan: "JUNIOR" } // missing trial_days
      }
    );

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.primary.reason.startsWith("TEMPLATE_VAR_MISSING_OR_INVALID")).toBe(true);
    }
  });
});