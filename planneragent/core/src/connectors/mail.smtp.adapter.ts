// core/src/connectors/mail.smtp.adapter.ts
import { registerConnector } from "../industrial/system.registry";
import type { IndustrialConnector } from "../industrial/system.registry";
import { NOTIFY_SUPPLIER } from "../industrial/capabilities";

const smtpAdapter: IndustrialConnector = {
  id: "mail-smtp",
  vendor: "Generic SMTP",
  identity: Object.freeze({
    connectorId: "mail-smtp",
    identityId: "connector-identity:mail-smtp",
    credentialReference: "secret://connectors/mail-smtp",
  }),
  capabilities: [NOTIFY_SUPPLIER],
  async health() {
    return {
      ok: true,
      connectorIdentityId: "connector-identity:mail-smtp",
      checkedAt: new Date().toISOString(),
      latencyMs: 40,
    };
  },
  async execute(
    capability_id: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (capability_id !== "notify_supplier") {
      throw new Error(`SMTP adapter cannot execute '${capability_id}'`);
    }

    return { notified: true, payload };
  },
};

registerConnector(smtpAdapter);
