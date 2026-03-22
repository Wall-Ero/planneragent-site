// PATH: core/src/executor/executor.runtime.v1.ts
// ======================================================
// PlannerAgent — Executor Runtime V3 (REAL EXECUTION)
// ======================================================

import type { ExecutorRequest } from "../../../contracts/executor/executor.request";
import type { ExecutorResult } from "./executor.result";

import type { ExecutionIntent } from "../execution/execution.contracts.v1";

import { assertExecutorAuthority, assertExecutorScope } from "./executor.guard";
import { generateAuditRef } from "./executor.audit";

import { sendEmailWithResend } from "./providers/email.resend";

// ------------------------------------------------------
// ENV TYPE
// ------------------------------------------------------

type ExecutorEnv = {
  RESEND_API_KEY?: string;
};

// ------------------------------------------------------
// INTERNAL ADAPTER
// ------------------------------------------------------

function mapIntentToExecutorRequest(input: {
  intent: ExecutionIntent;
  tenantId: string;
  approver?: string;
}): ExecutorRequest {
  return {
    action: {
      kind: input.intent.action_kind,
      payload: input.intent.payload,
    },
    tenantId: input.tenantId,
    approver: input.approver,
  } as unknown as ExecutorRequest;
}

// ------------------------------------------------------
// RUN EXECUTOR (INTENT-BASED)
// ------------------------------------------------------

export async function runExecutor(input: {
  intent: ExecutionIntent;
  tenantId: string;
  approver?: string;
  env?: ExecutorEnv;
}): Promise<ExecutorResult> {

  try {
    const req = mapIntentToExecutorRequest(input);

    assertExecutorAuthority(req);
    assertExecutorScope(req);

    const auditRef = generateAuditRef();

    // --------------------------------------------------
    // 🔥 REAL EXECUTION SWITCH
    // --------------------------------------------------

    switch (input.intent.capability_id) {

      case "notify_supplier": {

        const payload = input.intent.payload as any;

        if (!input.env?.RESEND_API_KEY) {
          throw new Error("MISSING_RESEND_API_KEY");
        }

        const to = payload.email ?? "test@example.com";
        const sku = payload.sku ?? "UNKNOWN";
        const qty = payload.qty ?? 0;

        const subject = `Supply Alert — ${sku}`;
        const html = `
          <h3>Supply Alert</h3>
          <p>SKU: <b>${sku}</b></p>
          <p>Required Quantity: <b>${qty}</b></p>
          <p>Please confirm availability.</p>
        `;

        const result = await sendEmailWithResend({
          apiKey: input.env.RESEND_API_KEY,
          to,
          subject,
          html,
        });

        return {
          ok: true,
          audit_ref: auditRef,
          executed_at: new Date().toISOString(),
          details: result,
        };
      }

      case "adjust_production": {
        console.log("[EXECUTOR] adjust_production", input.intent.payload);

        return {
          ok: true,
          audit_ref: auditRef,
          executed_at: new Date().toISOString(),
        };
      }

      case "update_order": {
        console.log("[EXECUTOR] update_order", input.intent.payload);

        return {
          ok: true,
          audit_ref: auditRef,
          executed_at: new Date().toISOString(),
        };
      }

      default:
        throw new Error("UNKNOWN_EXECUTION_CAPABILITY");
    }

  } catch (err) {
    return {
      ok: false,
      reason: (err as Error).message,
    };
  }
}