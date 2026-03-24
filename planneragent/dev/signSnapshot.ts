// planneragent/dev/signSnapshot.ts

import crypto from "crypto";

export function signSnapshot(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}
