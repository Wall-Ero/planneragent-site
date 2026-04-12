// core/src/execution/action.types.ts

import type { CAPABILITY_REGISTRY } from "./capability.registry";

/* =====================================================
 CAPABILITY-DERIVED IDS
===================================================== */

export type CapabilityId = typeof CAPABILITY_REGISTRY[number]["id"];

/* =====================================================
 PLANNER ACTION TYPE — human / planner language
===================================================== */

export type PlannerActionType =
  // PROCUREMENT
  | "CREATE_PURCHASE_ORDER"
  | "UPDATE_PURCHASE_ORDER"
  | "CANCEL_PURCHASE_ORDER"
  | "EXPEDITE_SUPPLIER"
  | "CHANGE_SUPPLIER"
  | "NEGOTIATE_SUPPLIER"
  | "MANAGE_SUPPLIER_RELATION"
  | "CHECK_SUPPLIER_COMPLIANCE"

  // PRODUCTION
  | "SCHEDULE_PRODUCTION"
  | "RESCHEDULE_PRODUCTION"
  | "SHORT_TERM_PRODUCTION_ADJUST"
  | "CANCEL_PRODUCTION_ORDER"
  | "ADJUST_PRODUCTION_PLAN"
  | "SPLIT_PRODUCTION_ORDER"
  | "MERGE_PRODUCTION_ORDERS"

  // INVENTORY
  | "ALLOCATE_INVENTORY"
  | "REALLOCATE_INVENTORY"
  | "RESERVE_STOCK"
  | "ADJUST_SAFETY_STOCK"
  | "CORRECT_INVENTORY"

  // PLANNING
  | "REBALANCE_PLAN"
  | "FREEZE_PLAN"
  | "UNFREEZE_PLAN"

  // LOGISTICS
  | "RESCHEDULE_DELIVERY"
  | "CHANGE_TRANSPORT_MODE"
  | "CONSOLIDATE_SHIPMENT"
  | "SPLIT_SHIPMENT"
  | "SELECT_ROUTE_FOR_ORDER"
  | "SIMULATE_ROUTING"
  | "OPTIMIZE_ROUTING"

  // QUALITY
  | "BLOCK_BATCH"
  | "RELEASE_BATCH"
  | "TRIGGER_QUALITY_CHECK"

  // COMMUNICATION
  | "SEND_EMAIL"
  | "NOTIFY_TEAM"
  | "CONTACT_SUPPLIER"
  | "SEND_NOTIFICATION"

  // AI TOOLS
  | "GENERATE_SCENARIOS"
  | "SUMMARIZE_CONTEXT"
  | "ANOMALY_EXPLANATION"
  | "EXTRACT_STRUCTURED_DATA"
  | "GENERATE_REPORT"
  | "SUMMARIZE_DATA"

  // PROJECT
  | "PLAN_TASK"
  | "UPDATE_PROJECT_TASK"
  | "REPLAN_PROJECT"
  | "ALLOCATE_PROJECT_RESOURCES"

  // FALLBACK
  | "UNKNOWN";

/* =====================================================
 FINAL ACTION TYPE
===================================================== */

export type ActionType = PlannerActionType | CapabilityId;

/* =====================================================
 BASE ACTION
===================================================== */

export interface BaseAction {
  type: ActionType;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  blocking?: boolean;
  metadata?: Record<string, unknown>;
}

/* =====================================================
 SPECIFIC ACTIONS
===================================================== */

export interface ExpediteSupplierAction extends BaseAction {
  type: "EXPEDITE_SUPPLIER";
  supplierId: string;
  orderId: string;
}

export interface AllocateInventoryAction extends BaseAction {
  type: "ALLOCATE_INVENTORY";
  sku: string;
  quantity: number;
}

export interface RescheduleProductionAction extends BaseAction {
  type: "RESCHEDULE_PRODUCTION";
  workOrderId: string;
  newDate: string;
}

export interface ShortTermProductionAdjustAction extends BaseAction {
  type: "SHORT_TERM_PRODUCTION_ADJUST";
  sku: string;
  qty: number;
  availableInDays?: number;
}

export interface SendEmailAction extends BaseAction {
  type: "SEND_EMAIL";
  to: string;
  subject: string;
  body?: string;
}

export interface NotifyTeamAction extends BaseAction {
  type: "NOTIFY_TEAM";
  message: string;
}

/* =====================================================
 PLANNER ACTION
===================================================== */

export type PlannerAction =
  | ExpediteSupplierAction
  | AllocateInventoryAction
  | RescheduleProductionAction
  | ShortTermProductionAdjustAction
  | SendEmailAction
  | NotifyTeamAction
  | BaseAction;