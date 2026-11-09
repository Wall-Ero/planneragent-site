import { afterEach, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const guard = createRequire(import.meta.url)("../../../qualification/teacher-one-shot/offline.network-deny.cjs");
afterEach(() => {
  vi.doUnmock("../../../qualification/teacher-one-shot/live.contracts");
  vi.doUnmock("../../../qualification/teacher-one-shot/live.credential");
  vi.restoreAllMocks(); vi.useRealTimers(); vi.resetModules();
});

// Each child verifies the inherited guard BEFORE trying the real Node API. No HTTPS mocks.
const guardedChild = (body: string) => spawnSync(process.execPath, ["--input-type=module", "-e", `
const guard = globalThis[Symbol.for("planneragent.oneshot.offline.network-denial.v1")];
if (!guard) { console.error("GUARD_MISSING"); process.exit(90); }
${body}`], { encoding: "utf8", timeout: 10000 });

it.each([
  ["HTTPS default", "(await import('node:https')).default.request('https://example.invalid/')", "tls.connect"],
  ["HTTPS named", "(await import('node:https')).request('https://example.invalid/')", "tls.connect"],
  ["HTTP", "(await import('node:http')).request('http://example.invalid/')", "net.createConnection"],
  ["TLS", "(await import('node:tls')).connect(443, 'example.invalid')", "tls.connect"],
  ["socket", "new (await import('node:net')).Socket().connect(443, 'example.invalid')", "socket.connect"],
  ["TCP", "(await import('node:net')).connect(443, 'example.invalid')", "net.connect"],
  ["fetch", "fetch('https://example.invalid/')", "fetch"],
  ["HTTP2", "(await import('node:http2')).connect('https://example.invalid/')", "http2.connect"],
  ["UDP", "(await import('node:dgram')).createSocket('udp4')", "dgram.createSocket"],
  ["DNS", "(await import('node:dns')).lookup('example.invalid', () => {})", "dns.lookup"],
])("denies real %s without a mock, credential, DNS lookup or socket", (_label, attempt, route) => {
  const result = guardedChild(`
let denied = false;
try { await (${attempt}); } catch (error) { denied = error.code === "OFFLINE_NETWORK_ACCESS_DENIED"; }
if (!denied) process.exit(91);
guard.acknowledgeExpectedAttempts([${JSON.stringify(route)}]);
console.log("DENIED_BEFORE_NETWORK");`);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe("DENIED_BEFORE_NETWORK");
});

it("a swallowed network denial still makes the Node subprocess fail", () => {
  const result = guardedChild(`try { await fetch('https://example.invalid/'); } catch {} `);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("OFFLINE_UNEXPECTED_NETWORK_ATTEMPT");
});

it("the original default-export-only spy mistake cannot escape the socket guard", () => {
  const result = guardedChild(`
const https = await import('node:https');
let spyCalls = 0;
https.default.request = () => { spyCalls++; };
let denied = false;
try { https.request('https://example.invalid/'); } catch (error) { denied = error.code === 'OFFLINE_NETWORK_ACCESS_DENIED'; }
if (!denied || spyCalls !== 0) process.exit(94);
guard.acknowledgeExpectedAttempts(['tls.connect']);
console.log('DEFAULT_SPY_ESCAPE_CONTAINED');`);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe("DEFAULT_SPY_ESCAPE_CONTAINED");
});

it("socket denial survives mock restoration and cannot be replaced", () => {
  const result = guardedChild(`
const { Socket } = await import('node:net');
const descriptor = Object.getOwnPropertyDescriptor(Socket.prototype, 'connect');
if (descriptor.writable || descriptor.configurable) process.exit(92);
try { Socket.prototype.connect = () => {}; process.exit(93); } catch {}
console.log('IMMUTABLE_DENIAL');`);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe("IMMUTABLE_DENIAL");
});

it("missing HTTPS injection reaches the independent denial, never external transport", async () => {
  guard.assertNoUnexpectedAttempts();
  const root = mkdtempSync(join(tmpdir(), "pa-13ks-"));
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
  vi.doMock("../../../qualification/teacher-one-shot/live.contracts", async importOriginal => {
    const actual: any = await importOriginal();
    return { ...actual, LIVE_NETWORK_ENABLED_V1: true, FIXED_LIVE_STATE_DIRECTORY_V1: root,
      createNativeExperimentManifestV1: () => ({ ...actual.createNativeExperimentManifestV1(), state_location: root }) };
  });
  vi.doMock("../../../qualification/teacher-one-shot/live.credential", () => ({
    readDedicatedTokenV1: async () => "SYNTHETIC_OFFLINE_CREDENTIAL_123456",
  }));
  try {
    const auth = await import("../../../qualification/teacher-one-shot/live.authorization");
    const { runNativeLiveTransportExperimentV1 } = await import("../../../qualification/teacher-one-shot/live.transport");
    const receipt = await runNativeLiveTransportExperimentV1({ ...auth.nativeAuthorizationChallengeV1(), confirmation: auth.nativeAuthorizationPhraseV1(),
      hosted_input_uncertainty_acknowledgment: auth.nativeHostedInputAcknowledgmentPhraseV1() });
    expect(receipt).toMatchObject({ outcome: "UNCERTAIN", failure_code: "CONNECTION_FAILED", neurons: "UNKNOWN" });
    // Sanitization in production must not let a missing mock pass its offline test silently.
    expect(() => guard.assertNoUnexpectedAttempts()).toThrow("OFFLINE_UNEXPECTED_NETWORK_ATTEMPT");
    guard.acknowledgeExpectedAttempts(["tls.connect"]);
    expect(existsSync(join(root, "dispatch.json"))).toBe(true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

it("--inspect returns nonsecret data without credential acquisition, dispatch or state creation", () => {
  const directory = resolve("qualification/teacher-one-shot/live-state");
  const existed = existsSync(directory);
  const result = spawnSync(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script",
    resolve("qualification/teacher-one-shot/live.native.cli.ts"), "--inspect"], { encoding: "utf8", timeout: 25000 });
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({ real_dispatch_enabled: false, teacher: "DISABLED", lifecycle: "SHADOW" });
  expect(result.stdout).not.toContain("token (hidden)");
  expect(existsSync(directory)).toBe(existed);
  const source = readFileSync("qualification/teacher-one-shot/live.native.cli.ts", "utf8");
  const inspectBranch = source.slice(source.indexOf('if (args.length === 1 && args[0] === "--inspect")'), source.indexOf('if (args.length !== 1'));
  expect(inspectBranch).toContain("return;");
  expect(inspectBranch).not.toMatch(/runNative|readDedicatedToken|createInterface|question\(/);
});
