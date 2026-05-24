// core/src/pressure/runtime.pressure.memory.ts
// ============================================================

import type {
  GovernancePressureResult,
} from "./runtime.pressure.types";

export interface RuntimePressureMemoryRecord {

  issued_at: string;

  pressure: GovernancePressureResult;
}

export function appendPressureMemory(
  history: RuntimePressureMemoryRecord[],
  pressure: GovernancePressureResult
): RuntimePressureMemoryRecord[] {

  return [
    ...history,
    {
      issued_at: new Date().toISOString(),
      pressure,
    },
  ];
}