// core/src/scheduler/scheduler.jobs.ts
// ============================================
// P7.3 — Governance Scheduler Jobs (Canonical)
// Cloudflare-safe · Thin wrapper over runtime
// ============================================

import {
  runGovernanceScheduler,
  type GovernanceSchedulerResult,
  type GovernanceSchedulerInput,
  type LedgerEventLike
} from "./scheduler.runtime";

import { sendTwilioNotification, type TwilioEnv } from "../notifications/twilio.hook";

// NOTE: qui NON importiamo ledger finché non hai stabilizzato l’API.
// Lo aggancerai passando writeLedgerEvent dal worker/scheduled handler.

export type SchedulerEnv = TwilioEnv & {
  // opzionale: numero founder/admin
  NOTIFY_TO?: string;
};

export async function runGovernanceSchedulerJob(
  env: SchedulerEnv,
  input: Omit<GovernanceSchedulerInput, "notify" | "notify_to">
): Promise<GovernanceSchedulerResult> {
  return runGovernanceScheduler({
    ...input,
    notify_to: env.NOTIFY_TO,
    notify: async (payload) => {
      // Twilio best-effort (già safe)
      await sendTwilioNotification(env, payload);
    }
  });
}

// Minimal default entrypoint for manual calls/tests.
// In produzione la scheduled() del worker passerà open_srl_input reale.
export async function runGovernanceSchedulerJobNow(
  env: SchedulerEnv,
  open_srl_input: any
): Promise<GovernanceSchedulerResult> {
  return runGovernanceSchedulerJob(env, {
    now_iso: new Date().toISOString(),
    open_srl_input: open_srl_input as any
  });
}