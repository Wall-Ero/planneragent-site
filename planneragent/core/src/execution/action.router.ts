// core/src/execution/action.router.ts
// =====================================================
// PlannerAgent — Execution Action Router (v2 aligned)
// Canonical Source of Truth
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

// ------------------------------------------------------

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

// ------------------------------------------------------

export type ExecutionIntent = {
  action_kind: OptimizerAction["kind"];

  capability_id: ExecutionCapabilityId;

  mode: ExecutionMode;

  payload: Record<string, unknown>;

  agent_role?: AgentRole;

  rationale: string;
};

// ------------------------------------------------------

function buildBasePayload(context: {
  tenantId: string;
  approver?: string;
}): Record<string, unknown> {
  return {
    tenantId: context.tenantId,
    approver: context.approver ?? null,
    requestedAt: new Date().toISOString(),
    source: "PLANNERAGENT_GOVERNED_ACTION",
  };
}

// ------------------------------------------------------

export function routeActionToExecutionIntent(
  action: OptimizerAction,
  context: {
    tenantId: string;
    approver?: string;
  }
): ExecutionIntent {

  const base = buildBasePayload(context);

  switch (action.kind) {

    // --------------------------------------------------
    // EXPEDITE SUPPLIER
    // --------------------------------------------------

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
          reason: action.reason ?? "expedite_requested",
        },

        rationale:
          "Supplier communication is executed via governed agent. Action is deterministic and approved upstream.",
      };

    // --------------------------------------------------
    // PRODUCTION ADJUST
    // --------------------------------------------------

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
          reason: action.reason ?? "production_adjust",
        },

        rationale:
          "Production adjustment is a direct governed execution toward ERP / production system.",
      };

    // --------------------------------------------------
    // RESCHEDULE DELIVERY
    // --------------------------------------------------

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
          "Delivery rescheduling maps to direct order update within execution boundaries.",
      };

    // --------------------------------------------------

    default: {
      const _exhaustive: never = action;
      throw new Error(`Unsupported action kind`);
    }
  }
}