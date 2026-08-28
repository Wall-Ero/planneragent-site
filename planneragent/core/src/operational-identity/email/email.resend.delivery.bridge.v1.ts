import { sendEmailWithResend, type ResendEmailRequest, type ResendEmailResponse } from "../../executor/providers/email.resend";
import type { Env } from "../../types/env";
import { normalizeEmailIdentityV1 } from "./email.normalization.v1";

export type ResendBridgeSenderV1 = (input: ResendEmailRequest) => Promise<ResendEmailResponse>;
export type ResendBridgeResultV1 = Readonly<{ ok: true; status: "MESSAGE_ACCEPTED_FOR_DELIVERY" } | { ok: false; reason: "DELIVERY_NOT_CONFIGURED" | "REQUEST_INVALID" | "DELIVERY_FAILED" }>;
const bounded = (value: unknown, maximum: number): value is string => typeof value === "string" && value.length > 0 && value.length <= maximum;
export const escapeEmailTextForHtmlV1 = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;").replace(/\r?\n/g, "<br>");

export async function deliverEmailViaResendBridgeV1(env: Pick<Env, "RESEND_API_KEY" | "EMAIL_FROM">, input: Readonly<{ to: unknown; subject: unknown; body: unknown }>, send: ResendBridgeSenderV1 = sendEmailWithResend): Promise<ResendBridgeResultV1> {
  if (!bounded(env.RESEND_API_KEY, 4096) || !bounded(env.EMAIL_FROM, 320)) return { ok: false, reason: "DELIVERY_NOT_CONFIGURED" };
  if (!bounded(input.subject, 200) || !bounded(input.body, 10_000)) return { ok: false, reason: "REQUEST_INVALID" };
  let to: string;
  try { to = normalizeEmailIdentityV1(input.to); } catch { return { ok: false, reason: "REQUEST_INVALID" }; }
  try {
    await send({ apiKey: env.RESEND_API_KEY, to, from: env.EMAIL_FROM, subject: input.subject, html: escapeEmailTextForHtmlV1(input.body) });
    return { ok: true, status: "MESSAGE_ACCEPTED_FOR_DELIVERY" };
  } catch {
    return { ok: false, reason: "DELIVERY_FAILED" };
  }
}
