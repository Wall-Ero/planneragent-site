import {
  createConversationalProviderDescriptorV1,
  parseConversationalInterpretationResultV1,
  type ConversationalInterpretationProviderV1,
  type ConversationalInterpretationResultV1,
  type ConversationalProviderDescriptorV1,
  type SealedConversationalInterpretationRequestV1,
} from "./conversational.cognition.contracts.v1";
import { canonicalizeConversationalInterpretationProviderResultV1 } from "./conversational.interpretation.provider.protocol.v1";

export const GCC4W_STUDENT_IDENTITY_V1 = Object.freeze({
  candidate_id: "PA-INTERPRETATION-STUDENT-v0.6",
  candidate_version: "0.6",
  lifecycle: "QUALIFIED_FOR_SHADOW",
  artifact_sha256: "f20989ac8397aa1788fcdd03c6027fb178e4489bc576a175f690029ac2eb9e1f",
  artifact_size: 22_782_731,
  adapter_digest: "sha256:6ce46299667e0ba8f9b24b3558cc8b3ae110ef5bbcfb5c20a5f32ea022400ad3",
  base_model: "Qwen/Qwen3-0.6B-Base",
  base_revision: "da87bfb608c14b7cf20ba1ce41287e8de496c0cd",
} as const);

export type StudentInterpretationFailureCodeV1 = "CONFIGURATION_UNAVAILABLE" | "TIMEOUT" | "PROVIDER_FAILURE" | "JSON_PARSE_FAILURE" | "CONTRACT_VALIDATION_FAILURE" | "IDENTITY_MISMATCH";
export class StudentInterpretationProviderErrorV1 extends Error {
  constructor(readonly code: StudentInterpretationFailureCodeV1, readonly observed?: Readonly<Record<string, unknown>>) { super(code); this.name = "StudentInterpretationProviderErrorV1"; }
}

export class StudentConversationalInterpretationAdapterV1 implements ConversationalInterpretationProviderV1 {
  readonly descriptor: ConversationalProviderDescriptorV1 = createConversationalProviderDescriptorV1({
    version: 1,
    provider_id: "planneragent-student-serving",
    adapter_id: "provider-neutral-http-conversational-interpretation",
    adapter_version: "1",
    model_id: GCC4W_STUDENT_IDENTITY_V1.candidate_id,
    model_version: GCC4W_STUDENT_IDENTITY_V1.adapter_digest,
    capabilities: ["INTERPRETATION"],
    deployment_class: "DEDICATED_REPLACEABLE_INFERENCE_SERVICE",
    retention_privacy_class: "NO_REQUEST_PLAINTEXT_RETENTION_REQUIRED",
  });

  constructor(private readonly configuration: Readonly<{ endpoint: string; authorization: string; timeout_ms: number; fetch?: typeof fetch; verify_identity?: boolean; protocol_version?: "PA_STUDENT_HTTP_V1" }>) {
    if (!configuration.endpoint.trim() || !configuration.authorization.trim() || !Number.isInteger(configuration.timeout_ms) || configuration.timeout_ms < 1) throw new StudentInterpretationProviderErrorV1("CONFIGURATION_UNAVAILABLE");
  }

  async interpret(input: SealedConversationalInterpretationRequestV1): Promise<ConversationalInterpretationResultV1> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.configuration.timeout_ms);
    let response: Response;
    try {
      if (this.configuration.verify_identity) {
        const identityUrl = new URL(this.configuration.endpoint); identityUrl.pathname = "/v1/identity"; identityUrl.search = "";
        const identityResponse = await (this.configuration.fetch ?? ((...args) => globalThis.fetch(...args)))(identityUrl, { signal: controller.signal, redirect: "error", headers: { authorization: `Bearer ${this.configuration.authorization}` } });
        let identity: Record<string, unknown> | undefined;
        try { identity = identityResponse.ok ? await identityResponse.json() as Record<string, unknown> : undefined; } catch { identity = undefined; }
        if (!identity || Object.entries(GCC4W_STUDENT_IDENTITY_V1).some(([key,value]) => identity[key] !== value) || identity.effective_dtype !== "bf16" || (this.configuration.protocol_version && identity.protocol_version !== this.configuration.protocol_version)) throw new StudentInterpretationProviderErrorV1("IDENTITY_MISMATCH");
      }
      response = await (this.configuration.fetch ?? ((...args) => globalThis.fetch(...args)))(this.configuration.endpoint, {
        method: "POST",
        redirect: "error",
        headers: { authorization: `Bearer ${this.configuration.authorization}`, "content-type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof StudentInterpretationProviderErrorV1) throw error;
      throw new StudentInterpretationProviderErrorV1(controller.signal.aborted || (error instanceof Error && error.name === "AbortError") ? "TIMEOUT" : "PROVIDER_FAILURE");
    } finally { clearTimeout(timer); }
    if (!response.ok) throw new StudentInterpretationProviderErrorV1("PROVIDER_FAILURE");
    let value: unknown;
    try { value = await response.json(); } catch { throw new StudentInterpretationProviderErrorV1("JSON_PARSE_FAILURE"); }
    const observed = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
    const parsed = parseConversationalInterpretationResultV1(canonicalizeConversationalInterpretationProviderResultV1(value));
    if (!parsed) throw new StudentInterpretationProviderErrorV1("CONTRACT_VALIDATION_FAILURE", observed);
    return parsed;
  }
}
