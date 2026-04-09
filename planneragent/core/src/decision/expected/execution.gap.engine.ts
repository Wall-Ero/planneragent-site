//core/src/decision/expected/execution.gap.engine.ts

// ======================================================
// PlannerAgent — Execution Gap Engine V1
// ======================================================

type Expected = {
  sku: string;
  expectedQty: number;
};

type Movement = {
  sku: string;
  qty: number;
  event: string;
};

export type ExecutionGap = {
  sku: string;
  expected: number;
  actual: number;
  delta: number;
  type: "UNDERCONSUMPTION" | "OVERCONSUMPTION" | "OK";
};

export function computeExecutionGap(
  expected: Expected[],
  movements: Movement[]
): ExecutionGap[] {
  const actualMap = new Map<string, number>();

  for (const m of movements) {
    if (m.event !== "COMPONENT_CONSUMPTION") continue;

    const prev = actualMap.get(m.sku) ?? 0;
    actualMap.set(m.sku, prev + m.qty);
  }

  return expected.map((e) => {
    const actual = actualMap.get(e.sku) ?? 0;
    const delta = actual - e.expectedQty;

    let type: ExecutionGap["type"] = "OK";

    if (delta < 0) type = "UNDERCONSUMPTION";
    if (delta > 0) type = "OVERCONSUMPTION";

    return {
      sku: e.sku,
      expected: e.expectedQty,
      actual,
      delta,
      type,
    };
  });
}