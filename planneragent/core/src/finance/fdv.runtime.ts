// planneragent/core/src/finance/fdv.runtime.ts

import type { FinancialDecisionCommitV1 } from "../../../contracts/finance/fdc.types";

export type FdvHumanAction = "SIGN_AND_APPROVE" | "PROVIDE_BUDGET_OWNER" | "FIX_POLICY_LINK";

export interface FdvResultV1 {
  allow_commit: boolean;
  reasons: string[];
  required_human_action: FdvHumanAction | null;
  derived?: {
    status_next?: "COMMITTED" | "APPROVED";
    ledger_chain_required?: boolean;
  };
}

export function fdvValidateV1(input: FinancialDecisionCommitV1): FdvResultV1 {
  const reasons: string[] = [];

  if (!input.companyId) reasons.push("MISSING_COMPANY_ID");
  if (!input.idempotencyKey) reasons.push("MISSING_IDEMPOTENCY_KEY");
  if (!input.trace?.fdgPolicyVersion) reasons.push("MISSING_FDG_POLICY_VERSION");
  if (!input.signatures?.human) reasons.push("MISSING_HUMAN_SIGNATURE");

  if (typeof input.amount !== "number" || input.amount < 0) reasons.push("INVALID_AMOUNT");
  if (!/^[A-Z]{3}$/.test(input.currency || "")) reasons.push("INVALID_CURRENCY");

  // Budget rule (hard)
  if (input.amount > input.budgetAuthority.limit) reasons.push("BUDGET_LIMIT_EXCEEDED");

  // ORD gate for delegated layers
  if (["SENIOR", "SSC", "AGI"].includes(input.decisionRef.decisionLayer)) {
    if (input.trace.ordStatus !== "OPERATIONAL") reasons.push("ORD_NOT_OPERATIONAL");
  }

  // Decide required human action (single, most important)
  let required: FdvHumanAction | null = null;
  if (reasons.includes("MISSING_HUMAN_SIGNATURE")) required = "SIGN_AND_APPROVE";
  else if (reasons.includes("MISSING_FDG_POLICY_VERSION")) required = "FIX_POLICY_LINK";

  const allow = reasons.length === 0;

  return {
    allow_commit: allow,
    reasons,
    required_human_action: allow ? null : required,
    derived: allow
      ? { status_next: "COMMITTED", ledger_chain_required: true }
      : undefined
  };
}
