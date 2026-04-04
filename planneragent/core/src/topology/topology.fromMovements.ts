// core/src/topology/topology.fromMovements.ts
// ======================================================
// PlannerAgent — Topology from Movements (v6 — contextual + availability)
// Canonical Source of Truth
// ======================================================

import { TopologyGraph } from "./topology.graph";
import { mapMovementToEvent } from "../semantic/movement.semantic";
import { normalizeInventory } from "../normalization/inventory.normalizer";

// ------------------------------------------------------

type EnrichedMovement = {
  sku: string;
  qty: number;
  event: string;
  orderId?: string;
  commessa?: string;
  batch?: string;
  date?: string;
};

// ------------------------------------------------------

function str(v: unknown): string | undefined {
  const out = String(v ?? "").trim();
  return out.length > 0 ? out : undefined;
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(v: unknown): string | undefined {
  const s = str(v);
  return s ?? undefined;
}

function buildContextKey(m: EnrichedMovement): string {
  return [
    m.orderId ?? "",
    m.commessa ?? "",
    m.batch ?? "",
    m.date ?? ""
  ].join("|");
}

function enrichMovement(m: any): EnrichedMovement {
  return {
    sku: str(
      m.sku ??
      m.article ??
      m.codart
    ) ?? "",
    qty: num(
      m.qty ??
      m.quantity ??
      m.qta ??
      m.qta_mov
    ),
    event: mapMovementToEvent(m),

    orderId: str(
      m.orderId ??
      m.order_id ??
      m.mo_idord ??
      m.idord ??
      m.documentId
    ),

    commessa: str(
      m.commessa ??
      m.job ??
      m.jobId ??
      m.mo_commessa ??
      m.ord_commessa
    ),

    batch: str(
      m.batch ??
      m.lot ??
      m.lotto ??
      m.batchId
    ),

    date: normalizeDate(
      m.date ??
      m.data ??
      m.mov_date ??
      m.documentDate
    )
  };
}

function sameOperationalContext(
  a: EnrichedMovement,
  b: EnrichedMovement
): boolean {
  if (a.orderId && b.orderId) return a.orderId === b.orderId;
  if (a.commessa && b.commessa) return a.commessa === b.commessa;
  if (a.batch && b.batch) return a.batch === b.batch;
  if (a.date && b.date) return a.date === b.date;

  return false;
}

// ------------------------------------------------------

export function buildTopologyFromMovements(
  graph: TopologyGraph,
  movements?: any[],
  inventory?: any[]   // 👈 NEW
) {
  console.log("MOVEMENTS_RAW", movements);

  if (!movements || movements.length === 0) {
    console.log("NO MOVEMENTS PROVIDED");
    return;
  }

  // --------------------------------------------------
  // ENRICH MOVEMENTS
  // --------------------------------------------------

  const enriched: EnrichedMovement[] = movements
    .map(enrichMovement)
    .filter((m) => m.sku);

  for (const m of enriched) {
    console.log("MOVE_ENRICHED", m);
  }

  const productionLoads = enriched.filter(
    (m) => m.event === "PRODUCTION_LOAD"
  );

  const consumptions = enriched.filter(
    (m) => m.event === "COMPONENT_CONSUMPTION"
  );

  console.log("PRODUCTION_LOADS", productionLoads);
  console.log("COMPONENT_CONSUMPTIONS", consumptions);

  // --------------------------------------------------
  // ADD PRODUCT NODES
  // --------------------------------------------------

  for (const p of productionLoads) {
    graph.addNode({
      id: p.sku,
      kind: "finished_good"
    });
  }

  for (const c of consumptions) {
    graph.addNode({
      id: c.sku,
      kind: "component"
    });
  }

  // --------------------------------------------------
  // ADD INVENTORY NODES + AVAILABILITY
  // --------------------------------------------------

  const normalizedInventory = normalizeInventory(inventory);

  for (const inv of normalizedInventory) {

    if (!inv.sku) continue;

    console.log("INVENTORY_NORMALIZED", inv);  // 👈 QUI
    
    const invNodeId = `INV_${inv.sku}`;

    graph.addNode({
      id: invNodeId,
      kind: "inventory"
    });

    if (inv.qty > 0) {
      console.log("ADDING AVAILABILITY EDGE", invNodeId, "->", inv.sku);

      graph.addEdge({
        from: invNodeId,
        to: inv.sku,
        relation: "available",
        weight: inv.qty
      });
    }
  }

  // --------------------------------------------------
  // PAIRING LOGIC
  // --------------------------------------------------

  if (productionLoads.length === 0 || consumptions.length === 0) {
    console.log("SKIP_PAIRING_NO_MATCHING_EVENTS");
    return;
  }

  const usedPairs = new Set<string>();

  for (const p of productionLoads) {

    const matchedConsumptions = consumptions.filter((c) =>
      sameOperationalContext(p, c)
    );

    // -------------------------------
    // PRIMARY: context match
    // -------------------------------

    if (matchedConsumptions.length > 0) {

      console.log(
        "PAIRING_CONTEXT_MATCH",
        buildContextKey(p),
        matchedConsumptions
      );

      for (const c of matchedConsumptions) {

        const key = `${p.sku}->${c.sku}`;
        if (usedPairs.has(key)) continue;

        console.log("ADDING EDGE_CONTEXT", p.sku, "->", c.sku);

        graph.addEdge({
          from: p.sku,
          to: c.sku,
          relation: "consumes",
          weight: c.qty
        });

        usedPairs.add(key);
      }

      continue;
    }

    // -------------------------------
    // SECONDARY: date fallback
    // -------------------------------

    const sameDateConsumptions = consumptions.filter(
      (c) => p.date && c.date && p.date === c.date
    );

    if (sameDateConsumptions.length > 0) {

      console.log(
        "PAIRING_DATE_FALLBACK",
        p.date,
        sameDateConsumptions
      );

      for (const c of sameDateConsumptions) {

        const key = `${p.sku}->${c.sku}`;
        if (usedPairs.has(key)) continue;

        console.log("ADDING EDGE_DATE", p.sku, "->", c.sku);

        graph.addEdge({
          from: p.sku,
          to: c.sku,
          relation: "consumes",
          weight: c.qty
        });

        usedPairs.add(key);
      }

      continue;
    }

    // -------------------------------
    // LAST fallback
    // -------------------------------

    if (productionLoads.length === 1 && consumptions.length === 1) {

      const c = consumptions[0];
      const key = `${p.sku}->${c.sku}`;

      if (!usedPairs.has(key)) {

        console.log("ADDING EDGE_SINGLE_FALLBACK", p.sku, "->", c.sku);

        graph.addEdge({
          from: p.sku,
          to: c.sku,
          relation: "consumes",
          weight: c.qty
        });

        usedPairs.add(key);
      }
    }
  }

  console.log("TOPOLOGY_FROM_MOVEMENTS_DONE_V6");
}