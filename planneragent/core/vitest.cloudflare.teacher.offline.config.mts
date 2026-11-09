import { defineConfig } from "vitest/config";
import naturalCapabilities from "./vitest.natural.capabilities.offline.config.mts";

export default defineConfig({ test: { ...naturalCapabilities.test,
  include: [...naturalCapabilities.test!.include!, "src/conversation/__tests__/cloudflare.teacher.rest.offline.v1.test.ts"],
} });
