// providers/mistral.ts

import { LlmProvider } from "../types";

export const MistralProvider: LlmProvider = {
  id: "mistral",
  remote: false,
  isFree: false,
  quality: "medium",

  async generateScenarios(input) {
    return {
      scenarios: []
    };
  }
};
