// providers/anthropic.ts
import { LlmProvider } from "../types";

export const AnthropicProvider: LlmProvider = {
  id: "anthropic",

  async generateScenarios(input) {
    // TODO: chiamata reale più avanti
    return {
      scenarios: []
    };
  }
};