export type InterpretationShadowStateV1 = "DISABLED" | "CONTROLLED_SHADOW";

export type ControlledInterpretationShadowPolicyV1 = Readonly<{
  state: InterpretationShadowStateV1;
  sample_percent: number;
  kill_switch: boolean;
}>;

export function resolveControlledInterpretationShadowPolicyV1(input: Readonly<{ state?: string; sample_percent?: string; kill_switch?: string }>): ControlledInterpretationShadowPolicyV1 {
  const state: InterpretationShadowStateV1 = input.state === "CONTROLLED_SHADOW" ? "CONTROLLED_SHADOW" : "DISABLED";
  const parsed = Number(input.sample_percent ?? "0");
  const sample_percent = Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 0;
  return Object.freeze({ state, sample_percent, kill_switch: input.kill_switch === "true" });
}

export function controlledShadowSampleBucketV1(stableKey: string): number {
  let hash = 2166136261;
  for (const byte of new TextEncoder().encode(stableKey)) { hash ^= byte; hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) % 10_000;
}

export function shouldScheduleControlledShadowV1(policy: ControlledInterpretationShadowPolicyV1, stableKey: string): boolean {
  if (policy.state !== "CONTROLLED_SHADOW" || policy.kill_switch || policy.sample_percent <= 0) return false;
  if (policy.sample_percent >= 100) return true;
  return controlledShadowSampleBucketV1(stableKey) < Math.round(policy.sample_percent * 100);
}
