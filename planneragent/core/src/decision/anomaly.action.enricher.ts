// core/src/decision/anomaly.action.enricher.ts

export type EnrichedAction = {
  action: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  blocking: boolean;
  effort: "LOW" | "MEDIUM" | "HIGH";
};

/**
 * Maps raw anomaly action codes into enriched, governance-ready actions.
 * Input: string[] (raw anomaly reasons / action codes)
 * Output: EnrichedAction[]
 */
export function enrichAnomalyActions(
  actions: string[]
): EnrichedAction[] {
  return actions.map((action) => {
    switch (action) {
      case "VERIFY_TOPOLOGY_NODE":
        return {
          action,
          priority: "HIGH",
          blocking: true,
          effort: "LOW",
        };

      case "CHECK_INVENTORY_MISMATCH":
        return {
          action,
          priority: "HIGH",
          blocking: true,
          effort: "MEDIUM",
        };

      case "REVIEW_DEMAND_SPIKE":
        return {
          action,
          priority: "MEDIUM",
          blocking: false,
          effort: "LOW",
        };

      default:
        return {
          action,
          priority: "LOW",
          blocking: false,
          effort: "LOW",
        };
    }
  });
}