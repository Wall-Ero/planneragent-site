// core/datasets/dataAwareness.types.ts
// ====================================
// Canonical — DATA AWARENESS taxonomy
// ====================================

export type DataAwarenessLevel =
  | "SNAPSHOT"
  | "BEHAVIORAL"
  | "STRUCTURAL";

export type DataAwarenessDefinition = {
  level: DataAwarenessLevel;

  description: string;

  requires: {
    static_files?: boolean;
    transactional_events?: boolean;
    master_data?: boolean;
    structural_links?: boolean;
    forecasting?: boolean;
  };
};

export const DATA_AWARENESS_MAP: Record<
  DataAwarenessLevel,
  DataAwarenessDefinition
> = {
  SNAPSHOT: {
    level: "SNAPSHOT",
    description:
      "Static data uploads without temporal continuity or relational structure.",
    requires: {
      static_files: true,
    },
  },

  BEHAVIORAL: {
    level: "BEHAVIORAL",
    description:
      "Transactional and temporal event data enabling behavioral pattern detection.",
    requires: {
      static_files: true,
      transactional_events: true,
    },
  },

  STRUCTURAL: {
    level: "STRUCTURAL",
    description:
      "Relational, structural and forecast-aware model of the operational system.",
    requires: {
      static_files: true,
      transactional_events: true,
      master_data: true,
      structural_links: true,
      forecasting: true,
    },
  },
};