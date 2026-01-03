export interface Env {
  SERVICE_TOKEN: string; // secret
}

type Order = { id: string; sku: string; qty: number; dueDate: string };
type InventoryItem = { sku: string; qty: number };
type Movement = { sku: string; qty: number; date: string; type: "IN" | "OUT" };

type AnalyzeRequest = {
  asOf?: string;
  orders: Order[];
  inventory: InventoryItem[];
  movements?: Movement[];
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function unauthorized() {
  return json({ ok: false, error: "Forbidden" }, 403);
}

function assertServiceAuth(req: Request, env: Env): boolean {
  const token = req.headers.get("X-Service-Auth");
  return Boolean(token && token === env.SERVICE_TOKEN);
}

function parseISODateOnly(s: string): number {
  // expects YYYY-MM-DD
  return new Date(s + "T00:00:00Z").getTime();
}

function parseISOMaybe(s: string): number {
  return new Date(s).getTime();
}

function safeNumber(n: any): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return x;
}

function cloneStock(inv: InventoryItem[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of inv) {
    m.set(it.sku, (m.get(it.sku) ?? 0) + safeNumber(it.qty));
  }
  return m;
}

function applyMovement(stock: Map<string, number>, mv: Movement) {
  const cur = stock.get(mv.sku) ?? 0;
  const qty = safeNumber(mv.qty);
  const delta = mv.type === "IN" ? qty : -qty;
  stock.set(mv.sku, cur + delta);
}

function stockToArray(stock: Map<string, number>): InventoryItem[] {
  return [...stock.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([sku, qty]) => ({ sku, qty }));
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // Public-ish health for internal debugging ONLY (still protected by auth)
    if (path === "/health") {
      if (!assertServiceAuth(req, env)) return unauthorized();
      return json({ service: "planneragent-core", status: "ok", ts: new Date().toISOString() });
    }

    // Policies
     if (url.pathname === "/policies/active") {
      const row = await env.POLICIES_DB
        .prepare("SELECT * FROM policies WHERE status = 'active' LIMIT 1")
        .first();
      return json({ ok: true, policy: row })
    }

    // Your existing endpoint (still protected)
    if (path === "/plans/allowed") {
      if (!assertServiceAuth(req, env)) return unauthorized();
      return json({ allowedPlans: ["BASIC"], reason: "Default system state", from: "CORE" });
    }

    if (path === "/analyze" && req.method === "POST") {
      if (!assertServiceAuth(req, env)) return unauthorized();

      let body: AnalyzeRequest;
      try {
        body = (await req.json()) as AnalyzeRequest;
      } catch {
        return json({ ok: false, error: "Invalid JSON body" }, 400);
      }

      const asOf = body.asOf ?? new Date().toISOString();
      const orders = (body.orders ?? []).slice();
      const inventory = body.inventory ?? [];
      const movements = (body.movements ?? []).slice();

      // validate minimal
      for (const o of orders) {
        if (!o?.id || !o?.sku || !o?.dueDate) {
          return json({ ok: false, error: "Order missing id/sku/dueDate" }, 400);
        }
        o.qty = safeNumber(o.qty);
      }
      for (const i of inventory) {
        if (!i?.sku) return json({ ok: false, error: "Inventory missing sku" }, 400);
        i.qty = safeNumber(i.qty);
      }
      for (const m of movements) {
        if (!m?.sku || !m?.date || !m?.type) {
          return json({ ok: false, error: "Movement missing sku/date/type" }, 400);
        }
        m.qty = safeNumber(m.qty);
        if (m.type !== "IN" && m.type !== "OUT") {
          return json({ ok: false, error: "Movement type must be IN|OUT" }, 400);
        }
      }

      // deterministic ordering
      orders.sort((a, b) => {
        const d = parseISODateOnly(a.dueDate) - parseISODateOnly(b.dueDate);
        if (d !== 0) return d;
        return a.id.localeCompare(b.id);
      });

      movements.sort((a, b) => {
        const d = parseISODateOnly(a.date) - parseISODateOnly(b.date);
        if (d !== 0) return d;
        return `${a.sku}:${a.type}`.localeCompare(`${b.sku}:${b.type}`);
      });

      const stock = cloneStock(inventory);

      const results = orders.map((o) => {
        const dueTs = parseISODateOnly(o.dueDate);

        // create a per-order view of movements up to dueDate
        const applicable = movements.filter((m) => parseISODateOnly(m.date) <= dueTs && m.sku === o.sku);

        // we simulate availability for this SKU only: current onHand + applicable movements
        let available = stock.get(o.sku) ?? 0;
        const steps: Array<{ source: string; qty: number }> = [];

        // allocate from onHand first
        const takeOnHand = Math.max(0, Math.min(available, o.qty));
        if (takeOnHand > 0) steps.push({ source: "onHand", qty: takeOnHand });

        let allocated = takeOnHand;
        let remaining = o.qty - allocated;

        // then apply movements in date order, allocating only from net positive availability
        for (const mv of applicable) {
          // apply movement to available
          available += mv.type === "IN" ? mv.qty : -mv.qty;

          // if IN created availability, allocate
          if (mv.type === "IN" && remaining > 0 && available > allocated) {
            // incremental availability from this IN vs previously allocated
            const incremental = Math.max(0, Math.min(remaining, available - allocated));
            if (incremental > 0) {
              allocated += incremental;
              remaining -= incremental;
              steps.push({ source: `movement:IN@${mv.date}`, qty: incremental });
              if (remaining <= 0) break;
            }
          }
        }

        const shortage = Math.max(0, remaining);

        // commit allocation to global stock (for this SKU) using allocated qty,
        // and also commit ALL movements up to dueDate once, to keep global consistency.
        // To avoid double-applying movements across orders, we apply movements globally only once at end.
        // So here we only subtract allocation from stock.
        stock.set(o.sku, (stock.get(o.sku) ?? 0) - allocated);

        return {
          orderId: o.id,
          sku: o.sku,
          qty: o.qty,
          dueDate: o.dueDate,
          allocated,
          shortage,
          allocationSteps: steps,
        };
      });

      // After allocations, apply ALL movements globally once (end-of-horizon view)
      // This gives "endingInventory" as onHand + movements - allocations.
      // We apply movements up to max dueDate for determinism.
      const maxDue = orders.length ? Math.max(...orders.map((o) => parseISODateOnly(o.dueDate))) : parseISOMaybe(asOf);
      for (const mv of movements) {
        if (parseISODateOnly(mv.date) <= maxDue) applyMovement(stock, mv);
      }

      return json({
        ok: true,
        asOf,
        results,
        endingInventory: stockToArray(stock),
        meta: {
          engine: "CORE_LOGICO_V1",
          rules: [
            "orders sorted by dueDate,id",
            "allocate onHand then IN movements up to dueDate",
            "OUT movements reduce availability",
            "deterministic output",
          ],
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};