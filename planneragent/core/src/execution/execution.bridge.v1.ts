// PATH: core/src/execution/execution.bridge.v1.ts
// ======================================================
// PlannerAgent — Execution Bridge v1
// OptimizerAction → ExecutionIntent
// Canonical Source of Truth
// ======================================================

import type {
  ExecutionIntent,
} from "./execution.contracts.v1";

import type {
  OptimizerAction,
} from "./action.router";

// ======================================================
// MAIN
// ======================================================

export function mapActionToExecutionIntent(
  action: OptimizerAction,
  context: {
    tenantId: string;
    approver?: string;
  }
): ExecutionIntent {

  const basePayload = {
    tenantId: context.tenantId,
    approver: context.approver ?? null,
    requestedAt: new Date().toISOString(),
    source: "PLANNERAGENT_GOVERNED_ACTION",
  };

  switch (action.kind) {

    case "EXPEDITE_SUPPLIER":
      return {
        action_kind: action.kind,
        capability_id: "notify_supplier",
        mode: "AGENT",
        payload: {
          ...basePayload,
          sku: action.sku,
          qty: action.qty,
          costFactor: action.costFactor ?? 1,
          reason: action.reason ?? "expedite_requested",
        },
        rationale:
          "Supplier communication is executed via governed agent. Action selected upstream by PlannerAgent.",
      };

    case "SHORT_TERM_PRODUCTION_ADJUST":
      return {
        action_kind: action.kind,
        capability_id: "adjust_production",
        mode: "DIRECT",
        payload: {
          ...basePayload,
          sku: action.sku,
          qty: action.qty,
          availableInDays: action.availableInDays ?? 0,
          costFactor: action.costFactor ?? 1,
          reason: action.reason ?? "production_adjust",
        },
        rationale:
          "Production adjustment maps to governed direct execution toward ERP / production system.",
      };

    case "RESCHEDULE_DELIVERY":
      return {
        action_kind: action.kind,
        capability_id: "update_order",
        mode: "DIRECT",
        payload: {
          ...basePayload,
          orderId: action.orderId,
          shiftDays: action.shiftDays,
          reason: action.reason ?? "delivery_reschedule",
        },
        rationale:
          "Delivery rescheduling maps to direct order update within execution boundaries.",
      };

    default: {
      const _exhaustive: never = action;
      throw new Error("UNSUPPORTED_OPTIMIZER_ACTION");
    }
  }
}