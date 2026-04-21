// core/src/decision/expected/execution.gap.engine.ts

// ======================================================
// PlannerAgent — Execution Gap Engine V2
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
  type:
    | "UNDERCONSUMPTION"
    | "OVERCONSUMPTION"
    | "OK"
    | "NO_EXECUTION_DATA";
};

export function computeExecutionGap(
  expected: Expected[],
  movements: Movement[]
): ExecutionGap[] {

  const hasAnyMovementData =
    Array.isArray(movements) && movements.length > 0;

  const actualMap = new Map<string, number>();

  for (const m of movements) {
    if (m.event !== "COMPONENT_CONSUMPTION") continue;

    const prev = actualMap.get(m.sku) ?? 0;
    actualMap.set(m.sku, prev + m.qty);
  }

  return expected.map((e) => {

    // 🔥 CASO 1 — nessun dato movimenti
    if (!hasAnyMovementData) {
      return {
        sku: e.sku,
        expected: e.expectedQty,
        actual: 0,
        delta: e.expectedQty,
        type: "NO_EXECUTION_DATA",
      };
    }

    const actual = actualMap.get(e.sku);

    // 🔥 CASO 2 — movimenti esistono ma non per questo SKU
    if (actual === undefined) {
      return {
        sku: e.sku,
        expected: e.expectedQty,
        actual: 0,
        delta: e.expectedQty,
        type: "NO_EXECUTION_DATA",
      };
    }

    const delta = actual - e.expectedQty;

    let type: ExecutionGap["type"] = "OK";

    if (delta < 0) type = "UNDERCONSUMPTION";
    else if (delta > 0) type = "OVERCONSUMPTION";

    return {
      sku: e.sku,
      expected: e.expectedQty,
      actual,
      delta,
      type,
    };
  });
}