// PATH: core/src/executor/providers/email.resend.ts
// ======================================================
// PlannerAgent — Resend Email Provider
// Canonical Source of Truth
// ======================================================

export interface ResendEmailRequest {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface ResendEmailResponse {
  id: string;

  // 👇 QUESTA È LA CHIAVE
  [key: string]: unknown;
}

export interface ResendErrorResponse {
  message?: string;
  name?: string;
}

export async function sendEmailWithResend(
  input: ResendEmailRequest
): Promise<ResendEmailResponse> {

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from ?? "PlannerAgent <onboarding@resend.dev>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  // --------------------------------------------------
  // ERROR HANDLING (typed)
  // --------------------------------------------------

  if (!response.ok) {
    let errorBody: ResendErrorResponse | null = null;

    try {
      errorBody = await response.json();
    } catch {
      // ignore parse error
    }

    throw new Error(
      `RESEND_ERROR: ${
        errorBody?.message ?? response.statusText ?? "UNKNOWN"
      }`
    );
  }

  // --------------------------------------------------
  // SUCCESS RESPONSE (typed)
  // --------------------------------------------------

  const data = (await response.json()) as ResendEmailResponse;

  if (!data?.id) {
    throw new Error("RESEND_INVALID_RESPONSE");
  }

  return data;
}