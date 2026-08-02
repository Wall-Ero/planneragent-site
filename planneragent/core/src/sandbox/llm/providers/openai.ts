import { LlmProvider } from "../types";

export const OpenAIProvider: LlmProvider = {
  id: "openai",
  remote: false,
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
