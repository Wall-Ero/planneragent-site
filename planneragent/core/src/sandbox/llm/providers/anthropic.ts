// providers/anthropic.ts
import { LlmProvider } from "../types";

export const AnthropicProvider: LlmProvider = {
  id: "anthropic",
  remote: false,
  isFree: false,
  quality: "high",

  async generateScenarios(input) {
    // TODO: chiamata reale più avanti
    return {
      scenarios: []
    };
  }
};
