import { LlmProvider } from "../types";

export const OpenAIProvider: LlmProvider = {
  id: "openai",
  isFree: false,
  quality: "high",

  async generateScenarios(input) {
    // chiamata API
    // parsing safe
    return {
      scenarios: []
    };
  }
};