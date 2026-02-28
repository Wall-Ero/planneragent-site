// core/src/commercial/__tests__/srl.governance.flow.test.ts
// =====================================================
// P7.5 — SRL governance flow (Canonical)
// Scheduler → SRL decision → Ledger → Notify (via worker.cron)
// =====================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// 1) Scheduler (decision)
import { runGovernanceScheduler } from "../../scheduler/scheduler.runtime";
import type { GovernanceSchedulerInput } from "../../scheduler/scheduler.types";

// 2) Worker CRON (notify)
import worker from "../../../src/worker";

// Ledger store (append-only)
import * as ledgerStore from "../../ledger/ledger.store";

// Twilio hook (WhatsApp)
import * as twilio from "../../notifications/twilio.hook";

// -----------------------------------------------------
// Mocks
// -----------------------------------------------------

vi.mock("../../ledger/ledger.store", async (orig) => {
  const actual = (await orig()) as any;
  return {
    ...actual,
    appendLedgerEvent: vi.fn(),
  };
});

vi.mock("../../notifications/twilio.hook", async (orig) => {
  const actual = (await orig()) as any;
  return {
    ...actual,
    sendTwilioNotification: vi.fn().mockResolvedValue({ ok: true }),
  };
});

// IMPORTANT: for worker test, we mock the scheduler return value
vi.mock("../../scheduler/scheduler.runtime", async (orig) => {
  const actual = (await orig()) as any;
  return {
    ...actual,
    runGovernanceScheduler: vi.fn(actual.runGovernanceScheduler),
  };
});

function makeCtx() {
  const ps: Promise<any>[] = [];
  const ctx = {
    waitUntil(p: Promise<any>) {
      ps.push(p);
    },
  } as unknown as ExecutionContext;

  return { ctx, flush: async () => Promise.all(ps) };
}

describe("P7.5 — SRL governance flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scheduler: triggers SRL decision and writes ledger event (no Twilio here)", async () => {
    const input: GovernanceSchedulerInput = {
      now_iso: "2026-03-15T12:00:00.000Z",

      // NOTE: this name must match scheduler.types.ts (latest)
      // If your type uses open_srl_input, rename this accordingly.
      srl_decision_input: {
        cash_available_eur: 12000,

        active_junior_accounts: 5,
        junior_continuity_months: 2,

        has_real_usage: true,

        operational_friction_high: true,

        governs_real_systems: true,
        orchestrates_external_ai: true,
        used_in_decisional_contexts: true,

        founder_wants_institution: true,
      },
    };

    const res = await runGovernanceScheduler(input);

    expect(res.action).toBe("OPEN_SRL_TRIGGERED");

    // ledger is written by scheduler/decision layer
    expect(ledgerStore.appendLedgerEvent).toHaveBeenCalledTimes(1);

    const ledgerEvent = vi.mocked(ledgerStore.appendLedgerEvent).mock.calls[0][0];
    expect(ledgerEvent.category).toBe("governance");
    expect(String(ledgerEvent.statement).toLowerCase()).toContain("srl");

    // notify is NOT done here (by design)
    expect(twilio.sendTwilioNotification).not.toHaveBeenCalled();
  });

  it("worker.cron: when scheduler returns OPEN_SRL_TRIGGERED it sends WhatsApp via Twilio", async () => {
    // Force scheduler outcome without depending on worker's internal zeros
    vi.mocked(runGovernanceScheduler as any).mockResolvedValueOnce({
      action: "OPEN_SRL_TRIGGERED",
    });

    const env = {
      SNAPSHOT_HMAC_SECRET: "test-secret",
      TWILIO_ACCOUNT_SID: "AC_TEST",
      TWILIO_AUTH_TOKEN: "TEST",
      TWILIO_FROM_NUMBER: "+10000000000",
      ENVIRONMENT: "test",
      VERSION: "test",
    };

    const { ctx, flush } = makeCtx();

    // scheduled() should call ctx.waitUntil(...)
    await worker.scheduled({} as ScheduledEvent, env as any, ctx);
    await flush();

    expect(twilio.sendTwilioNotification).toHaveBeenCalledTimes(1);

    const notifyArgs = vi.mocked(twilio.sendTwilioNotification).mock.calls[0][1];
    expect(String(notifyArgs.message).toLowerCase()).toContain("aprire");
    expect(String(notifyArgs.message).toLowerCase()).toContain("srl");
  });
});