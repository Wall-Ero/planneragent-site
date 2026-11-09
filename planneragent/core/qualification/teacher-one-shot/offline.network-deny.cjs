"use strict";
// Test-only preload. Install before loading the runner; never import in production.
const key = Symbol.for("planneragent.oneshot.offline.network-denial.v1");
if (!globalThis[key]) {
  const { syncBuiltinESMExports } = require("node:module");
  const pending = [];
  const deny = route => function () {
    pending.push(route); // Fixed route label only: no URL, headers, credentials or raw error.
    const error = new Error("OFFLINE_NETWORK_ACCESS_DENIED");
    error.code = "OFFLINE_NETWORK_ACCESS_DENIED";
    throw error;
  };
  const lock = (owner, name, route) => Object.defineProperty(owner, name, {
    value: deny(route), writable: false, configurable: false,
  });
  const net = require("node:net"), tls = require("node:tls");
  lock(net.Socket.prototype, "connect", "socket.connect");
  lock(net, "connect", "net.connect");
  lock(net, "createConnection", "net.createConnection");
  lock(tls, "connect", "tls.connect");
  lock(require("node:http2"), "connect", "http2.connect");
  const dgram = require("node:dgram");
  lock(dgram, "createSocket", "dgram.createSocket");
  for (const name of ["send", "connect", "bind"]) lock(dgram.Socket.prototype, name, `dgram.${name}`);
  const dns = require("node:dns");
  for (const owner of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
    for (const name of Object.getOwnPropertyNames(owner)) {
      if ((name === "lookup" || name === "lookupService" || name.startsWith("resolve")) && typeof owner[name] === "function") {
        if (name === "lookup") continue;
        lock(owner, name, `dns.${name}`);
      }
    }
  }
  // Vite probes localhost during startup. Resolve it in memory, never through OS/DNS.
  const localResult = options => {
    const family = options === 6 || options?.family === 6 ? 6 : 4;
    const result = { address: family === 6 ? "::1" : "127.0.0.1", family };
    return options?.all ? [result] : result;
  };
  Object.defineProperty(dns.promises, "lookup", { configurable: false, writable: false,
    value: async (hostname, options) => hostname === "localhost" ? localResult(options) : deny("dns.lookup")(),
  });
  Object.defineProperty(dns, "lookup", { configurable: false, writable: false,
    value: (hostname, options, callback) => {
      if (hostname !== "localhost") return deny("dns.lookup")();
      if (typeof options === "function") { callback = options; options = undefined; }
      const result = localResult(options);
      process.nextTick(() => Array.isArray(result) ? callback(null, result) : callback(null, result.address, result.family));
    },
  });
  // Data-only fetch fixtures can still replace this entrypoint; socket denial remains immutable.
  globalThis.fetch = deny("fetch");
  syncBuiltinESMExports(); // Named built-in imports see the denied primitives too.
  const guard = Object.freeze({
    assertNoUnexpectedAttempts() {
      if (pending.length) throw new Error("OFFLINE_UNEXPECTED_NETWORK_ATTEMPT");
    },
    acknowledgeExpectedAttempts(expected) {
      if (JSON.stringify(pending) !== JSON.stringify(expected)) throw new Error("OFFLINE_DENIAL_EVIDENCE_MISMATCH");
      pending.length = 0;
    },
  });
  Object.defineProperty(globalThis, key, { value: guard, configurable: false, writable: false });
  // Node subprocesses, including regression CLI/crash probes, inherit the preload.
  const preload = `--require=${JSON.stringify(__filename)}`;
  if (!(process.env.NODE_OPTIONS || "").includes(preload)) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ""} ${preload}`.trim();
  }
  process.on("exit", () => {
    if (pending.length) {
      process.stderr.write("OFFLINE_UNEXPECTED_NETWORK_ATTEMPT\n");
      process.exitCode = 1;
    }
  });
}
module.exports = globalThis[key];
