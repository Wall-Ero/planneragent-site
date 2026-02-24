// core/src/market/trial.engine.ts
// =====================================================
// P7.3 — Trial Engine (Canonical)
// Deterministic · Cloudflare-safe · No provider deps
// =====================================================

import type { PlanTier } from "../sandbox/contracts.v2";
import { quotePricingForPlanTier, type PricingContext } from "./offers";

export type TrialStatus = Readonly<{
  plan: PlanTier;
  trial_days: number;
  trial_started_at_utc: string;
  trial_ends_at_utc: string;
  is_trial_active: boolean;
  days_remaining: number;
}>;

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function daysBetweenFloor(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function computeTrialStatus(input: {
  plan: PlanTier;
  trial_started_at_utc: string;
  now_utc?: string;
  pricing_ctx?: PricingContext;
}): TrialStatus {
  const now = input.now_utc ?? new Date().toISOString();

  const pricing = quotePricingForPlanTier(input.plan, {
    ...(input.pricing_ctx ?? {}),
    now_utc: now,
  });

  // If not purchasable/available, trial is effectively 0.
  const trialDays = pricing?.trial_days ?? 0;

  const ends = addDaysIso(input.trial_started_at_utc, trialDays);

  const active = trialDays > 0 && Date.parse(now) < Date.parse(ends);

  const elapsedDays = Math.max(0, daysBetweenFloor(input.trial_started_at_utc, now));
  const remaining = Math.max(0, trialDays - elapsedDays);

  return {
    plan: input.plan,
    trial_days: trialDays,
    trial_started_at_utc: input.trial_started_at_utc,
    trial_ends_at_utc: ends,
    is_trial_active: active,
    days_remaining: remaining,
  };
}