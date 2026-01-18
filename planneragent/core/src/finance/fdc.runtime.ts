// planneragent/core/src/finance/fdc.runtime.ts

import type { FinancialDecisionCommitV1 } from "../../../contracts/finance/fdc.types";
import { fdvValidateV1 } from "./fdv.runtime";

export interface D1Database {
  prepare(query: string): { bind(...args: any[]): { first<T>(): Promise<T | null>; run(): Promise<any> } };
}

export interface FdcWriteResult {
  ok: true;
  commit: FinancialDecisionCommitV1;
  reused: boolean; // true if returned by idempotency
}

function stableJson(obj: unknown): string {
  // minimal stable stringify (enough for hashing)
  return JSON.stringify(obj, Object.keys(obj as any).sort());
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function fdcAppendV1(db: D1Database, input: FinancialDecisionCommitV1): Promise<FdcWriteResult> {
  // 1) validate via FDV
  const v = fdvValidateV1(input);
  if (!v.allow_commit) {
    throw new Error(`FDV_REJECTED:${v.reasons.join(",")}`);
  }

  // 2) idempotency check (companyId + idempotencyKey)
  const existing = await db.prepare(
    `SELECT fdc_id as fdcId FROM fdc_commits WHERE company_id=? AND idempotency_key=? LIMIT 1`
  ).bind(input.companyId, input.idempotencyKey).first<{ fdcId: string }>();

  if (existing?.fdcId) {
    // Return “reused” without re-writing (caller can fetch full record if needed)
    return { ok: true, commit: input, reused: true };
  }

  // 3) chain: fetch last commit id + chain_hash for this company
  const last = await db.prepare(
    `SELECT fdc_id as fdcId, chain_hash as chainHash
     FROM fdc_commits WHERE company_id=? ORDER BY generated_at DESC LIMIT 1`
  ).bind(input.companyId).first<{ fdcId: string; chainHash: string }>();

  const previousFdcId = last?.fdcId ?? null;
  const previousChainHash = last?.chainHash ?? "GENESIS";

  // 4) compute chain_hash (ledger chaining)
  const payloadForChain = {
    companyId: input.companyId,
    fdcId: input.fdcId,
    generatedAt: input.generatedAt,
    decisionRef: input.decisionRef,
    financialIntent: input.financialIntent,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    scope: input.scope,
    trace: input.trace,
    signatures: input.signatures,
    previousFdcId,
    previousChainHash
  };

  const chainHash = await sha256Hex(stableJson(payloadForChain));

  // 5) insert append-only
  await db.prepare(
    `INSERT INTO fdc_commits (
      fdc_id, company_id, generated_at,
      decision_id, decision_layer,
      financial_intent, budget_owner, budget_limit, approval_mode,
      amount, currency, status,
      purpose, constraints_json,
      ord_status, fdg_policy_version, dlci_version,
      system_signature, human_signature,
      previous_fdc_id, chain_hash,
      idempotency_key, request_id, actor_user_id,
      notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    input.fdcId,
    input.companyId,
    input.generatedAt,

    input.decisionRef.decisionId,
    input.decisionRef.decisionLayer,

    input.financialIntent,
    input.budgetAuthority.owner,
    input.budgetAuthority.limit,
    input.budgetAuthority.approvalMode,

    input.amount,
    input.currency,
    input.status,

    input.scope.purpose,
    JSON.stringify(input.scope.constraints ?? []),

    input.trace.ordStatus,
    input.trace.fdgPolicyVersion,
    input.trace.dlciVersion ?? null,

    input.signatures.system,
    input.signatures.human,

    previousFdcId,
    chainHash,

    input.idempotencyKey,
    input.requestId ?? null,
    input.actorUserId ?? null,

    input.audit?.notes ?? null
  ).run();

  return {
    ok: true,
    commit: {
      ...input,
      audit: {
        ...(input.audit ?? {}),
        previousFdcId: previousFdcId ?? undefined
      }
    },
    reused: false
  };
}
