//core/src/topology/topology.autoheal.ts

// ======================================================
// PlannerAgent — Topology Auto-Heal Layer
// ======================================================

type HealResult<T> = {
  data: T;
  warnings: string[];
};

function safeStr(v: any): string {
  return typeof v === "string" ? v.trim() : "";
}

function safeNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// -----------------------------------------------------
// ORDERS
// -----------------------------------------------------

export function healOrders(input: any[]): HealResult<any[]> {
  const warnings: string[] = [];

  const data = (input ?? []).map((o) => {
    const orderId = safeStr(o.orderId ?? o.id);
    const sku = safeStr(o.sku ?? o.item);

    if (!orderId && !sku) {
      warnings.push("ORDER_DROPPED_EMPTY");
      return null;
    }

    return {
      orderId: orderId || `AUTO_ORDER_${Math.random()}`,
      sku,
      commessa: safeStr(o.commessa),
    };
  }).filter(Boolean);

  return { data, warnings };
}

// -----------------------------------------------------
// INVENTORY
// -----------------------------------------------------

export function healInventory(input: any[]): HealResult<any[]> {
  const warnings: string[] = [];

  const data = (input ?? []).map((i) => {
    const sku = safeStr(i.sku ?? i.item);

    if (!sku) {
      warnings.push("INVENTORY_DROPPED_EMPTY_SKU");
      return null;
    }

    return {
      sku,
      qty: safeNum(i.qty ?? i.quantity),
      warehouse: safeStr(i.warehouse),
    };
  }).filter(Boolean);

  return { data, warnings };
}

// -----------------------------------------------------
// MOVEMENTS
// -----------------------------------------------------

export function healMovements(input: any[]): HealResult<any[]> {
  const warnings: string[] = [];

  const data = (input ?? []).map((m) => {
    const sku = safeStr(m.sku ?? m.item);
    const parentSku = safeStr(m.parentSku ?? m.producedSku);
    const consumedSku = safeStr(m.consumedSku ?? m.component);

    if (!sku && !parentSku) {
      warnings.push("MOVEMENT_DROPPED_NO_SKU");
      return null;
    }

    return {
      sku,
      qty: Math.abs(safeNum(m.qty ?? m.quantity)),

      type: safeStr(m.type ?? m.movementType),
      event: safeStr(m.event),

      orderId: safeStr(m.orderId ?? m.id),
      commessa: safeStr(m.commessa),

      parentSku,
      consumedSku,

      batch: safeStr(m.batch),
    };
  }).filter(Boolean);

  return { data, warnings };
}

// -----------------------------------------------------
// BOM (CRITICAL)
// -----------------------------------------------------

export function healBom(input: any[]): HealResult<any[]> {
  const warnings: string[] = [];

  const data = (input ?? []).map((b) => {
    const parent = safeStr(b.parentSku ?? b.parent);
    const component = safeStr(b.componentSku ?? b.component);

    if (!parent || !component) {
      warnings.push("BOM_DROPPED_INVALID_ROW");
      return null;
    }

    return {
      parent,
      component,
      qty: safeNum(b.qtyPer ?? b.ratio ?? b.qty ?? 1),
    };
  }).filter(Boolean);

  return { data, warnings };
}

// -----------------------------------------------------
// GLOBAL HEAL
// -----------------------------------------------------

export function autoHealTopologyInput(input: {
  orders: any[];
  inventory: any[];
  movements: any[];
  inferredBom: any[];
}) {
  const orders = healOrders(input.orders);
  const inventory = healInventory(input.inventory);
  const movements = healMovements(input.movements);
  const bom = healBom(input.inferredBom);

  const warnings = [
    ...orders.warnings,
    ...inventory.warnings,
    ...movements.warnings,
    ...bom.warnings,
  ];

  return {
    orders: orders.data,
    inventory: inventory.data,
    movements: movements.data,
    inferredBom: bom.data,
    warnings,
  };
}