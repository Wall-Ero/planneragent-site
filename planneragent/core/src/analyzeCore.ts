import type { ScenarioAdvisoryV2 } from "./sandbox/contracts.v2";

type InventoryItem = any;
type Order = any;
type Movement = any;


export interface AnalyzeResult {
  asOf: string;
  results: {
    orderId: string;
    sku: string;
    qty: number;
    dueDate: string;
    allocated: number;
    shortage: number;
    allocationSteps: any[];
  }[];
  endingInventory: InventoryItem[];
  meta: {
    engine: string;
    rules: string[];
  };
}

export function analyzeCore(input: {
  asOf: string;
  orders: Order[];
  inventory: InventoryItem[];
  movements: Movement[];
}): AnalyzeResult {
  // 👇 QUI CI VA ESATTAMENTE IL CODICE
  // che ora hai inline in /analyze

  return {
    asOf: input.asOf,
    results: [],
    endingInventory: [],
    meta: {
      engine: "CORE_LOGICO_V1",
      rules: [
        "orders sorted by dueDate,id",
        "allocate onHand then IN movements up to dueDate",
        "OUT movements reduce availability",
        "deterministic output"
      ]
    }
  };
}
