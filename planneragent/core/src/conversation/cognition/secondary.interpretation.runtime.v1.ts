import type { Env } from "../../types/env";
import { parseConversationalInterpretationResultV1, sealConversationalInterpretationRequestV1, type ConversationalInterpretationResultV1 } from "./conversational.cognition.contracts.v1";
import { StudentConversationalInterpretationAdapterV1 } from "./student.conversational.interpretation.adapter.v1";

export type SecondaryInterpretationEnvV1 = Partial<Pick<Env,
  "INTERPRETATION_STUDENT_LIVE_STATE" | "INTERPRETATION_STUDENT_SECONDARY_KILL_SWITCH" |
  "INTERPRETATION_STUDENT_ENDPOINT" | "INTERPRETATION_STUDENT_AUTHORIZATION" | "INTERPRETATION_STUDENT_TIMEOUT_MS"
>>;

// Operational activation is separate from the frozen artifact/shadow lifecycle.
// No promotion evidence, window state, or historical observation is consulted or written.
export function resolveSecondaryInterpretationV1(env: SecondaryInterpretationEnvV1, fetcher: typeof fetch) {
  try {
    if (env.INTERPRETATION_STUDENT_LIVE_STATE !== "SECONDARY" || env.INTERPRETATION_STUDENT_SECONDARY_KILL_SWITCH !== "false") return undefined;
    const endpoint = new URL(env.INTERPRETATION_STUDENT_ENDPOINT ?? "");
    const timeout_ms = Number(env.INTERPRETATION_STUDENT_TIMEOUT_MS ?? "1500");
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/v1/interpret" || endpoint.hostname.endsWith(".trycloudflare.com") || !Number.isInteger(timeout_ms) || timeout_ms < 1 || timeout_ms > 30000) return undefined;
    const provider = new StudentConversationalInterpretationAdapterV1({
      endpoint: endpoint.href, authorization: env.INTERPRETATION_STUDENT_AUTHORIZATION ?? "", timeout_ms,
      fetch: fetcher, verify_identity: true, protocol_version: "PA_STUDENT_HTTP_V1",
    });
    return Object.freeze({
      async interpret(message: string): Promise<ConversationalInterpretationResultV1 | undefined> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          // Bounds identity, response decoding and validation, even if fetch ignores abort.
          const result = parseConversationalInterpretationResultV1(await Promise.race([
            provider.interpret(sealConversationalInterpretationRequestV1(message)),
            new Promise<undefined>(resolve => { timer = setTimeout(() => resolve(undefined), timeout_ms); }),
          ]));
          // Only the already-admitted product path consumes this; never model-driven admission.
          return result?.interaction === "PRODUCT_QUESTION" && result.resolution === "CLEAR" ? result : undefined;
        } catch { return undefined; }
        finally { if (timer !== undefined) clearTimeout(timer); }
      },
    });
  } catch { return undefined; }
}

export type SecondaryInterpretationV1 = NonNullable<ReturnType<typeof resolveSecondaryInterpretationV1>>;
