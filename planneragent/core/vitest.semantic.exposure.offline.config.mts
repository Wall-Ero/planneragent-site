import { defineConfig } from "vitest/config";

// Node only. Includes the unchanged foundation and its contract regressions.
export default defineConfig({ test: { environment: "node", fileParallelism: false, maxWorkers: 1, minWorkers: 1,
  include: [
    "src/conversation/__tests__/hybrid.public.semantic.exposure.v1.test.ts",
    "src/conversation/__tests__/hybrid.conversational.foundation.v1.test.ts",
    "src/conversation/__tests__/conversational.cognition.contracts.v1.test.ts",
    "src/conversation/__tests__/conversational.training.source.eligibility.v1.test.ts",
    "src/conversation/__tests__/synthetic.conversational.persona.v1.test.ts",
  ],
} });
