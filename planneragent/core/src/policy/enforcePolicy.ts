import { PolicyRecord } from "./types";

export function enforcePolicy(
  policy: PolicyRecord,
  result: {
    stockViolations: boolean;
    lateOrders: number;
  }
) {
  const boundaries = policy.policyJson?.boundaries ?? {};

  if (
    boundaries.allow_negative_stock === false &&
    result.stockViolations
  ) {
    return {
      blocked: true,
      reason: "Negative stock not allowed by policy",
      required_action: "HUMAN_REVIEW"
    };
  }

  if (
    typeof boundaries.max_late_days === "number" &&
    result.lateOrders > boundaries.max_late_days
  ) {
    return {
      blocked: true,
      reason: "Late orders exceed policy limit"
    };
  }

  return { blocked: false };
}
