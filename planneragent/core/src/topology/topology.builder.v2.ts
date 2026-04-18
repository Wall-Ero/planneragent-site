// core/src/topology/topology.builder.v2.ts
// ======================================================
// Path: core/src/topology/topology.builder.v2.ts
// PlannerAgent — Topology Builder V2
// Canonical Snapshot · Source of Truth
// ======================================================

export type TopologyNodeKind =
  | "SKU"
  | "INVENTORY"
  | "ORDER"
  | "COMMESSA"
  | "UNKNOWN";

export type TopologyEdgeKind =
  | "BOM"
  | "CONSUMPTION"
  | "PRODUCTION"
  | "ORDER_LINK"
  | "AVAILABILITY"
  | "UNKNOWN";

export type TopologyNode = {
  id: string;
  kind: TopologyNodeKind;
  sku?: string;
  orderId?: string;
  commessa?: string;
  batch?: string;
  metadata?: Record<string, unknown>;
};

export type TopologyEdge = {
  from: string;
  to: string;
  kind: TopologyEdgeKind;
  qty?: number;
  confidence?: number;
  source?: "MOVEMENTS" | "ORDERS" | "ERP_BOM" | "INFERRED_BOM" | "INVENTORY";
  metadata?: Record<string, unknown>;
};

export type TopologyGraph = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
};

type InventoryRow = {
  sku?: string;
  qty?: number;
  warehouse?: string;
};

type MovementRow = {
  sku?: string;
  qty?: number;
  type?: string;
  event?: string;
  orderId?: string;
  commessa?: string;
  batch?: string;
  parentSku?: string;
  producedSku?: string;
  consumedSku?: string;
};

type BomRow = {
  parent?: string;
  component?: string;
  qty?: number;
};

function safeString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function safeNumber(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function uniquePushNode(map: Map<string, TopologyNode>, node: TopologyNode): void {
  if (!node.id) return;
  if (!map.has(node.id)) {
    map.set(node.id, node);
  }
}

function pushEdge(edges: TopologyEdge[], edge: TopologyEdge): void {
  if (!edge.from || !edge.to) return;
  edges.push(edge);
}

function edgeKey(edge: TopologyEdge): string {
  return [
    edge.from,
    edge.to,
    edge.kind,
    edge.qty ?? "",
    edge.source ?? "",
  ].join("::");
}

function dedupeEdges(edges: TopologyEdge[]): TopologyEdge[] {
  const seen = new Set<string>();
  const out: TopologyEdge[] = [];

  for (const edge of edges) {
    const key = edgeKey(edge);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(edge);
  }

  return out;
}

function normalizeEventName(row: MovementRow): string {
  return String(row.event ?? row.type ?? "UNKNOWN").toUpperCase();
}

function isConsumptionEvent(row: MovementRow): boolean {
  const event = normalizeEventName(row);
  return (
    event.includes("CONSUM") ||
    event.includes("COMPONENT_CONSUMPTION") ||
    event === "U"
  );
}

function isProductionEvent(row: MovementRow): boolean {
  const event = normalizeEventName(row);
  return (
    event.includes("PRODUCTION") ||
    event.includes("RECEIPT") ||
    event === "T"
  );
}

function buildSkuNodeId(sku: string): string {
  return `SKU_${sku}`;
}

function buildInventoryNodeId(sku: string): string {
  return `INV_${sku}`;
}

function buildOrderNodeId(orderId: string): string {
  return `ORDER_${orderId}`;
}

function buildCommessaNodeId(commessa: string): string {
  return `COMMESSA_${commessa}`;
}

export function buildOperationalTopology(input: {
  inventory?: InventoryRow[];
  movements?: MovementRow[];
  movmag?: MovementRow[];
  orders?: Array<Record<string, unknown>>;
  inferredBom?: BomRow[];
}): TopologyGraph {
  const inventory = input.inventory ?? [];
  const movements = [
    ...(input.movements ?? []),
    ...(input.movmag ?? []),
  ];
  const orders = input.orders ?? [];
  const inferredBom = input.inferredBom ?? [];

  const nodeMap = new Map<string, TopologyNode>();
  const edges: TopologyEdge[] = [];

  // --------------------------------------------------
  // 1. INVENTORY NODES + AVAILABILITY
  // --------------------------------------------------

  for (const row of inventory) {
    const sku = safeString(row.sku);
    if (!sku) continue;

    const skuNodeId = buildSkuNodeId(sku);
    const invNodeId = buildInventoryNodeId(sku);

    uniquePushNode(nodeMap, {
      id: skuNodeId,
      kind: "SKU",
      sku,
      metadata: {
        source: "inventory",
      },
    });

    uniquePushNode(nodeMap, {
      id: invNodeId,
      kind: "INVENTORY",
      sku,
      metadata: {
        qty: safeNumber(row.qty),
        warehouse: safeString(row.warehouse),
      },
    });

    pushEdge(edges, {
      from: invNodeId,
      to: skuNodeId,
      kind: "AVAILABILITY",
      qty: safeNumber(row.qty),
      confidence: 1,
      source: "INVENTORY",
    });
  }

  // --------------------------------------------------
  // 2. BOM EDGES
  // --------------------------------------------------

  for (const row of inferredBom) {
    const parent = safeString(row.parent);
    const component = safeString(row.component);
    if (!parent || !component) continue;

    const parentId = buildSkuNodeId(parent);
    const componentId = buildSkuNodeId(component);

    uniquePushNode(nodeMap, {
      id: parentId,
      kind: "SKU",
      sku: parent,
    });

    uniquePushNode(nodeMap, {
      id: componentId,
      kind: "SKU",
      sku: component,
    });

    pushEdge(edges, {
      from: componentId,
      to: parentId,
      kind: "BOM",
      qty: safeNumber(row.qty),
      confidence: 1,
      source: "INFERRED_BOM",
    });
  }

  // --------------------------------------------------
  // 3. ORDER NODES + LINKS
  // --------------------------------------------------

  for (const row of orders) {
    const orderId = safeString((row as any).orderId) ?? safeString((row as any).id);
    const sku = safeString((row as any).sku);
    const commessa = safeString((row as any).commessa);

    if (orderId) {
      const orderNodeId = buildOrderNodeId(orderId);

      uniquePushNode(nodeMap, {
        id: orderNodeId,
        kind: "ORDER",
        orderId,
        sku,
        commessa,
      });

      if (sku) {
        const skuNodeId = buildSkuNodeId(sku);

        uniquePushNode(nodeMap, {
          id: skuNodeId,
          kind: "SKU",
          sku,
        });

        pushEdge(edges, {
          from: orderNodeId,
          to: skuNodeId,
          kind: "ORDER_LINK",
          confidence: 1,
          source: "ORDERS",
        });
      }

      if (commessa) {
        const commessaNodeId = buildCommessaNodeId(commessa);

        uniquePushNode(nodeMap, {
          id: commessaNodeId,
          kind: "COMMESSA",
          commessa,
        });

        pushEdge(edges, {
          from: commessaNodeId,
          to: orderNodeId,
          kind: "ORDER_LINK",
          confidence: 1,
          source: "ORDERS",
        });
      }
    }
  }

  // --------------------------------------------------
  // 4. MOVEMENT-BASED RECONSTRUCTION
  // --------------------------------------------------

  for (const row of movements) {
    const sku = safeString(row.sku);
    const orderId = safeString(row.orderId);
    const commessa = safeString(row.commessa);
    const parentSku = safeString(row.parentSku) ?? safeString(row.producedSku);
    const componentSku = safeString(row.consumedSku) ?? sku;
    const qty = Math.abs(safeNumber(row.qty) ?? 0);

    if (orderId) {
      uniquePushNode(nodeMap, {
        id: buildOrderNodeId(orderId),
        kind: "ORDER",
        orderId,
        sku: parentSku,
        commessa,
      });
    }

    if (commessa) {
      uniquePushNode(nodeMap, {
        id: buildCommessaNodeId(commessa),
        kind: "COMMESSA",
        commessa,
      });
    }

    if (isConsumptionEvent(row) && componentSku && parentSku) {
      const componentId = buildSkuNodeId(componentSku);
      const parentId = buildSkuNodeId(parentSku);

      uniquePushNode(nodeMap, {
        id: componentId,
        kind: "SKU",
        sku: componentSku,
      });

      uniquePushNode(nodeMap, {
        id: parentId,
        kind: "SKU",
        sku: parentSku,
      });

      pushEdge(edges, {
        from: componentId,
        to: parentId,
        kind: "CONSUMPTION",
        qty,
        confidence: 0.9,
        source: "MOVEMENTS",
        metadata: {
          orderId,
          commessa,
          event: normalizeEventName(row),
        },
      });

      if (orderId) {
        pushEdge(edges, {
          from: buildOrderNodeId(orderId),
          to: parentId,
          kind: "ORDER_LINK",
          qty,
          confidence: 0.8,
          source: "MOVEMENTS",
        });
      }

      if (commessa) {
        pushEdge(edges, {
          from: buildCommessaNodeId(commessa),
          to: parentId,
          kind: "ORDER_LINK",
          qty,
          confidence: 0.8,
          source: "MOVEMENTS",
        });
      }
    }

    if (isProductionEvent(row) && parentSku) {
      const parentId = buildSkuNodeId(parentSku);

      uniquePushNode(nodeMap, {
        id: parentId,
        kind: "SKU",
        sku: parentSku,
      });

      if (orderId) {
        pushEdge(edges, {
          from: buildOrderNodeId(orderId),
          to: parentId,
          kind: "PRODUCTION",
          qty,
          confidence: 0.9,
          source: "MOVEMENTS",
          metadata: {
            commessa,
            event: normalizeEventName(row),
          },
        });
      }

      if (commessa) {
        pushEdge(edges, {
          from: buildCommessaNodeId(commessa),
          to: parentId,
          kind: "PRODUCTION",
          qty,
          confidence: 0.8,
          source: "MOVEMENTS",
        });
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: dedupeEdges(edges),
  };
}