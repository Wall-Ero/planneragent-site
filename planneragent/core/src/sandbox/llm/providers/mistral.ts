// providers/mistral.ts

import { LlmProvider } from "../types";

export const MistralProvider: LlmProvider = {
  id: "mistral",

  async generateScenarios(input) {
    return {
      scenarios: []
    };
  }
};