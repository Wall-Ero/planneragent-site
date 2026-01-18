// providers/mistral.ts

import { LlmProvider } from "../types";

export const MistralProvider: LlmProvider = {
  id: "mistral",
  isFree: false,
  quality: "medium",

  async generateScenarios(input) {
    return {
      scenarios: []
    };
  }
};