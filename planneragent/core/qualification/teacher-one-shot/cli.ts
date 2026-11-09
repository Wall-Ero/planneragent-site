import { resolve } from "node:path";
import { createOneShotDryRunConfigurationV1, inspectFrozenOneShotPayloadV1, runOneShotDryRunV1 } from "./executor";

// Deliberately no env, credential loader, network client, live switch or arbitrary prompt.
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--inspect") {
    console.log(JSON.stringify(inspectFrozenOneShotPayloadV1(), null, 2));
    return;
  }
  if (args.length !== 3 || args[0] !== "--dry-run" || args[1] !== "--state-dir" || !args[2]) throw new Error("INVALID_ARGUMENTS");
  console.log(JSON.stringify(await runOneShotDryRunV1(resolve(args[2]), createOneShotDryRunConfigurationV1()), null, 2));
}
main().catch(() => { console.error("ONE_SHOT_DENIED_OR_STOPPED_NO_RETRY"); process.exitCode = 1; });
