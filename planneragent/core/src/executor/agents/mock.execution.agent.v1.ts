// core/src/executor/agents/mock.execution.agent.v1.ts
// ======================================================
// PlannerAgent — Mock Execution Agent v1
// Canonical Source of Truth
// ======================================================

import {
  registerAgent,
  type ExecutionAgent,
} from "../../execution/execution.agent.registry.v1";

import type {
  ExecutionResult,
} from "../../execution/execution.contracts.v1";

const mockExecutionAgent: ExecutionAgent = {
  id: "mock-execution-agent-v1",

  priority: 1,

  capabilities: [
    "notify_supplier",
    "adjust_production",
    "update_order",
  ],

  async execute({ intent }): Promise<ExecutionResult> {
    console.log("MOCK_AGENT_EXECUTE", {
      capability_id: intent.capability_id,
      payload: intent.payload,
    });

    return {
      capability_id: intent.capability_id,
      success: true,
      executed_at: new Date().toISOString(),
      details: {
        simulated: true,
        agent: "mock-execution-agent-v1",
      },
    };
  },
};

registerAgent(mockExecutionAgent);

export {};