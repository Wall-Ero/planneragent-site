// core/src/notifications/templates.ts
// =====================================================
// P7.4 — Notifications Templates (Canonical)
// Deterministic · Audit-friendly · No side effects
// =====================================================

export type NotificationChannel = "whatsapp" | "email";

export type NotificationTemplateId =
  | "TRIAL_STARTED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_CANCELED"
  | "OPEN_SRL_TRIGGERED";

export type TemplateVars = Record<string, string | number | boolean | null | undefined>;

export type RenderedTemplate = {
  subject: string;
  body: string;
};

function mustStr(v: unknown, key: string): string {
  if (typeof v === "string" && v.trim().length > 0) return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  throw new Error(`TEMPLATE_VAR_MISSING_OR_INVALID: ${key}`);
}

export function renderTemplate(
  template: NotificationTemplateId,
  vars: TemplateVars
): RenderedTemplate {
  switch (template) {
    case "TRIAL_STARTED": {
      const plan = mustStr(vars.plan, "plan");
      const days = mustStr(vars.trial_days, "trial_days");
      return {
        subject: `PlannerAgent — Trial attivato (${plan})`,
        body: `Trial attivato per piano ${plan}.\nDurata: ${days} giorni.\n\nSe vuoi, rispondi con: APPROVA per autorizzare la prima esecuzione (JUNIOR).`
      };
    }

    case "PAYMENT_SUCCEEDED": {
      const plan = mustStr(vars.plan, "plan");
      const ref = mustStr(vars.external_ref, "external_ref");
      return {
        subject: `PlannerAgent — Pagamento riuscito (${plan})`,
        body: `Pagamento riuscito.\nPiano: ${plan}\nRiferimento: ${ref}\n`
      };
    }

    case "PAYMENT_FAILED": {
      const plan = mustStr(vars.plan, "plan");
      const ref = mustStr(vars.external_ref, "external_ref");
      return {
        subject: `PlannerAgent — Pagamento fallito (${plan})`,
        body: `Pagamento fallito.\nPiano: ${plan}\nRiferimento: ${ref}\n`
      };
    }

    case "SUBSCRIPTION_CANCELED": {
      const plan = mustStr(vars.plan, "plan");
      const ref = mustStr(vars.external_ref, "external_ref");
      return {
        subject: `PlannerAgent — Abbonamento cancellato (${plan})`,
        body: `Abbonamento cancellato.\nPiano: ${plan}\nRiferimento: ${ref}\n`
      };
    }

    case "OPEN_SRL_TRIGGERED": {
      return {
        subject: "PlannerAgent — Governance: SRL da aprire",
        body:
          "Condizioni governance OK per apertura SRL.\n" +
          "Azione richiesta: avvio procedura legale (notaio/commercialista) e switch configurazione runtime (PRE_SRL=false, SRL_ACTIVE=true)."
      };
    }

    default: {
      // Exhaustiveness
      const _x: never = template;
      return _x;
    }
  }
}