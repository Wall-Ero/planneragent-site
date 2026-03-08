// core/src/sandbox/reality/inferBomFromOrders.v1.ts
// ======================================================
// PlannerAgent — Infer BOM from Orders
// Canonical Source of Truth
//
// Reverse engineers BOM from production orders.
//
// PLAN BOM = snapshot of BOM when MRP generated orders.
// ======================================================

export type OrderRow = {
  order?: string
  orderId?: string
  parentOrder?: string
  parent?: string
  article?: string
  sku?: string
  item?: string
  quantity?: number
  qty?: number
  type?: string
}

export type InferredBomComponent = {
  component: string
  ratio: number
  samples: number
}

export type InferredBomParent = {
  parent: string
  components: InferredBomComponent[]
  confidence: number
}

export type BomInferenceFromOrders = {
  bom: InferredBomParent[]
  signals: string[]
}

function normalizeOrderId(o: OrderRow): string {
  return String(o.orderId ?? o.order ?? "").trim()
}

function normalizeSku(o: OrderRow): string {
  return String(o.sku ?? o.article ?? o.item ?? "").trim()
}

function normalizeQty(o: OrderRow): number {
  const q = Number(o.qty ?? o.quantity ?? 0)
  return Number.isFinite(q) ? q : 0
}

export function inferBomFromOrders(
  orders: OrderRow[]
): BomInferenceFromOrders {

  const signals: string[] = []

  const parents = new Map<
    string,
    { parentSku: string; qty: number }
  >()

  const componentsByParent = new Map<
    string,
    Array<{ sku: string; qty: number }>
  >()

  for (const o of orders ?? []) {

    const orderId = normalizeOrderId(o)
    const sku = normalizeSku(o)
    const qty = normalizeQty(o)

    if (!orderId || !sku || qty <= 0) continue

    const type = String(o.type ?? "").toUpperCase()

    if (type.includes("PROD") || type.includes("PRODUCTION")) {

      parents.set(orderId, {
        parentSku: sku,
        qty
      })

    } else if (o.parentOrder || o.parent) {

      const parentId = String(o.parentOrder ?? o.parent).trim()

      if (!componentsByParent.has(parentId)) {
        componentsByParent.set(parentId, [])
      }

      componentsByParent.get(parentId)!.push({
        sku,
        qty
      })

    }

  }

  const bom: InferredBomParent[] = []

  for (const [orderId, parentInfo] of parents.entries()) {

    const comps = componentsByParent.get(orderId)
    if (!comps || comps.length === 0) continue

    const compAgg = new Map<string, { qty: number; samples: number }>()

    for (const c of comps) {

      if (!compAgg.has(c.sku)) {
        compAgg.set(c.sku, { qty: 0, samples: 0 })
      }

      const entry = compAgg.get(c.sku)!
      entry.qty += c.qty
      entry.samples++

    }

    const components: InferredBomComponent[] = []

    for (const [sku, agg] of compAgg.entries()) {

      const ratio = parentInfo.qty > 0
        ? agg.qty / parentInfo.qty
        : 0

      components.push({
        component: sku,
        ratio,
        samples: agg.samples
      })

    }

    bom.push({
      parent: parentInfo.parentSku,
      components,
      confidence: Math.min(1, components.length * 0.25 + 0.25)
    })

    signals.push(`plan_bom:${parentInfo.parentSku}`)

  }

  return {
    bom,
    signals
  }

}