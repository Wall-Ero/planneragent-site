import { sendEmailWithResend, type ResendEmailRequest, type ResendEmailResponse } from "../../executor/providers/email.resend";
import type { Env } from "../../types/env";
import { normalizeEmailIdentityV1 } from "./email.ownership.v1";

type RelayRequestV1 = Readonly<{ to: string; from: string; subject: string; body: string }>;
type ResendSenderV1 = (input: ResendEmailRequest) => Promise<ResendEmailResponse>;

const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const bounded = (value: unknown, maximum: number) => typeof value === "string" && value.length > 0 && value.length <= maximum;
const exactObject = (value: unknown): value is RelayRequestV1 => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 4 && ["to", "from", "subject", "body"].every(key => keys.includes(key));
};
const bearerMatches = (authorization: string | null, expected: string) => {
  if (!authorization?.startsWith("Bearer ")) return false;
  const supplied = authorization.slice(7);
  if (!supplied || supplied.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= supplied.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
};
export const escapeEmailTextForHtmlV1 = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;").replace(/\r?\n/g, "<br>");

export async function emailResendRelayRouteV1(request: Request, env: Env, send: ResendSenderV1 = sendEmailWithResend): Promise<Response> {
  if (request.method !== "POST") return json({ version: 1, error: "METHOD_NOT_ALLOWED" }, 405);
  if (!bounded(env.EMAIL_WEBHOOK_TOKEN, 4096)) return json({ version: 1, error: "RELAY_NOT_CONFIGURED" }, 503);
  if (!bearerMatches(request.headers.get("authorization"), env.EMAIL_WEBHOOK_TOKEN)) return json({ version: 1, error: "UNAUTHORIZED" }, 401);
  if (!bounded(env.RESEND_API_KEY, 4096) || !bounded(env.EMAIL_FROM, 320)) return json({ version: 1, error: "DELIVERY_NOT_CONFIGURED" }, 503);
  let value: unknown;
  try { value = await request.json(); } catch { return json({ version: 1, error: "REQUEST_INVALID" }, 400); }
  if (!exactObject(value) || !bounded(value.to, 320) || !bounded(value.from, 320) || !bounded(value.subject, 200) || !bounded(value.body, 10_000)) return json({ version: 1, error: "REQUEST_INVALID" }, 400);
  if (value.from !== env.EMAIL_FROM) return json({ version: 1, error: "SENDER_NOT_ALLOWED" }, 400);
  let to: string;
  try { to = normalizeEmailIdentityV1(value.to); } catch { return json({ version: 1, error: "REQUEST_INVALID" }, 400); }
  try {
    await send({ apiKey: env.RESEND_API_KEY, to, from: env.EMAIL_FROM, subject: value.subject, html: escapeEmailTextForHtmlV1(value.body) });
    return json({ version: 1, status: "MESSAGE_ACCEPTED_FOR_DELIVERY" }, 202);
  } catch {
    return json({ version: 1, error: "DELIVERY_FAILED" }, 502);
  }
}
