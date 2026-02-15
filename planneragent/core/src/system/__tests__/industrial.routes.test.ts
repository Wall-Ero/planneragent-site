// core/src/system/__tests__/industrial.routes.test.ts
// =====================================================
// P6 — Industrial Fabric Lite HTTP
// Verifies:
// - /system/industrial/registry
// - /system/connectors
// =====================================================

import { describe, it, expect } from "vitest";
import worker from "../../worker";

// side-effect imports (register real connectors)
import "../../connectors/erp.sap.adapter";
import "../../connectors/mail.smtp.adapter";

async function mockFetch(path: string) {
  const req = new Request(`http://localhost${path}`, {
    method: "GET",
  });

  const env = {
    SNAPSHOT_HMAC_SECRET: "test-secret",
    ENVIRONMENT: "test",
    VERSION: "test",
  };

  return worker.fetch(req, env as any);
}

describe("P6 — Industrial Fabric Lite HTTP", () => {
  it("exposes industrial system registry", async () => {
    const res = await mockFetch("/system/industrial/registry");
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      ok: boolean;
      registry: {
        connectors: unknown[];
        capabilities: Record<string, unknown>;
      };
    };

    expect(json.ok).toBe(true);
    expect(Array.isArray(json.registry.connectors)).toBe(true);
    expect(typeof json.registry.capabilities).toBe("object");
  });

  it("exposes connectors list", async () => {
    const res = await mockFetch("/system/connectors");
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      ok: boolean;
      connectors: unknown[];
    };

    expect(json.ok).toBe(true);
    expect(Array.isArray(json.connectors)).toBe(true);
  });
});