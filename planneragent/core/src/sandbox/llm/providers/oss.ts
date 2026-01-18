import type { LlmProvider } from "../types";


export const OssProvider: LlmProvider = {
  id: "oss",
  isFree: true,
  quality: "low",


  async generateScenarios() {
    return {
      scenarios: [
        {
          label: "OSS fallback scenario",
          assumptions: ["No paid LLM available"],
          proposed_actions: [],
        },
      ],
    };
  },
};

