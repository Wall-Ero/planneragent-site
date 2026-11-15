import { defineConfig } from "vitest/config";
import previous from "./vitest.teacher.native.readiness.offline.config.mts";
export default defineConfig({ test: { ...previous.test,
  include: [...previous.test!.include!, "src/conversation/__tests__/cloudflare.teacher.preparation.offline.v1.test.ts"],
} });
