import { identifier } from "../contracts/identifiers.v1";
import type {
  UploadAuthorizationPolicyInputV1,
  UploadAuthorizationPolicyResultV1,
} from "./authorization.contracts.v1";

export interface UploadAuthorizationPolicyEvaluator {
  evaluate(input: UploadAuthorizationPolicyInputV1): Promise<UploadAuthorizationPolicyResultV1>;
}

export interface BaselineUploadAuthorizationPolicyV1 {
  readonly version: string;
  readonly allowed_resource_prefixes: readonly string[];
  readonly allowed_purposes: readonly string[];
  readonly validity_ms: number;
}

export class DeterministicUploadAuthorizationPolicyV1 implements UploadAuthorizationPolicyEvaluator {
  constructor(private readonly policy: BaselineUploadAuthorizationPolicyV1) {
    if (
      !policy.version ||
      policy.allowed_resource_prefixes.length === 0 ||
      policy.allowed_purposes.length === 0 ||
      !Number.isFinite(policy.validity_ms) ||
      policy.validity_ms <= 0
    ) throw new Error("UPLOAD_AUTHORIZATION_POLICY_INVALID");
  }

  async evaluate(input: UploadAuthorizationPolicyInputV1): Promise<UploadAuthorizationPolicyResultV1> {
    const reasons: string[] = [];
    if (!input.participation.baseline_permissions.includes("UPLOAD_DATA")) {
      reasons.push("BASELINE_PERMISSION_MISSING");
    }
    if (!this.policy.allowed_resource_prefixes.some(prefix => input.resource.startsWith(prefix))) {
      reasons.push("RESOURCE_NOT_ALLOWED");
    }
    if (!this.policy.allowed_purposes.includes(input.purpose)) {
      reasons.push("PURPOSE_NOT_ALLOWED");
    }
    if (!input.participation.membership_state_version || !input.participation.ownership_reference) {
      reasons.push("CURRENT_STATE_REFERENCES_MISSING");
    }
    return Object.freeze({
      decision: reasons.length === 0 ? "ADMITTED" : "DENIED",
      policy_version: identifier("PolicyVersionId", this.policy.version),
      reason_codes: Object.freeze(reasons.sort()),
      validity_ms: this.policy.validity_ms,
    });
  }
}
