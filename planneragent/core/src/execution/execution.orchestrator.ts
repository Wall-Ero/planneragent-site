// core/src/execution/execution.orchestrator.ts

import { CAPABILITY_REGISTRY } from "./capability.registry";

/* =====================================================
 TYPES — 🔥 CANONICAL CONTRACT
===================================================== */

export type CapabilityExecutionStatus =
  | "EXECUTED"
  | "PENDING_APPROVAL"
  | "SKIPPED";

export type CapabilityExecutionResult = {
  status: CapabilityExecutionStatus;
  provider?: string;
  result?: unknown;
};

/* =====================================================
 MAIN EXECUTION
===================================================== */

export async function executeCapability(input: {
  capabilityId: string;
  plan: string;
  payload: any;
}): Promise<CapabilityExecutionResult> {

  // ----------------------------------------------------
  // RESOLVE CAPABILITY FROM REGISTRY
  // ----------------------------------------------------

  const capability = CAPABILITY_REGISTRY.find(
    (c) => c.id === input.capabilityId
  );

  if (!capability) {
    throw new Error(`Capability not found: ${input.capabilityId}`);
  }

  // ----------------------------------------------------
  // DEBUG (SAFE)
  // ----------------------------------------------------

  console.log("CAPABILITY_EXECUTION", {
    capabilityId: input.capabilityId,
    plan: input.plan,
    requiresApproval: capability.requiresApproval
  });

  // ----------------------------------------------------
  // GOVERNANCE — PLAN CHECK
  // ----------------------------------------------------

  if (!capability.allowedLevels.includes(input.plan as any)) {
    return {
      status: "SKIPPED"
    };
  }

  // ----------------------------------------------------
  // GOVERNANCE — APPROVAL
  // ----------------------------------------------------

  if (capability.requiresApproval && input.plan !== "SENIOR") {
    return {
      status: "PENDING_APPROVAL"
    };
  }

  // ----------------------------------------------------
  // EXECUTION — PRIMARY PROVIDER
  // ----------------------------------------------------

  const provider = capability.providers.primary;

  try {
    const result = await executeWithProvider(provider, input.payload);

    return {
      status: "EXECUTED",
      provider,
      result
    };

  } catch {

    // ----------------------------------------------------
    // FALLBACK CHAIN
    // ----------------------------------------------------

    for (const fallback of capability.providers.fallback || []) {
      try {
        const result = await executeWithProvider(fallback, input.payload);

        return {
          status: "EXECUTED",
          provider: fallback,
          result
        };
      } catch {}
    }

    // ----------------------------------------------------
    // TOTAL FAILURE
    // ----------------------------------------------------

    throw new Error("All providers failed");
  }
}

/* =====================================================
 PROVIDER EXECUTION (STUB / ADAPTER HOOK)
===================================================== */

async function executeWithProvider(provider: string, payload: any) {

  // 👉 qui collegherai:
  // - OpenAI / Claude
  // - ERP
  // - API
  // - Internal services

  return {
    provider,
    result: "executed"
  };
}