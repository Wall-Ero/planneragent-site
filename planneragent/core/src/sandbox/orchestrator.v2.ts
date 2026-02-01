// core/src/sandbox/orchestrator.v2.ts
//
// CORE — Orchestrator v2 (minimal, deterministic)
// -----------------------------------------------
// This version is intentionally "1-arg" to match current contracts.
// No executor implemented.
// No snapshot enforcement here (until contracts are stabilized).
//

import type {
  SandboxEvaluateRequestV2,
  SandboxEvaluateResponseV2,
  ScenarioV2
} from "./contracts.v2";

export async function evaluateSandboxV2(
  req: SandboxEvaluateRequestV2
): Promise<SandboxEvaluateResponseV2> {
  // In current FAQ framing:
  // - VISION: informs (read-only)
  // - JUNIOR: advises + executes only on approval (not implemented here)
  // - SENIOR: advises + executes on delegation (not implemented here)
  // - PRINCIPAL: advises + executes for improvement via budget (not implemented here)
  //
  // Therefore: execution is NOT implemented, but we can still compute whether
  // it would be allowed in principle at governance level.

  const execution_allowed =
    req.plan === "SENIOR" || req.plan === "PRINCIPAL";

  const scenarios: ScenarioV2[] = [
    {
      id: "obs-1",
      title: "Operational Signal",
      summary: `Observed delta in domain ${req.domain}`,
      confidence: 0.5
    }
  ];

  return {
    ok: true,
    request_id: req.request_id,

    plan: req.plan,
    intent: req.intent,
    domain: req.domain,

    scenarios,

    governance: {
      execution_allowed,
      reason: execution_allowed
        ? "DELEGATED_OR_BUDGETED_AUTHORITY"
        : "OBSERVATION_OR_ADVICE_ONLY"
    },

    issued_at: new Date().toISOString()
  };
}