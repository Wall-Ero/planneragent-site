//planneragent/core/src/market/__tests__/trial.state.test.ts

import { describe, it, expect } from "vitest";
import { startTrial, isTrialActive } from "../trial.state";

describe("trial.state", () => {
  it("creates deterministic trial window", () => {
    const trial = startTrial({
      started_at_iso: "2026-03-01T00:00:00.000Z",
      trial_days: 30,
    });

    expect(trial.started_at_iso).toBe("2026-03-01T00:00:00.000Z");
    expect(trial.expires_at_iso).toBe("2026-03-31T00:00:00.000Z");
  });

  it("detects active vs expired trial", () => {
    const trial = startTrial({
      started_at_iso: "2026-03-01T00:00:00.000Z",
      trial_days: 10,
    });

    expect(
      isTrialActive(trial, "2026-03-05T00:00:00.000Z")
    ).toBe(true);

    expect(
      isTrialActive(trial, "2026-03-20T00:00:00.000Z")
    ).toBe(false);
  });
});
