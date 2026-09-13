import type { Env } from "../../types/env";
import { isShadowWindowIdV1, QUALIFIED_STUDENT_SERVING_REFERENCE_V1 } from "./durable.interpretation.shadow.infrastructure.v1";
import type { ControlledInterpretationShadowPolicyV1 } from "./controlled.interpretation.shadow.policy.v1";

export type DurableShadowEnvV1 = Partial<Pick<Env,"POLICIES_DB" | "INTERPRETATION_STUDENT_SHADOW_STATE" | "INTERPRETATION_STUDENT_SAMPLE_PERCENT" | "INTERPRETATION_STUDENT_KILL_SWITCH" | "INTERPRETATION_STUDENT_WINDOW_ID" | "INTERPRETATION_STUDENT_ENDPOINT_REFERENCE" | "INTERPRETATION_STUDENT_CREDENTIAL_REFERENCE" | "INTERPRETATION_STUDENT_ENDPOINT" | "INTERPRETATION_STUDENT_AUTHORIZATION" | "INTERPRETATION_STUDENT_TIMEOUT_MS">>;
export function resolveDurableShadowConfigurationV1(env:DurableShadowEnvV1) {
  const disabled = Object.freeze({state:"DISABLED",sample_percent:0,kill_switch:true} as const);
  const sample = env.INTERPRETATION_STUDENT_SAMPLE_PERCENT;
  const timeout = Number(env.INTERPRETATION_STUDENT_TIMEOUT_MS ?? "1500");
  try {
    const endpoint = new URL(env.INTERPRETATION_STUDENT_ENDPOINT ?? "");
    if (env.INTERPRETATION_STUDENT_SHADOW_STATE !== "CONTROLLED_SHADOW" || !["true","false"].includes(env.INTERPRETATION_STUDENT_KILL_SWITCH ?? "") || !sample || !/^(?:\d+(?:\.\d+)?)$/.test(sample) || Number(sample)>100 || !isShadowWindowIdV1(env.INTERPRETATION_STUDENT_WINDOW_ID) || !env.POLICIES_DB || env.INTERPRETATION_STUDENT_ENDPOINT_REFERENCE !== QUALIFIED_STUDENT_SERVING_REFERENCE_V1.endpoint_reference || env.INTERPRETATION_STUDENT_CREDENTIAL_REFERENCE !== QUALIFIED_STUDENT_SERVING_REFERENCE_V1.credential_reference || endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/v1/interpret" || endpoint.hostname.endsWith(".trycloudflare.com") || !env.INTERPRETATION_STUDENT_AUTHORIZATION?.trim() || !Number.isInteger(timeout) || timeout<1 || timeout>30000) return disabled;
    return Object.freeze({state:"CONTROLLED_SHADOW",sample_percent:Number(sample),kill_switch:env.INTERPRETATION_STUDENT_KILL_SWITCH === "true"} satisfies ControlledInterpretationShadowPolicyV1);
  } catch { return disabled; }
}
