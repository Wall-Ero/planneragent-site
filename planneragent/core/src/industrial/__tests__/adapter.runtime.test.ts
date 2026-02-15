// core/src/industrial/__tests__/adapter.runtime.test.ts
// =====================================================
// P6.2 — Industrial Adapter Runtime
// Verifies:
// - capability resolution
// - connector selection
// - single-action execution
// =====================================================

import { describe, it, expect, beforeAll } from "vitest";
import { executeAdapter } from "../adapter.runtime";
import { getSystemRegistry } from "../system.registry";

// side-effect imports (register connectors)
import "../../connectors/erp.sap.adapter";
import "../../connectors/mail.smtp.adapter";

describe("P6.2 — Industrial Adapter Runtime", () => {
  beforeAll(async () => {
    const registry = await getSystemRegistry();
    expect(registry.connectors.length).toBeGreaterThan(0);
  });

  it("executes a capability via exactly one connector", async () => {
    const res = await executeAdapter({
      capability_id: "notify_supplier",
      payload: {
        supplier_id: "SUP-001",
        message: "Delay confirmed",
      },
    });

    expect(res.ok).toBe(true);

    if (!res.ok) return;

    expect(res.capability_id).toBe("notify_supplier");
    expect(typeof res.connector_id).toBe("string");
    expect(res.executed_at).toBeDefined();
    expect(res.output).toBeDefined();
  });

  it("fails if capability does not exist", async () => {
    const res = await executeAdapter({
      capability_id: "non_existing_capability",
      payload: {},
    });

    expect(res.ok).toBe(false);
  });
});