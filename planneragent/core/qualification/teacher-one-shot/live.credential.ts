import { OneShotTransportErrorV1 } from "./live.contracts";

// Console only: no argv, environment, file, OAuth or redirected stdin credential source.
// Raw mode suppresses echo on the Windows Node console as well as POSIX terminals.
export async function readDedicatedTokenV1(): Promise<string> {
  const input = process.stdin;
  if (!input.isTTY || !process.stdout.isTTY || typeof input.setRawMode !== "function") {
    throw new OneShotTransportErrorV1("INTERACTIVE_CONSOLE_REQUIRED");
  }
  return new Promise((resolve, reject) => {
    let token = "";
    const wasRaw = input.isRaw;
    const wasPaused = input.isPaused();
    const finish = (valid: boolean) => {
      input.removeListener("data", onData);
      input.removeListener("error", onError);
      input.removeListener("end", onError);
      try {
        input.setRawMode(wasRaw);
        if (wasPaused) input.pause();
        process.stdout.write("\n");
      } catch { valid = false; }
      const result = token; token = "";
      if (valid && /^[A-Za-z0-9_-]{20,256}$/.test(result)) resolve(result);
      else reject(new OneShotTransportErrorV1("CREDENTIAL_ENTRY_CANCELLED_OR_INVALID"));
    };
    const onError = () => finish(false);
    const onData = (chunk: Buffer) => {
      for (const c of chunk.toString("utf8")) {
        if (c === "\r" || c === "\n") { finish(true); return; }
        if (c === "\u0003" || c === "\u0004" || c === "\u001b") { finish(false); return; }
        if (c === "\b" || c === "\u007f") token = token.slice(0, -1);
        else if (/^[A-Za-z0-9_-]$/.test(c) && token.length < 256) token += c;
        else { finish(false); return; }
      }
    };
    try {
      process.stdout.write("Dedicated planneragent-teacher-oneshot token (hidden): ");
      input.setRawMode(true);
      input.on("data", onData); input.once("error", onError); input.once("end", onError); input.resume();
    } catch { finish(false); }
  });
}
