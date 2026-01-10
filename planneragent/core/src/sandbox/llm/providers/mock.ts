// providers/mock.ts
import { LlmProvider } from "../types";

export const MockProvider: LlmProvider = {
  id: "mock",

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