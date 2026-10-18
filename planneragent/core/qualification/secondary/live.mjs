import { build } from "esbuild";
import { fileURLToPath } from "node:url";

// Deliberate invocation only. No dotenv files, saved secrets, or OpenRouter key.
let evidence = { SECONDARY_RESOLVED: "NO", IDENTITY_VERIFIED: "NO", INTERPRET_COMPLETED: "NO", INTERACTION: "NONE", RESOLUTION: "NONE", PRODUCT_FOCUS: "NONE", GRANTS_AUTHORITY: "UNKNOWN", GRANTS_EXECUTION: "UNKNOWN", SEMANTIC_INTERPRETATION_CONSUMED: "NO", GOVERNED_MEANING_PRESERVED: "NO", HTTP_STATUS: 0 };
let passed = false;
try {
  if (process.argv.length !== 3 || process.argv[2] !== "--live") throw new Error("EXPLICIT_LIVE_INVOCATION_REQUIRED");
  const required = ["INTERPRETATION_STUDENT_ENDPOINT", "INTERPRETATION_STUDENT_AUTHORIZATION", "INTERPRETATION_STUDENT_TIMEOUT_MS"];
  if (required.some(key => !process.env[key]?.trim())) throw new Error("CONFIGURATION_REQUIRED");
  const bundle = await build({ entryPoints: [fileURLToPath(new URL("./harness.ts", import.meta.url))], bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent" });
  const harness = await import("data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].text).toString("base64"));
  const result = await harness.qualifySecondaryBoundary({
    env: { INTERPRETATION_STUDENT_LIVE_STATE: "SECONDARY", INTERPRETATION_STUDENT_SECONDARY_KILL_SWITCH: "false", ...Object.fromEntries(required.map(key => [key, process.env[key]])) },
    studentFetch: globalThis.fetch,
  });
  evidence = result.evidence;
  passed = harness.qualificationPassed(evidence);
} catch { /* Never print exceptions, endpoint values, credentials, or payloads. */ }
for (const [key, value] of Object.entries(evidence)) process.stdout.write(`${key}=${value}\n`);
process.exitCode = passed ? 0 : 1;
