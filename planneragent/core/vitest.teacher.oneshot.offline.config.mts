import { defineConfig } from "vitest/config";
import previous from "./vitest.cloudflare.teacher.offline.config.mts";
import { createRequire } from "node:module";
// Install in the runner process before workers/subprocesses; also install in every test realm.
createRequire(import.meta.url)("./qualification/teacher-one-shot/offline.network-deny.cjs");
export default defineConfig({ test: { ...previous.test,
  setupFiles: ["qualification/teacher-one-shot/offline.network.setup.ts"],
  include: [...previous.test!.include!, "src/conversation/__tests__/cloudflare.teacher.oneshot.offline.v1.test.ts",
    "src/conversation/__tests__/cloudflare.teacher.network.containment.offline.v1.test.ts"],
} });
