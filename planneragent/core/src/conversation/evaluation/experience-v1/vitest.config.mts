import { defineConfig } from "vitest/config";
import operational from "../../../../vitest.operational.chat.offline.config.mts";
import natural from "../../../../vitest.natural.capabilities.offline.config.mts";

// Extend the existing family runners, preserving their tests and offline setup.
export default defineConfig({ test: { ...operational.test,
  include: [...new Set([...operational.test!.include!, ...natural.test!.include!,
    "src/conversation/__tests__/conversational.experience.offline.v1.test.ts",
  ])],
} });
