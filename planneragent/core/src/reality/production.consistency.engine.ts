// core/src/reality/production.consistency.engine.ts
// ======================================================
// PlannerAgent — Production Consistency Engine v1
// Canonical Source of Truth
// ======================================================

type Movement = {
  sku: string;
  qty: number;
  event: string;
  orderId?: string;
  parentSku?: string;
};

export type ProductionConsistencyIssue = {
  type:
    | "T_WITHOUT_U"
    | "U_WITHOUT_T"
    | "OVERCONSUMPTION"
    | "UNDERCONSUMPTION";
  orderId?: string;
  parentSku?: string;
  componentSku?: string;
  producedQty?: number;
  consumedQty?: number;
  message: string;
  severity: "HIGH" | "MEDIUM";
};

export type ProductionConsistencyResult = {
  issues: ProductionConsistencyIssue[];
  hasBlockingIssues: boolean;
  signals: string[];
};

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

function isProduction(m: Movement) {
  return m.event === "PRODUCTION_LOAD";
}

function isConsumption(m: Movement) {
  return m.event === "COMPONENT_CONSUMPTION";
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// ------------------------------------------------------
// MAIN
// ------------------------------------------------------

export function checkProductionConsistency(
  movements: Movement[]
): ProductionConsistencyResult {

  const issues: ProductionConsistencyIssue[] = [];
  const signals: string[] = [];

  // --------------------------------------------------
  // GROUP BY ORDER
  // --------------------------------------------------

  const byOrder = new Map<string, Movement[]>();

  for (const m of movements ?? []) {
    if (!m.orderId) continue;

    const arr = byOrder.get(m.orderId) ?? [];
    arr.push(m);
    byOrder.set(m.orderId, arr);
  }

  // --------------------------------------------------
  // ANALYZE EACH ORDER
  // --------------------------------------------------

  for (const [orderId, rows] of byOrder) {

    const production = rows.filter(isProduction);
    const consumption = rows.filter(isConsumption);

    const producedQty = production.reduce((s, m) => s + num(m.qty), 0);

    // --------------------------------------------------
    // 🔴 T senza U
    // --------------------------------------------------

    if (production.length > 0 && consumption.length === 0) {
      issues.push({
        type: "T_WITHOUT_U",
        orderId,
        parentSku: production[0]?.parentSku,
        producedQty,
        message: "Production posted without component consumption",
        severity: "HIGH",
      });

      signals.push(`T_WITHOUT_U:${orderId}`);
    }

    // --------------------------------------------------
    // 🔴 U senza T
    // --------------------------------------------------

    if (production.length === 0 && consumption.length > 0) {
      issues.push({
        type: "U_WITHOUT_T",
        orderId,
        componentSku: consumption[0]?.sku,
        consumedQty: consumption.reduce((s, m) => s + num(m.qty), 0),
        message: "Component consumption without production",
        severity: "HIGH",
      });

      signals.push(`U_WITHOUT_T:${orderId}`);
    }

    // --------------------------------------------------
    // RATIO CHECK (solo se entrambi presenti)
    // --------------------------------------------------

    if (production.length > 0 && consumption.length > 0) {

      const consumptionMap = new Map<string, number>();

      for (const m of consumption) {
        const prev = consumptionMap.get(m.sku) ?? 0;
        consumptionMap.set(m.sku, prev + Math.abs(num(m.qty)));
      }

      for (const [componentSku, consumedQty] of consumptionMap) {

        // semplice check: consumo > produzione → sospetto
        if (consumedQty > producedQty * 2) {
          issues.push({
            type: "OVERCONSUMPTION",
            orderId,
            parentSku: production[0]?.parentSku,
            componentSku,
            producedQty,
            consumedQty,
            message: "Component consumption exceeds expected production ratio",
            severity: "MEDIUM",
          });

          signals.push(`OVERCONSUMPTION:${orderId}:${componentSku}`);
        }

        if (consumedQty < producedQty * 0.1) {
          issues.push({
            type: "UNDERCONSUMPTION",
            orderId,
            parentSku: production[0]?.parentSku,
            componentSku,
            producedQty,
            consumedQty,
            message: "Component consumption unusually low vs production",
            severity: "MEDIUM",
          });

          signals.push(`UNDERCONSUMPTION:${orderId}:${componentSku}`);
        }
      }
    }
  }

  // --------------------------------------------------
  // RESULT
  // --------------------------------------------------

  const hasBlockingIssues = issues.some(i => i.severity === "HIGH");

  return {
    issues,
    hasBlockingIssues,
    signals,
  };
}