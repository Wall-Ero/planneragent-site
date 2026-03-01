// core/src/onboarding/__tests__/onboarding.flow.test.ts
import { describe, it, expect } from "vitest";
import { initialOnboardingState } from "../onboarding.state";

describe("onboarding flow", () => {
  it("creates initial onboarding state", () => {
    const state = initialOnboardingState("t_demo");
    expect(state.tenant_id).toBe("t_demo");
    expect(state.current_step).toBe("start");
  });
});