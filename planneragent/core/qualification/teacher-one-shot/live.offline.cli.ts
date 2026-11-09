import { fileURLToPath } from "node:url";
import { createInjectedExperimentManifestV1, inspectLiveTransportAvailabilityV1, OFFLINE_AUTHORIZATION_V1 } from "./live.contracts";
import { createValidInjectedHttpFixtureV1 } from "./live.fixtures";
import { InjectedHttpFixtureClientV1 } from "./live.http";
import { LiveAttemptJournalV1 } from "./live.journal";
import { runInjectedLiveTransportExperimentV1 } from "./live.transport";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--inspect") { console.log(JSON.stringify(inspectLiveTransportAvailabilityV1(), null, 2)); return; }
  if (args.length !== 1 || args[0] !== "--offline-demo") throw new Error("OFFLINE_ONLY");
  const journal = LiveAttemptJournalV1.isolatedOfflineFixture(fileURLToPath(new URL("./injected-demo-state/", import.meta.url)));
  console.log(JSON.stringify(await runInjectedLiveTransportExperimentV1(createInjectedExperimentManifestV1(), OFFLINE_AUTHORIZATION_V1,
    new InjectedHttpFixtureClientV1(createValidInjectedHttpFixtureV1()), journal), null, 2));
}
main().catch(() => { console.error("ONE_SHOT_LIVE_TRANSPORT_DISABLED_OR_ATTEMPT_CONSUMED"); process.exitCode = 1; });
