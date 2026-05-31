// core/src/execution/execution.orchestrator.ts

import { CAPABILITY_REGISTRY } from "./capability.registry";

import type { CapabilityLevel } from "./capability.types";

import {
  assertSovereigntyPolicy,
  type RuntimeLocality,
} from "../security/sovereignty.policy";

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
  plan: CapabilityLevel;
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

  if (!(capability.allowedLevels as readonly string[]).includes(input.plan)) {
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

// ----------------------------------------------------
// SOVEREIGNTY RUNTIME ENFORCEMENT
// ----------------------------------------------------

const tenantId =
  input.payload?.context?.tenantId ??
  input.payload?.company_id;

const sourceRegion =
  input.payload?.context?.source_region ??
  input.payload?.source_region ??
  "EU";

const targetRegion =
  input.payload?.context?.target_region ??
  input.payload?.target_region ??
  sourceRegion;

const runtimeLocality: RuntimeLocality =
  targetRegion === sourceRegion
    ? "REGION_LOCAL"
    : "GLOBAL_RUNTIME";

assertSovereigntyPolicy({
  domain: "EXECUTION_MEMORY",
  operation: "EXECUTE",
  tenant_id: tenantId,
  source_region: sourceRegion,
  target_region: targetRegion,
  runtime_locality: runtimeLocality,
  involves_authority: true,
  involves_execution: true,
  involves_cognition: false,
});

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

    for (const fallback of getFallbacks(capability.providers)) {

  assertSovereigntyPolicy({
    domain: "EXECUTION_MEMORY",
    operation: "EXECUTE",
    tenant_id: tenantId,
    source_region: sourceRegion,
    target_region: targetRegion,
    runtime_locality: runtimeLocality,
    involves_authority: true,
    involves_execution: true,
    involves_cognition: false,
  });

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

function getFallbacks(providers: any): string[] {
  if (providers && Array.isArray(providers.fallback)) {
    return providers.fallback;
  }
  return [];
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