// core/src/reality/assumption.registry.ts
// ======================================================
// PlannerAgent — Assumption Registry
// Canonical Source of Truth
// ======================================================

import type {
  AssumptionRecord,
  AssumptionCategory,
  RealitySource
} from "./reality.types";

export class AssumptionRegistry {

  private assumptions: AssumptionRecord[] = [];

  add(params: {
    category: AssumptionCategory;
    value: number | string | boolean;
    source?: RealitySource;
    reason: string;
    confidence?: number;
  }): AssumptionRecord {

    const record: AssumptionRecord = {
      id: crypto.randomUUID(),
      category: params.category,
      value: params.value,
      source: params.source ?? "assumed",
      reason: params.reason,
      confidence: params.confidence ?? 0.4,
      created_at: new Date().toISOString()
    };

    this.assumptions.push(record);

    return record;
  }

  list(): AssumptionRecord[] {
    return [...this.assumptions];
  }

  isEmpty(): boolean {
    return this.assumptions.length === 0;
  }
}
