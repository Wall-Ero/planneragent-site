import type { TrustedSignCompositionResult } from "../trusted.sign.composition";
import {
  reserveTrustedSignExecution,
  type TrustedSignReplayReservation,
  type TrustedSignReplayReservationStore,
} from "../trusted.sign.anti.replay";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
class AtomicMemoryStore implements TrustedSignReplayReservationStore {
  private readonly keys = new Set<string>();
  async reserveIfAbsent(value: TrustedSignReplayReservation): Promise<boolean> {
    if (this.keys.has(value.replayKey)) return false;
    this.keys.add(value.replayKey);
    return true;
  }
}
const composition: Extract<
  TrustedSignCompositionResult,
  { composed: true }
> = {
  composed: true,
  compositionId: "90000000-0000-4000-8000-000000000001",
  composedAt: "2026-07-26T10:00:00.000Z",
  governanceDecisionId: "20000000-0000-4000-8000-000000000001",
  infrastructureAuthorizationId: "30000000-0000-4000-8000-000000000001",
  mechanismsAuthorizationId: "60000000-0000-4000-8000-000000000001",
  subjectId: "80000000-0000-4000-8000-000000000001",
  tenantId: "tenant-1",
  companyId: "company-1",
  proofProfileId: "PLANNERAGENT_FDC_SIGN_V1",
  proofProfileVersion: "1",
  providerKeyReference: "arn:aws:kms:key/example",
  providerAlgorithm: "RSASSA_PSS_SHA_256",
  messageType: "RAW",
  signingInput: new Uint8Array([1, 2, 3]),
};

async function run(): Promise<void> {
  const store = new AtomicMemoryStore();
  const attempts = await Promise.all([
    reserveTrustedSignExecution(
      composition,
      "e0000000-0000-4000-8000-000000000001",
      "2026-07-26T10:00:01.000Z",
      store,
    ),
    reserveTrustedSignExecution(
      { ...composition,
        compositionId: "90000000-0000-4000-8000-000000000002" },
      "e0000000-0000-4000-8000-000000000002",
      "2026-07-26T10:00:01.000Z",
      store,
    ),
  ]);
  assert(
    attempts.filter(attempt => attempt.reserved).length === 1,
    "only one concurrent SIGN reservation succeeds",
  );
  assert(
    attempts.some(attempt =>
      !attempt.reserved && attempt.denialReason === "SIGN_REPLAY_DETECTED"
    ),
    "replayed SIGN fails closed",
  );
  const changedSubject = await reserveTrustedSignExecution(
    { ...composition,
      subjectId: "80000000-0000-4000-8000-000000000002" },
    "e0000000-0000-4000-8000-000000000003",
    "2026-07-26T10:00:01.000Z",
    store,
  );
  assert(changedSubject.reserved, "different governed subject has distinct identity");
  const failedStore = await reserveTrustedSignExecution(
    { ...composition,
      subjectId: "80000000-0000-4000-8000-000000000003" },
    "e0000000-0000-4000-8000-000000000004",
    "2026-07-26T10:00:01.000Z",
    { async reserveIfAbsent() { throw new Error("storage unavailable"); } },
  );
  assert(
    !failedStore.reserved &&
      failedStore.denialReason === "REPLAY_COORDINATION_FAILED",
    "coordination storage failure fails closed",
  );
  console.log("Trusted SIGN anti-replay runner completed.");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
