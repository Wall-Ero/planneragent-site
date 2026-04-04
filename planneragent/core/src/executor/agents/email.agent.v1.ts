// PATH: core/src/executor/agents/email.agent.v1.ts
// ======================================================
// PlannerAgent — Email Agent (Resend)
// ======================================================

import type { ExecutionAgent } from "../../execution/execution.agent.registry.v1";
import { sendEmailWithResend } from "../providers/email.resend";
import { generateAuditRef } from "../executor.audit";

// ------------------------------------------------------

export const EmailAgent: ExecutionAgent = {
  id: "EMAIL_AGENT",

  capabilities: ["notify_supplier"],

  priority: 100,

  async execute({ intent, env }) {

    const payload = intent.payload as any;

    if (!env?.RESEND_API_KEY) {
      throw new Error("MISSING_RESEND_API_KEY");
    }

    const auditRef = generateAuditRef();

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
      apiKey: env.RESEND_API_KEY as string,
      to,
      subject,
      html,
    });

    return {
      ok: true,
      audit_ref: auditRef, // ✅ FIX QUI
      executed_at: new Date().toISOString(),

      details: {
        provider: "resend",
        message_id: result.id,
        raw: result,
      },
    };
  },
};