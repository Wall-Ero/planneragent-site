// core/datasets/datasetClassifier.ts

export type DataAwarenessLevel = "SNAPSHOT" | "BEHAVIORAL" | "STRUCTURAL";

export type DatasetDescriptor = {
  hasSnapshot: boolean;           // CSV/Excel/one-off export
  hasBehavioralEvents: boolean;   // ordini/movimenti/eventi con timestamp
  hasStructuralData: boolean;     // anagrafiche/BOM/routing/capacità/constraint
};

export type DatasetClassificationResult = {
  level: DataAwarenessLevel;
  evidence: string[];
};

export function classifyDatasetDescriptor(
  d: DatasetDescriptor
): DatasetClassificationResult {
  if (d.hasStructuralData) {
    return { level: "STRUCTURAL", evidence: ["structural_data=true"] };
  }
  if (d.hasBehavioralEvents) {
    return { level: "BEHAVIORAL", evidence: ["behavioral_events=true"] };
  }
  // Nota: SNAPSHOT è “descrittivo”, non “predittivo”
  return { level: "SNAPSHOT", evidence: ["snapshot=true (or default)"] };
}

// ✅ Alias per riallineare il tuo main.ts
export const classifyDataset = classifyDatasetDescriptor;