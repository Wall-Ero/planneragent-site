import { defineConfig } from "vitest/config";
import previous from "./vitest.teacher.live.transport.offline.config.mts";
export default defineConfig({ test: { ...previous.test,
  include: [...previous.test!.include!, "src/conversation/__tests__/cloudflare.teacher.native.readiness.offline.v1.test.ts"],
} });
