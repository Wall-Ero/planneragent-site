// providers/mock.ts
import { LlmProvider } from "../types";

export const MockProvider: LlmProvider = {
  id: "mock",
isFree: false,
  quality: "low",

  async generateScenarios() {
    return {
      scenarios: [
        {
          label: "Scenario",
          assumptions: [],
          proposed_actions: [],
          expected_effects: {},
        }
      ]
    };
  }
};