//core/src/sandbox/llm/providers/oss.ts

import type { LlmProvider } from "../types";

export const OssProvider: LlmProvider = {
  id: "oss",
  remote: false,
  isFree: true,
  quality: "low",

  async generateScenarios() {
    return {
      model: "oss",
      scenarios: [],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  },
};
