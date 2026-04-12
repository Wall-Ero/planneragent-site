// core/src/execution/capability.resolver.ts

import { PlannerAction } from "./action.types";

export type CapabilityOption = {
  id: string;
  score?: number; // opzionale: ranking deterministico
};

export function resolveCapabilityOptions(
  action: PlannerAction
): CapabilityOption[] {

  switch (action.type) {

    // =========================
    // PRODUCTION
    // =========================

    case "SHORT_TERM_PRODUCTION_ADJUST":
      return [
        { id: "RESCHEDULE_PRODUCTION", score: 0.9 },
        { id: "SPLIT_PRODUCTION_ORDER", score: 0.6 },
        { id: "DELAY_ORDER", score: 0.4 }
      ];

    case "RESCHEDULE_PRODUCTION":
      return [
        { id: "RESCHEDULE_PRODUCTION", score: 1 }
      ];

    // =========================
    // PROCUREMENT
    // =========================

    case "EXPEDITE_SUPPLIER":
      return [
        { id: "EXPEDITE_SUPPLIER", score: 1 }
      ];

    // =========================
    // INVENTORY
    // =========================

    case "ALLOCATE_INVENTORY":
      return [
        { id: "ALLOCATE_INVENTORY", score: 1 },
        { id: "REALLOCATE_INVENTORY", score: 0.7 }
      ];

    // =========================
    // DEFAULT
    // =========================

    default:
      return [];
  }
}