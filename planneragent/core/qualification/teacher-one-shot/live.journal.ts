import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1 } from "../../src/conversation/cognition/hybrid.conversational.contracts.v1";
import { createInjectedExperimentManifestV1, createNativeExperimentManifestV1, FIXED_LIVE_STATE_DIRECTORY_V1, OneShotTransportErrorV1,
  type ExperimentManifestV1, type LiveAttemptReceiptV1 } from "./live.contracts";
import { writeExclusiveSyncedV1 } from "./local-state";

// Local one-shot gate only, not D1, quota accounting or a second operational ledger.
export class LiveAttemptJournalV1 {
  private reserved = false;
  private dispatched = false;
  private nativeRequestClaimed = false;
  private manifestDigest = "";
  private reservationRecord = "";
  private constructor(private readonly directory: string, readonly storage_mode: "FIXED_LIVE_LOCATION" | "ISOLATED_OFFLINE_FIXTURE") {}
  static fixedLocation(): LiveAttemptJournalV1 { return new LiveAttemptJournalV1(FIXED_LIVE_STATE_DIRECTORY_V1, "FIXED_LIVE_LOCATION"); }
  // Test/fixture virtualization cannot be used for real dispatch, which remains denied.
  static isolatedOfflineFixture(directory: string): LiveAttemptJournalV1 {
    if (!isAbsolute(directory) || resolve(directory) === resolve(directory, "..") || resolve(directory) === resolve(FIXED_LIVE_STATE_DIRECTORY_V1)) throw new OneShotTransportErrorV1("JOURNAL_FIXTURE_PATH_INVALID");
    return new LiveAttemptJournalV1(resolve(directory), "ISOLATED_OFFLINE_FIXTURE");
  }
  private assertLocation(): void {
    if (this.storage_mode === "FIXED_LIVE_LOCATION" && resolve(this.directory) !== resolve(FIXED_LIVE_STATE_DIRECTORY_V1)) throw new OneShotTransportErrorV1("JOURNAL_LOCATION_INVALID");
    // Reject symlinks/junctions in ALL existing ancestors; never follow a state alias.
    for (let p = this.directory; ; p = dirname(p)) {
      if (existsSync(p) && (lstatSync(p).isSymbolicLink() || !lstatSync(p).isDirectory())) throw new OneShotTransportErrorV1("JOURNAL_LOCATION_INVALID");
      if (p === dirname(p)) break;
    }
    if (!existsSync(this.directory)) mkdirSync(this.directory, { mode: 0o700 });
    if (realpathSync(this.directory).toLowerCase() !== resolve(this.directory).toLowerCase()) throw new OneShotTransportErrorV1("JOURNAL_LOCATION_INVALID");
  }
  reserve(manifest: ExperimentManifestV1): void {
    if (hybridCanonicalV1(manifest) !== hybridCanonicalV1(manifest.mode === "NATIVE_HTTPS_ONESHOT" ? createNativeExperimentManifestV1() : createInjectedExperimentManifestV1())) throw new OneShotTransportErrorV1("MANIFEST_INVALID");
    if (this.reserved) throw new OneShotTransportErrorV1("ATTEMPT_ALREADY_RESERVED");
    try {
      this.assertLocation();
      if (["reserved.json", "dispatch.json", "result.json"].some(f => existsSync(join(this.directory, f)))) throw new Error();
      const metadata = { version: 1, journal_kind: "LIVE_ATTEMPT_JOURNAL_V1", execution_mode: manifest.mode, experiment_id: manifest.experiment_id,
        payload_digest: manifest.payload_digest, model: manifest.model, account_id: manifest.account_id,
        authorization_evidence_ref: manifest.authorization_evidence_ref, authorized_state_location: manifest.state_location,
        manifest_digest: hybridDigestV1(manifest), attempt_state: "RESERVED_NO_REPLAY" };
      writeExclusiveSyncedV1(join(this.directory, "reserved.json"), metadata);
      this.manifestDigest = metadata.manifest_digest; this.reservationRecord = hybridCanonicalV1(metadata); this.reserved = true;
    } catch { throw new OneShotTransportErrorV1("RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE"); }
  }
  acquireDispatchPermission(): void {
    if (!this.reserved || this.dispatched) throw new OneShotTransportErrorV1("DISPATCH_PERMISSION_DENIED");
    try {
      this.assertLocation();
      const stored = JSON.parse(readFileSync(join(this.directory, "reserved.json"), "utf8"));
      if (hybridCanonicalV1(stored) !== this.reservationRecord) throw new Error();
      writeExclusiveSyncedV1(join(this.directory, "dispatch.json"), { version: 1, manifest_digest: this.manifestDigest,
        attempt_state: "DISPATCH_PERMISSION_CONSUMED_OUTCOME_MAY_BE_UNKNOWN" });
      this.dispatched = true;
    } catch { throw new OneShotTransportErrorV1("DISPATCH_PERMISSION_DENIED"); }
  }
  claimNativeRequest(): void {
    if (this.storage_mode !== "FIXED_LIVE_LOCATION" || !this.dispatched || this.nativeRequestClaimed ||
        this.manifestDigest !== hybridDigestV1(createNativeExperimentManifestV1()) ||
        this.inspect().state !== "CONSUMED_OUTCOME_UNKNOWN") throw new OneShotTransportErrorV1("DISPATCH_PERMISSION_DENIED");
    this.nativeRequestClaimed = true;
  }
  finish(receipt: LiveAttemptReceiptV1): void {
    if (!this.dispatched) throw new OneShotTransportErrorV1("DISPATCH_PERMISSION_DENIED");
    try { writeExclusiveSyncedV1(join(this.directory, "result.json"), hybridSnapshotV1(receipt)); }
    catch { throw new OneShotTransportErrorV1("TERMINAL_RECEIPT_UNAVAILABLE_NO_RETRY"); }
  }
  inspect() {
    const reserved = existsSync(join(this.directory, "reserved.json")), dispatch = existsSync(join(this.directory, "dispatch.json")), result = existsSync(join(this.directory, "result.json"));
    return Object.freeze({ state: result ? "STOPPED" : dispatch ? "CONSUMED_OUTCOME_UNKNOWN" : reserved ? "RESERVED_RECOVERY_DENIED" : "UNCLAIMED",
      reserved, dispatch, result, automatic_retry_allowed: false });
  }
}
