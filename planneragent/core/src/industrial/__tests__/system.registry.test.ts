import { describe, it, expect } from "vitest";
import { getSystemRegistry } from "../system.registry";

// side-effect imports
import "../../connectors/erp.sap.adapter";
import "../../connectors/mail.smtp.adapter";

describe("P6.1 — Industrial System Registry", () => {
  it("exposes connectors and capabilities", async () => {
    const registry = await getSystemRegistry();

    expect(Object.keys(registry.capabilities).length).toBeGreaterThan(0);
    expect(registry.connectors.length).toBe(2);

    const capIds = Object.keys(registry.capabilities);
    expect(capIds).toContain("notify_supplier");
  });
});
