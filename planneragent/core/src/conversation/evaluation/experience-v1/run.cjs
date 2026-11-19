"use strict";
// Run from any directory: node <path>/run.cjs. No package install or network.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const core = path.resolve(__dirname, "../../../.."), repo = path.resolve(core, "../..");
require(path.join(core, "qualification/teacher-one-shot/offline.network-deny.cjs"));
const output = path.join(__dirname, "artifacts");
fs.mkdirSync(output, { recursive: true });
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const hashFile = file => fs.existsSync(file) ? hash(fs.readFileSync(file)) : null;
const gitDir = path.join(repo, ".git");
const readHead = () => {
  const head = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
  if (!head.startsWith("ref: ")) return head;
  const ref = head.slice(5), loose = path.join(gitDir, ref);
  if (fs.existsSync(loose)) return fs.readFileSync(loose, "utf8").trim();
  return fs.readFileSync(path.join(gitDir, "packed-refs"), "utf8").split(/\r?\n/).find(line => line.endsWith(` ${ref}`))?.split(" ")[0];
};
const expectedHead = "98add4bd27833b526d426d1686ef2567deb2962d";
if (readHead() !== expectedHead) throw Error("BENCHMARK_HEAD_MISMATCH");
const indexBefore = hashFile(path.join(gitDir, "index"));
// Hash the complete local source trees that can participate in this harness,
// including concurrent changes. Record content hashes, never credentials/data.
const files = [];
const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) { if (!["node_modules", "assets", "dist", "artifacts", ".vite"].includes(entry.name)) walk(file); }
  else if (/\.(?:ts|mts|cjs|json|css)$/.test(entry.name)) files.push(file);
} };
for (const dir of ["planneragent/core/src", "planneragent/gateway/src", "planneragent/ui"]) walk(path.join(repo, dir));
for (const name of ["vitest.operational.chat.offline.config.mts", "vitest.natural.capabilities.offline.config.mts", "vitest.semantic.exposure.offline.config.mts", "qualification/teacher-one-shot/offline.network-deny.cjs", "qualification/teacher-one-shot/offline.network.setup.ts", "package-lock.json"]) files.push(path.join(core, name));
const snapshot = () => Object.fromEntries(files.sort().map(file => [path.relative(repo, file).replaceAll("\\", "/"), hashFile(file)]));
const sourceBefore = snapshot(), executionId = crypto.randomUUID();
// Do not forward host credentials or runtime provider configuration to tests.
const env = {};
for (const key of ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "WINDIR", "ComSpec", "PATHEXT", "TEMP", "TMP", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "NODE_OPTIONS"]) if (process.env[key]) env[key] = process.env[key];
Object.assign(env, { CI: "true", NO_COLOR: "1", STEP13R_B_EXECUTION_ID: executionId,
  STEP13R_B_REPORT: path.join(output, "observed.v1.json") });
const child = spawnSync(process.execPath, [path.join(core, "node_modules/vitest/vitest.mjs"), "run", "--config", path.join(__dirname, "vitest.config.mts"), "--reporter=default", "--reporter=json", `--outputFile.json=${path.join(output, "harness.v1.json")}`], {
  cwd: core, env, encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024,
});
fs.writeFileSync(path.join(output, "execution.v1.log"), (child.stdout ?? "") + (child.stderr ?? ""));
process.stdout.write(child.stdout ?? ""); process.stderr.write(child.stderr ?? "");
const sourceAfter = snapshot(), indexAfter = hashFile(path.join(gitDir, "index"));
const unchanged = JSON.stringify(sourceBefore) === JSON.stringify(sourceAfter) && indexBefore === indexAfter && readHead() === expectedHead;
let report, harness;
try { report = JSON.parse(fs.readFileSync(env.STEP13R_B_REPORT, "utf8")); harness = JSON.parse(fs.readFileSync(path.join(output, "harness.v1.json"), "utf8")); } catch {}
const complete = report?.execution_id === executionId && report.scenarios.length === require("./corpus.v1.json").scenarios.length && report.network_deny.length === 6;
const integrity = child.status === 0 && !child.error && unchanged && complete && harness?.success === true;
const provenance = { expected_head: expectedHead, actual_head: readHead(), index_sha256_before: indexBefore, index_sha256_after: indexAfter,
  source_sha256: sourceBefore, sources_and_index_unchanged_during_run: unchanged,
  environment_policy: "ALLOWLIST_ONLY_NO_PROVIDER_CREDENTIALS", execution_id: executionId,
  node: process.version, started_from: core, child_exit_code: child.status, child_error: child.error?.message ?? null,
  harness_integrity: integrity ? "PASS" : "FAIL", report_complete: complete,
  tests: harness ? { total: harness.numTotalTests, passed: harness.numPassedTests, failed: harness.numFailedTests, pending: harness.numPendingTests, todo: harness.numTodoTests } : null,
};
fs.writeFileSync(path.join(output, "provenance.v1.json"), JSON.stringify(provenance, null, 2) + "\n");
if (report?.execution_id === executionId) {
  const counts = rows => Object.fromEntries(["SUPPORTED", "FAILED", "NOT_MEASURABLE"].map(outcome => [outcome, rows.filter(row => row.outcome === outcome).length]));
  report.harness_integrity = provenance.harness_integrity;
  report.product_results = counts(report.scenarios);
  report.coverage = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i + 1, counts(report.scenarios.filter(row => row.families.includes(i + 1)))]));
  report.contextual_failures = report.scenarios.filter(row => row.goal === "CONTEXT" && row.outcome === "FAILED").map(row => row.id);
  report.clarification_failures = report.scenarios.filter(row => row.goal === "CLARIFICATION" && row.outcome === "FAILED").map(row => row.id);
  fs.writeFileSync(env.STEP13R_B_REPORT, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ harness_integrity: provenance.harness_integrity, tests: provenance.tests, product_results: report.product_results, contextual_failures: report.contextual_failures }, null, 2) + "\n");
}
process.exitCode = integrity ? 0 : 1;
