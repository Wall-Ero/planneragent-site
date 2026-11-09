import { hybridCanonicalV1, hybridSnapshotV1, type HybridTeacherLimitsV1, type HybridTeacherProviderV1, type HybridTeacherRequestV1, type HybridUsageV1 } from "./hybrid.conversational.contracts.v1";

export const HYBRID_TEACHER_MODEL_V1 = "@cf/qwen/qwen3-30b-a3b-fp8";
export type OfflineTeacherConfigurationV1 = Readonly<{
  mode: "MOCK_ONLY";
  provider: "CLOUDFLARE_WORKERS_AI";
  model: typeof HYBRID_TEACHER_MODEL_V1;
  model_revision: string;
  configuration_version: string;
  // A fixture assertion is not evidence of the real account's plan or entitlement.
  free_plan: "CONFIRMED_BY_OFFLINE_FIXTURE";
  model_free_eligibility: "CONFIRMED_BY_OFFLINE_FIXTURE";
  confirmation_ref: string;
  day_utc: string;
  daily_neurons: number;
  limits: HybridTeacherLimitsV1;
}>;
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function validOfflineTeacherConfigurationV1(value: OfflineTeacherConfigurationV1 | undefined, day: string): value is OfflineTeacherConfigurationV1 {
  if (!value || value.mode !== "MOCK_ONLY" || value.provider !== "CLOUDFLARE_WORKERS_AI" || value.model !== HYBRID_TEACHER_MODEL_V1 ||
      value.free_plan !== "CONFIRMED_BY_OFFLINE_FIXTURE" || value.model_free_eligibility !== "CONFIRMED_BY_OFFLINE_FIXTURE" ||
      !text(value.model_revision) || !text(value.configuration_version) || !text(value.confirmation_ref) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day) || value.day_utc !== day || !positive(value.daily_neurons) || !value.limits) return false;
  const l = value.limits;
  if (Object.keys(value).sort().join() !== ["mode", "provider", "model", "model_revision", "configuration_version", "free_plan", "model_free_eligibility", "confirmation_ref", "day_utc", "daily_neurons", "limits"].sort().join() ||
      Object.keys(l).sort().join() !== ["max_input_bytes", "max_input_tokens", "max_output_tokens", "max_neurons_per_attempt", "timeout_ms", "max_retries"].sort().join()) return false;
  return [l.max_input_bytes, l.max_input_tokens, l.max_output_tokens, l.max_neurons_per_attempt, l.timeout_ms].every(positive) &&
    Number.isSafeInteger(l.max_retries) && l.max_retries >= 0 && l.max_retries <= 2 && l.max_neurons_per_attempt <= value.daily_neurons;
}

export function inspectLiveTeacherAvailabilityV1() {
  return Object.freeze({ state: "TEACHER_DISABLED" as const, provider: "MOCK_ONLY" as const,
    blockers: Object.freeze(["STEP13A_NO_REAL_CALLS", "ACCOUNT_FREE_PLAN_NOT_VERIFIED", "ACCOUNT_MODEL_ELIGIBILITY_NOT_VERIFIED",
      "DURABLE_ATOMIC_QUOTA_RESERVATION_NOT_IMPLEMENTED", "GOVERNED_USAGE_BOUND_NOT_VERIFIED"]), paid_fallback: false as const });
}

// A deliberately volatile, synchronous test double. NEVER a production concurrency guarantee.
// Reservations are pessimistic and never refunded, including timeouts/unknown consumption.
export class OfflineMockTeacherQuotaV1 {
  readonly mode = "VOLATILE_OFFLINE_TEST_DOUBLE" as const;
  private readonly configuration: OfflineTeacherConfigurationV1;
  private reserved = 0;
  private measured = 0;
  private readonly ids = new Set<string>();
  private readonly settled = new Set<string>();
  private meteringValid = true;
  constructor(configuration: OfflineTeacherConfigurationV1) {
    if (!validOfflineTeacherConfigurationV1(configuration, configuration.day_utc)) throw new TypeError("HYBRID_INVALID_MOCK_BUDGET");
    this.configuration = hybridSnapshotV1(configuration);
  }
  matches(configuration: OfflineTeacherConfigurationV1): boolean { return hybridCanonicalV1(configuration) === hybridCanonicalV1(this.configuration); }
  reserve(id: string, day: string): boolean {
    const amount = this.configuration.limits.max_neurons_per_attempt;
    if (!id || day !== this.configuration.day_utc || !this.meteringValid || this.ids.has(id) || this.reserved + amount > this.configuration.daily_neurons) return false;
    this.ids.add(id); this.reserved += amount; return true;
  }
  settle(id: string, usage: HybridUsageV1): boolean {
    const l = this.configuration.limits;
    const valid = this.meteringValid && this.ids.has(id) && !this.settled.has(id) && usage && Object.keys(usage).sort().join() === "input_tokens,neurons,output_tokens" &&
      [usage.input_tokens, usage.output_tokens, usage.neurons].every(v => Number.isSafeInteger(v) && v >= 0) &&
      usage.input_tokens <= l.max_input_tokens && usage.output_tokens <= l.max_output_tokens && usage.neurons <= l.max_neurons_per_attempt;
    if (!valid) { this.meteringValid = false; return false; }
    this.settled.add(id); this.measured += usage.neurons; return true;
  }
  invalidateAccounting(): void { this.meteringValid = false; }
  snapshot() { return Object.freeze({ day_utc: this.configuration.day_utc, daily_neurons: this.configuration.daily_neurons,
    reserved_neurons: this.reserved, measured_neurons: this.measured, unsettled_attempts: this.ids.size - this.settled.size,
    reserved_quota_fraction: this.reserved / this.configuration.daily_neurons, measured_quota_fraction: this.measured / this.configuration.daily_neurons,
    metering_valid: this.meteringValid, production_safe: false as const }); }
}

// No credentials, Workers AI binding, HTTP client, paid mode or live provider implementation.
export class MockHybridTeacherProviderV1 implements HybridTeacherProviderV1 {
  readonly mode = "MOCK_ONLY" as const;
  readonly provider_id = "CLOUDFLARE_WORKERS_AI" as const;
  readonly model = HYBRID_TEACHER_MODEL_V1;
  constructor(readonly model_revision: string, readonly configuration_version: string,
    private readonly fixture: (request: HybridTeacherRequestV1, signal: AbortSignal) => Promise<Readonly<{ candidate: unknown; usage: HybridUsageV1 }>>) {}
  complete(request: HybridTeacherRequestV1, signal: AbortSignal) { return this.fixture(request, signal); }
}
