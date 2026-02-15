// core/src/connectors/mail.smtp.adapter.ts
import { registerConnector } from "../industrial/system.registry";
import type { IndustrialConnector } from "../industrial/system.registry";

const smtpAdapter: IndustrialConnector = {
  id: "mail-smtp",
  vendor: "Generic SMTP",
  capabilities: [
    {
      id: "notify_supplier",
      domain: "communication",
      verb: "notify",
      description: "Send email notification to supplier",
    },
  ],
  async health() {
    return { ok: true, vendor: "SMTP", latency_ms: 40 };
  },
};

registerConnector(smtpAdapter);