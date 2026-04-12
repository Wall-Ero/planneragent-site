// core/src/execution/action.capability.mapper.ts

import { PlannerAction } from "./action.types";

/* =====================================================
 TYPES
===================================================== */

export type CapabilityMapping = {
  id: string;
};

/* =====================================================
 MAPPER
===================================================== */

export function mapActionToCapability(
  action: PlannerAction
): CapabilityMapping | null {

  switch (action.type) {

    // =========================
    // PROCUREMENT
    // =========================

    case "CREATE_PURCHASE_ORDER":
      return { id: "CREATE_PURCHASE_ORDER" };

    case "UPDATE_PURCHASE_ORDER":
      return { id: "UPDATE_PURCHASE_ORDER" };

    case "CANCEL_PURCHASE_ORDER":
      return { id: "CANCEL_PURCHASE_ORDER" };

    case "EXPEDITE_SUPPLIER":
      return { id: "EXPEDITE_SUPPLIER" };

    case "CHANGE_SUPPLIER":
      return { id: "CHANGE_SUPPLIER" };

    case "NEGOTIATE_SUPPLIER":
    case "MANAGE_SUPPLIER_RELATION":
      return { id: "MANAGE_SUPPLIER_RELATION" };

    case "CHECK_SUPPLIER_COMPLIANCE":
      return { id: "CHECK_SUPPLIER_COMPLIANCE" };


    // =========================
    // PRODUCTION
    // =========================

    case "SCHEDULE_PRODUCTION":
    case "RESCHEDULE_PRODUCTION":
    case "SHORT_TERM_PRODUCTION_ADJUST": // 🔥 importante
      return { id: "RESCHEDULE_PRODUCTION" };

    case "CANCEL_PRODUCTION_ORDER":
      return { id: "CANCEL_PRODUCTION_ORDER" };

    case "ADJUST_PRODUCTION_PLAN":
      return { id: "REBALANCE_PLAN" };

    case "SPLIT_PRODUCTION_ORDER":
      return { id: "SPLIT_PRODUCTION_ORDER" };

    case "MERGE_PRODUCTION_ORDERS":
      return { id: "MERGE_PRODUCTION_ORDERS" };


    // =========================
    // INVENTORY
    // =========================

    case "ALLOCATE_INVENTORY":
      return { id: "ALLOCATE_INVENTORY" };

    case "REALLOCATE_INVENTORY":
      return { id: "REALLOCATE_INVENTORY" };

    case "RESERVE_STOCK":
      return { id: "RESERVE_STOCK" };

    case "ADJUST_SAFETY_STOCK":
      return { id: "ADJUST_SAFETY_STOCK" };

    case "CORRECT_INVENTORY":
      return { id: "CORRECT_INVENTORY" };


    // =========================
    // PLANNING / OPTIMIZATION
    // =========================

    case "REBALANCE_PLAN":
      return { id: "REBALANCE_PLAN" };

    case "FREEZE_PLAN":
      return { id: "FREEZE_PLAN" };

    case "UNFREEZE_PLAN":
      return { id: "UNFREEZE_PLAN" };


    // =========================
    // LOGISTICS
    // =========================

    case "RESCHEDULE_DELIVERY":
      return { id: "RESCHEDULE_DELIVERY" };

    case "CHANGE_TRANSPORT_MODE":
      return { id: "CHANGE_TRANSPORT_MODE" };

    case "CONSOLIDATE_SHIPMENT":
      return { id: "CONSOLIDATE_SHIPMENT" };

    case "SPLIT_SHIPMENT":
      return { id: "SPLIT_SHIPMENT" };


    // =========================
    // QUALITY
    // =========================

    case "BLOCK_BATCH":
      return { id: "BLOCK_BATCH" };

    case "RELEASE_BATCH":
      return { id: "RELEASE_BATCH" };

    case "TRIGGER_QUALITY_CHECK":
      return { id: "TRIGGER_QUALITY_CHECK" };


    // =========================
    // COMMUNICATION
    // =========================

    case "SEND_EMAIL":
      return { id: "SEND_EMAIL" };

    case "NOTIFY_TEAM":
      return { id: "NOTIFY_TEAM" };


    // =========================
    // UNKNOWN / FALLBACK
    // =========================

    case "UNKNOWN":
    default:
      return null;
  }
}