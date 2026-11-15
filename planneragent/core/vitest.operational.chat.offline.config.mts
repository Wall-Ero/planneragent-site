import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";

createRequire(import.meta.url)("./qualification/teacher-one-shot/offline.network-deny.cjs");
export default defineConfig({ test: {
  environment: "node", fileParallelism: false, maxWorkers: 1, minWorkers: 1,
  setupFiles: ["qualification/teacher-one-shot/offline.network.setup.ts"],
  include: [
    "src/conversation/__tests__/operational.chat.e2e.offline.v1.test.ts",
    "src/conversation/__tests__/anonymous.vision.conversation.v1.test.ts",
    "src/conversation/__tests__/anonymous.vision.conversation.route.v1.test.ts",
    "src/conversation/__tests__/anonymous.vision.conversation.client.v1.test.ts",
    "src/conversation/__tests__/cognitive.transport.conversational.realization.adapter.v1.test.ts",
  ],
} });
