import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curriculum } from "./fixtures.v1";
import { runMaturationV1 } from "./runner.v1";

const guard = createRequire(import.meta.url)("../teacher-one-shot/offline.network-deny.cjs") as {
  assertNoUnexpectedAttempts(): void;
  acknowledgeExpectedAttempts(routes: string[]): void;
};

describe("PAM-02 offline maturation", () => {
  it("runs the full lifecycle, reproduces the evidence and writes the manifest", async () => {
    const report = await runMaturationV1();
    expect(report).toMatchObject({
      verdict: "DEMO_PASS", stop_reason: "COMPLETED", regressions: [], promotion: false, teacher_live: false,
      results: {
        development_before: { passed: 1, total: 2, groups: ["availability"] },
        development_after: { passed: 2, total: 2 },
        holdout_before: { passed: 1, total: 2, groups: ["operational-evidence"] },
        holdout_after: { passed: 2, total: 2 },
      },
      budget: { remediations: 1, external_eur: 0, mock_neurons: 2 },
    });
    expect(report.candidates.before).not.toBe(report.candidates.after);
    expect(report.observations).toHaveLength(9);
    expect(report.observations[0].disposition).toBe("TEACHER_VERIFIED");
    expect(report.observations.slice(1).every(item => item.teacher_attempts.length === 0)).toBe(true);
    expect(report.budget.elapsed_ms).toBeLessThan(60_000);
    const replay = await runMaturationV1();
    expect({ ...replay, budget: { ...replay.budget, elapsed_ms: 0 } })
      .toEqual({ ...report, budget: { ...report.budget, elapsed_ms: 0 } });
    guard.assertNoUnexpectedAttempts();

    const directory = process.env.PAM_REPORT_DIR;
    if (!directory) throw new Error("PAM_REPORT_DIR missing after configuration");
    writeFileSync(join(directory, "manifest.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  });

  it.each([
    ["missing-evidence", "MISSING_EVIDENCE"],
    ["self-review", "EVALUATION_INCONCLUSIVE"],
  ] as const)("rejects %s before remediation", async (fault, stop_reason) => {
    const report = await runMaturationV1({ fault });
    expect(report).toMatchObject({ verdict: "INCONCLUSIVE", stop_reason, budget: { remediations: 0 } });
    expect(report.results.holdout_before).toBeUndefined();
    if (fault === "self-review") {
      expect(report.observations.at(-1)?.student_gate).toMatchObject({
        status: "INCONCLUSIVE", reason: "VERIFICATION_INCONCLUSIVE",
      });
    } else {
      expect(report.results).toEqual({});
    }
  });

  it("stops before evaluating contaminated splits or continuing past the deadline", async () => {
    const contaminated = { ...curriculum, holdout: curriculum.development };
    // Intentionally invalid input tests the runtime split gate.
    expect(await runMaturationV1({ splits: contaminated as unknown as typeof curriculum })).toMatchObject({
      verdict: "FAIL", stop_reason: "SPLIT_CONTAMINATION", observations: [], budget: { remediations: 0 },
    });
    expect(await runMaturationV1({ elapsed: () => 60_000 })).toMatchObject({
      verdict: "INCONCLUSIVE", stop_reason: "TIMEOUT", observations: [], budget: { remediations: 0 },
    });
  });

  it("blocks fetch and keeps its attempt visible to the offline guard", () => {
    expect(() => fetch("https://example.invalid")).toThrow("OFFLINE_NETWORK_ACCESS_DENIED");
    expect(() => guard.assertNoUnexpectedAttempts()).toThrow();
    guard.acknowledgeExpectedAttempts(["fetch"]);
    guard.assertNoUnexpectedAttempts();
  });
});
