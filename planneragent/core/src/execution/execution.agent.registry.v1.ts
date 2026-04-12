// core/src/execution/execution.agent.registry.v1.ts
// ======================================================
// PlannerAgent — Execution Agent Registry v1
// Canonical Source of Truth
// ======================================================

import type {
  ExecutionIntent,
  ExecutionCapabilityId,
  ExecutionResult,
} from "./execution.contracts.v1";

// ------------------------------------------------------
// AGENT CONTRACT
// ------------------------------------------------------

export interface ExecutionAgent {
  id: string;

  capabilities: ExecutionCapabilityId[];

  priority: number;

  execute(input: {
    intent: ExecutionIntent;
    context: {
      tenantId: string;
      approver?: string;
    };
    env?: Record<string, unknown>;
  }): Promise<ExecutionResult>;
}

// ------------------------------------------------------
// REGISTRY
// ------------------------------------------------------

const registry: ExecutionAgent[] = [];

// ------------------------------------------------------
// REGISTER
// ------------------------------------------------------

export function registerAgent(agent: ExecutionAgent) {
  registry.push(agent);
}

// ------------------------------------------------------
// RESOLVE
// ------------------------------------------------------

export function resolveAgent(intent: ExecutionIntent): ExecutionAgent {
  const candidates = registry
    .filter((agent) => agent.capabilities.includes(intent.capability_id))
    .sort((a, b) => b.priority - a.priority);

  if (candidates.length === 0) {
    throw new Error(`NO_AGENT_FOUND_FOR_${intent.capability_id}`);
  }

  return candidates[0];
}

// ------------------------------------------------------
// OPTIONAL WRAPPER
// ------------------------------------------------------

export async function executeViaAgentRegistry(input: {
  intent: ExecutionIntent;
  context: {
    tenantId: string;
    approver?: string;
  };
  env?: Record<string, unknown>;
}): Promise<ExecutionResult> {
  const agent = resolveAgent(input.intent);

  return agent.execute(input);
}