// planneragent/core/src/governance/boundary.responses.ts
//
// FREEZE — Boundary Responses v1
// Source of truth: chat-prodotto
// Status: canonical
//
// Purpose:
// Provide canonical, governance-safe user-facing responses
// when the Boundary Policy blocks or allows an intent.
//
// This file:
// - contains NO logic
// - contains NO branching
// - contains NO policy
// - is a pure mapping layer
//
// Logic lives in boundary.policy.ts
// This file only translates BoundaryResult -> message.

import { BoundaryResult, AuthorityLevel } from "./boundary.policy";

export type BoundaryResponse = {
  code: "OK" | "MODE_REQUIRED";
  message: string;
  requiredMode?: AuthorityLevel;
};

/**
 * Canonical messages
 * Non-negotiable phrasing
 * Governance > UX > Marketing
 */
export const BOUNDARY_RESPONSE_TABLE: readonly BoundaryResponse[] = [
  {
    code: "MODE_REQUIRED",
    requiredMode: "JUNIOR",
    message:
      "This request requires Decision Advisory Mode (JUNIOR). " +
      "In VISION, I can explain the situation or simulate outcomes, " +
      "but I cannot recommend or prepare actions for approval."
  },
  {
    code: "OK",
    message: "Intent permitted by current decision mode."
  }
] as const;

/**
 * Resolve user-facing response from a BoundaryResult
 * Pure mapping. No business logic.
 */
export function resolveBoundaryResponse(
  boundary: BoundaryResult
): BoundaryResponse {
  const match = BOUNDARY_RESPONSE_TABLE.find(
    r =>
      r.code === boundary.result &&
      (r.requiredMode === undefined ||
        r.requiredMode === boundary.requiredMode)
  );

  // Governance-safe fallback (should never be used)
  return (
    match || {
      code: "OK",
      message: "Request processed."
    }
  );
}

