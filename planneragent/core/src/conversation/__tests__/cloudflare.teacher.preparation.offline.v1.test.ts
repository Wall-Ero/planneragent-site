import "../../../qualification/teacher-one-shot/offline.network.setup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createPreparedExperimentManifestV1, preparedExperimentChallengeV1,
  preparedExperimentChallengeDigestV1, validatePreparedExperimentAuthorizationV1,
  PREPARED_STATE_DIRECTORY_V1, PREPARED_JOURNAL_NAMESPACE_V1 } from "../../../qualification/teacher-one-shot/experiment.preparation";
import { LiveAttemptJournalV1 } from "../../../qualification/teacher-one-shot/live.journal";
import { createNativeExperimentManifestV1, createInjectedExperimentManifestV1, FIXED_LIVE_STATE_DIRECTORY_V1,
  LIVE_NETWORK_ENABLED_V1 } from "../../../qualification/teacher-one-shot/live.contracts";
import { nativeAuthorizationChallengeV1 } from "../../../qualification/teacher-one-shot/live.authorization";
import { validateNativeAuthorizationV1 } from "../../../qualification/teacher-one-shot/live.authorization";
import { runNativeLiveTransportExperimentV1, buildInjectedCloudflareRequestV1 } from "../../../qualification/teacher-one-shot/live.transport";
import { OFFLINE_AUTHORIZATION_V1 } from "../../../qualification/teacher-one-shot/live.contracts";
import { readDedicatedTokenV1 } from "../../../qualification/teacher-one-shot/live.credential";
import https from "node:https";

vi.mock("../../../qualification/teacher-one-shot/live.credential", () => ({
  readDedicatedTokenV1: vi.fn(() => { throw new Error("CREDENTIAL_ACCESS_FORBIDDEN"); }),
}));
vi.mock("node:https", () => ({ default: { request: vi.fn(() => { throw new Error("PROVIDER_ACCESS_FORBIDDEN"); }) } }));

const roots: string[] = [];
const fixtureRoot = () => { const root = mkdtempSync(join(tmpdir(), "pa-13pb-")); roots.push(root); return root; };
afterEach(() => { vi.useRealTimers(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

it("binds a separate identity and journal without inheriting human approval or changing constraints", () => {
  const old = createNativeExperimentManifestV1(), prepared = createPreparedExperimentManifestV1();
  expect(prepared.experiment_id).not.toBe(old.experiment_id);
  expect(PREPARED_STATE_DIRECTORY_V1).not.toBe(FIXED_LIVE_STATE_DIRECTORY_V1);
  for (const key of ["account_id", "model", "scope", "payload_digest", "limits", "lifecycle", "boundary"] as const)
    expect(prepared[key]).toEqual(old[key]);
  expect(prepared.admission_policy).toEqual({ ...old.admission_policy,
    experiment_id: prepared.experiment_id, operator_decision: "PENDING_SEPARATE_HUMAN_APPROVAL" });
  expect(prepared.hosted_input_risk).toEqual({ ...old.hosted_input_risk, experiment_id: prepared.experiment_id });
  expect(preparedExperimentChallengeV1()).toMatchObject({ operator_approval: null, not_before_utc: null,
    expires_at_utc: null, dispatch_enabled: false, credential_acquisition_enabled: false,
    truth_granted: false, authority_granted: false, execution_granted: false });
  expect(LIVE_NETWORK_ENABLED_V1).toBe(false);
});

it.each([undefined, nativeAuthorizationChallengeV1(), preparedExperimentChallengeV1(),
  { ...preparedExperimentChallengeV1(), confirmation: preparedExperimentChallengeDigestV1(),
    operator_approval: true, expires_at_utc: "2099-01-01T00:00:00Z" }])("never authorizes old, missing or self-approved challenges", value => {
  expect(() => validatePreparedExperimentAuthorizationV1(value)).toThrow("PREPARED_EXPERIMENT_UNAUTHORIZED");
});

it("cannot enter existing native or injected dispatch and never requests credentials or provider access", async () => {
  const value = preparedExperimentChallengeV1();
  await expect(runNativeLiveTransportExperimentV1(value)).rejects.toThrow("REAL_DISPATCH_DISABLED_STEP13J");
  expect(readDedicatedTokenV1).not.toHaveBeenCalled();
  expect(https.request).not.toHaveBeenCalled();
  expect(() => buildInjectedCloudflareRequestV1(createPreparedExperimentManifestV1(), OFFLINE_AUTHORIZATION_V1))
    .toThrow("MANIFEST_INVALID");
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-22T00:00:00Z"));
  expect(() => validateNativeAuthorizationV1(value)).toThrow("EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED");
});

it.each(["2026-11-15T00:00:00Z", "2026-11-16T00:00:00Z", "2099-01-01T00:00:00Z"])("fails closed at %s without an approved expiry", now => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(now));
  expect(() => validatePreparedExperimentAuthorizationV1(preparedExperimentChallengeV1())).toThrow("PREPARED_EXPERIMENT_UNAUTHORIZED");
});

it("preserves independent historical evidence and durable replay denial without dispatch permission", () => {
  const root = fixtureRoot(), old = LiveAttemptJournalV1.isolatedOfflineFixture(root);
  old.reserve(createInjectedExperimentManifestV1());
  const historical = readFileSync(join(root, "reserved.json"), "utf8");
  const fresh = LiveAttemptJournalV1.preparedOfflineFixture(root);
  expect(fresh.inspect().state).toBe("UNCLAIMED");
  expect(() => fresh.reserve(createInjectedExperimentManifestV1())).toThrow("MANIFEST_INVALID");
  fresh.reserve(createPreparedExperimentManifestV1());
  expect(() => fresh.acquireDispatchPermission()).toThrow("DISPATCH_PERMISSION_DENIED");
  expect(() => fresh.claimNativeRequest()).toThrow("DISPATCH_PERMISSION_DENIED");
  expect(() => fresh.reserve(createPreparedExperimentManifestV1())).toThrow("ATTEMPT_ALREADY_RESERVED");
  expect(() => LiveAttemptJournalV1.preparedOfflineFixture(root).reserve(createPreparedExperimentManifestV1()))
    .toThrow("RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE");
  expect(readFileSync(join(root, "reserved.json"), "utf8")).toBe(historical);
  const directory = join(root, PREPARED_JOURNAL_NAMESPACE_V1);
  expect(JSON.parse(readFileSync(join(directory, "reserved.json"), "utf8")).experiment_id)
    .toBe(createPreparedExperimentManifestV1().experiment_id);
  expect(existsSync(join(directory, "dispatch.json"))).toBe(false);
  expect(() => old.reserve(createPreparedExperimentManifestV1())).toThrow("MANIFEST_INVALID");
});

it("rejects fixture roots inside historical state", () => {
  for (const suffix of ["", "child"]) expect(() => LiveAttemptJournalV1.preparedOfflineFixture(join(FIXED_LIVE_STATE_DIRECTORY_V1, suffix)))
    .toThrow("JOURNAL_FIXTURE_PATH_INVALID");
});

it("does not inspect hostile authorization or expose sensitive output/errors", () => {
  const trap = vi.fn(() => { throw new Error("SYNTHETIC_PRIVATE_VALUE"); });
  const value = new Proxy({}, { get: trap, ownKeys: trap, getPrototypeOf: trap });
  expect(() => validatePreparedExperimentAuthorizationV1(value)).toThrow(/^PREPARED_EXPERIMENT_UNAUTHORIZED$/);
  expect(trap).not.toHaveBeenCalled();
  expect(JSON.stringify(preparedExperimentChallengeV1())).not.toContain("SYNTHETIC_PRIVATE_VALUE");
});

describe("prepared journal filesystem boundaries in temporary trees only", () => {
  let sandbox: string;
  let Journal: typeof LiveAttemptJournalV1;
  const historicalNames = ["live-state", "local-state", "injected-demo-state"];
  function historicalSnapshot() {
    return historicalNames.map(name => {
      const directory = join(sandbox, name);
      return readdirSync(directory, { recursive: true }).map(entry => String(entry)).sort().map(entry => {
        const path = join(directory, entry);
        return [name, entry, lstatSync(path).isFile() ? readFileSync(path).toString("hex") : "DIRECTORY"];
      });
    });
  }
  beforeEach(async () => {
    sandbox = fixtureRoot();
    for (const name of historicalNames) {
      mkdirSync(join(sandbox, name));
      writeFileSync(join(sandbox, name, "reserved.json"), `TEMPORARY_HISTORICAL_SENTINEL_${name}`);
    }
    vi.resetModules();
    vi.doMock("../../../qualification/teacher-one-shot/live.contracts", async importOriginal => {
      const actual = await importOriginal<typeof import("../../../qualification/teacher-one-shot/live.contracts")>();
      return { ...actual, FIXED_LIVE_STATE_DIRECTORY_V1: join(sandbox, "live-state") };
    });
    Journal = (await import("../../../qualification/teacher-one-shot/live.journal")).LiveAttemptJournalV1;
  });
  afterEach(() => {
    vi.doUnmock("../../../qualification/teacher-one-shot/live.contracts");
    vi.resetModules();
  });

  it.each(historicalNames.flatMap(name => ["..review", "..cache", "...archive"].map(child => ({ name, child }))))(
    "P2 regression rejects $name/$child as an internal directory", ({ name, child }) => {
      const root = join(sandbox, name, child);
      mkdirSync(root);
      expect(() => Journal.preparedOfflineFixture(root)).toThrow("JOURNAL_FIXTURE_PATH_INVALID");
      expect(readdirSync(root)).toEqual([]);
      expect(readFileSync(join(sandbox, name, "reserved.json"), "utf8"))
        .toBe(`TEMPORARY_HISTORICAL_SENTINEL_${name}`);
    });

  it.each(historicalNames.flatMap(name => ["", "child", `child${sep}nested`,
    `child${sep}..${sep}..review`, `..${sep}${name}${sep}..cache`].map(suffix => ({ name, suffix }))))(
    "rejects normalized internal root $name/$suffix without modifying any protected tree", ({ name, suffix }) => {
      const root = `${join(sandbox, name)}${sep}${suffix}`;
      mkdirSync(resolve(root), { recursive: true });
      const before = historicalSnapshot();
      expect(() => Journal.preparedOfflineFixture(root)).toThrow("JOURNAL_FIXTURE_PATH_INVALID");
      expect(historicalSnapshot()).toEqual(before);
    });

  it.each(["..", `..${sep}external`, `..${sep}..review`, `..${sep}..cache`,
    `..${sep}...archive`, `..${sep}live-state-other`, `child${sep}..${sep}..${sep}external`])(
    "allows legitimate external root with parent traversal %s", suffix => {
      const root = `${join(sandbox, "live-state")}${sep}${suffix}`;
      mkdirSync(resolve(root), { recursive: true });
      const before = historicalSnapshot();
      const journal = Journal.preparedOfflineFixture(root);
      journal.reserve(createPreparedExperimentManifestV1());
      expect(existsSync(join(resolve(root), PREPARED_JOURNAL_NAMESPACE_V1, "reserved.json"))).toBe(true);
      expect(() => journal.acquireDispatchPermission()).toThrow("DISPATCH_PERMISSION_DENIED");
      expect(() => journal.claimNativeRequest()).toThrow("DISPATCH_PERMISSION_DENIED");
      expect(historicalSnapshot()).toEqual(before);
    });

  for (const type of ["dir", "junction"] as const) it(`rejects ${type} aliases in ancestors and at the journal directory`, context => {
    const root = join(sandbox, `alias-${type}`);
    const before = historicalSnapshot();
    try { symlinkSync(join(sandbox, "live-state"), root, type); }
    catch (error) {
      if (["EPERM", "EACCES", "ENOSYS", "ENOTSUP"].includes((error as NodeJS.ErrnoException).code ?? "")) {
        context.skip(); return;
      }
      throw error;
    }
    expect(() => Journal.preparedOfflineFixture(root).reserve(createPreparedExperimentManifestV1()))
      .toThrow("RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE");
    const external = join(sandbox, `external-${type}`);
    mkdirSync(external);
    symlinkSync(join(sandbox, "local-state"), join(external, PREPARED_JOURNAL_NAMESPACE_V1), type);
    expect(() => Journal.preparedOfflineFixture(external).reserve(createPreparedExperimentManifestV1()))
      .toThrow("RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE");
    expect(historicalSnapshot()).toEqual(before);
  });

  it.each(["root-file", "journal-file", "reserved.json", "dispatch.json", "result.json"])(
    "fails closed on existing collision %s without overwriting it", collision => {
      const root = join(sandbox, "external-collision");
      let marker: string;
      if (collision === "root-file") marker = root;
      else {
        mkdirSync(root);
        const directory = join(root, PREPARED_JOURNAL_NAMESPACE_V1);
        if (collision === "journal-file") marker = directory;
        else { mkdirSync(directory); marker = join(directory, collision); }
      }
      writeFileSync(marker, "TEMPORARY_COLLISION_SENTINEL");
      const before = historicalSnapshot();
      expect(() => Journal.preparedOfflineFixture(root).reserve(createPreparedExperimentManifestV1()))
        .toThrow("RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE");
      expect(readFileSync(marker, "utf8")).toBe("TEMPORARY_COLLISION_SENTINEL");
      expect(historicalSnapshot()).toEqual(before);
    });
});
