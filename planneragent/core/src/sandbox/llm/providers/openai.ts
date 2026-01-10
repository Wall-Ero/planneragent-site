import { LlmProvider } from "../types";

export const OpenAIProvider: LlmProvider = {
  id: "openai",

  async generateScenarios(input) {
    // chiamata API
    // parsing safe
    return {
      scenarios: []
    };
  }
};