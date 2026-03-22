// core/src/execution/action.router.ts
// =====================================================
// PlannerAgent — Execution Action Router
// Canonical Source of Truth
//
// Purpose
// Transform governed planner actions into execution intents.
//
// Rules
// - Optimizer / semantic layer decides WHAT should be done
// - Action Router maps action -> execution capability
// - Executor decides HOW to execute within approved scope
// - Execution may use:
//   1) DIRECT industrial tools/adapters
//   2) GOVERNED AI agents as execution tools
//
// Non-negotiable
// - LLM never decides the action
// - LLM may participate only as an execution tool
// =====================================================

export type OptimizerAction =
  | {
      kind: "EXPEDITE_SUPPLIER";
      sku: string;
      qty: number;
      costFactor?: number;
      reason?: string;
    }
  | {
      kind: "SHORT_TERM_PRODUCTION_ADJUST";
      sku: string;
      qty: number;
      availableInDays?: number;
      costFactor?: number;
      reason?: string;
    }
  | {
      kind: "RESCHEDULE_DELIVERY";
      orderId: string;
      shiftDays: number;
      reason?: string;
    };

export type ExecutionMode =
  | "DIRECT"
  | "AGENT";

export type AgentRole =
  | "SUPPLIER_COMMUNICATION_AGENT"
  | "ERP_UPDATE_AGENT";

export type ExecutionCapabilityId =
  | "notify_supplier"
  | "update_order"
  | "adjust_production";

export type ExecutionIntent = {
  action_kind: OptimizerAction["kind"];
  capability_id: ExecutionCapabilityId;
  mode: ExecutionMode;
  payload: Record<string, unknown>;
  agent_role?: AgentRole;
  rationale: string;
};

function buildBasePayload(
  context: {
    tenantId: string;
    approver?: string;
  }
): Record<string, unknown> {
  return {
    tenantId: context.tenantId,
    approver: context.approver ?? null,
    requestedAt: new Date().toISOString(),
    source: "PLANNERAGENT_GOVERNED_ACTION",
  };
}

export function routeActionToExecutionIntent(
  action: OptimizerAction,
  context: {
    tenantId: string;
    approver?: string;
  }
): ExecutionIntent {
  const base = buildBasePayload(context);

  switch (action.kind) {
    case "EXPEDITE_SUPPLIER":
      return {
        action_kind: action.kind,
        capability_id: "notify_supplier",
        mode: "AGENT",
        agent_role: "SUPPLIER_COMMUNICATION_AGENT",
        payload: {
          ...base,
          sku: action.sku,
          qty: action.qty,
          costFactor: action.costFactor ?? 1,
          reason: action.reason ?? "expedite_requested_by_optimizer",
        },
        rationale:
          "Supplier communication may be executed through a governed AI agent, but the action itself was decided deterministically by PlannerAgent.",
      };

    case "SHORT_TERM_PRODUCTION_ADJUST":
      return {
        action_kind: action.kind,
        capability_id: "adjust_production",
        mode: "DIRECT",
        payload: {
          ...base,
          sku: action.sku,
          qty: action.qty,
          availableInDays: action.availableInDays ?? 0,
          costFactor: action.costFactor ?? 1,
          reason: action.reason ?? "short_term_production_adjust",
        },
        rationale:
          "Short-term production adjustment maps to a governed direct execution path toward production / ERP update.",
      };

    case "RESCHEDULE_DELIVERY":
      return {
        action_kind: action.kind,
        capability_id: "update_order",
        mode: "DIRECT",
        payload: {
          ...base,
          orderId: action.orderId,
          shiftDays: action.shiftDays,
          reason: action.reason ?? "delivery_reschedule",
        },
        rationale:
          "Delivery rescheduling maps to a governed direct order update within execution boundaries.",
      };

    default: {
      const _exhaustive: never = action;
      throw new Error(`Unsupported action kind`);
    }
  }
}