// planneragent/dev/testSignature.ts

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>();

  const sorter = (_key: string, value: any) => {
    if (value && typeof value === "object") {
      if (seen.has(value)) return undefined;
      seen.add(value);

      if (Array.isArray(value)) return value;

      const out: Record<string, unknown> = {};
      for (const k of Object.keys(value).sort()) out[k] = value[k];
      return out;
    }
    return value;
  };

  return JSON.stringify(obj, sorter);
}

function signSnapshot(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

const payloadPath = path.resolve("dev/payload.json");
const secret = "planneragent-dev-hmac-secret-2026";

const raw = fs.readFileSync(payloadPath, "utf8");
const body = JSON.parse(raw);

if (!body.snapshot) {
  throw new Error("payload.json: snapshot mancante");
}

const unsignedSnapshot = { ...body.snapshot };
delete unsignedSnapshot.signature;

const snapshotPayload = stableStringify(unsignedSnapshot);
const signature = signSnapshot(snapshotPayload, secret);

body.snapshot.signature = signature;

fs.writeFileSync(payloadPath, JSON.stringify(body, null, 2));

console.log("SIGNATURE:", signature);
console.log("UPDATED:", payloadPath);