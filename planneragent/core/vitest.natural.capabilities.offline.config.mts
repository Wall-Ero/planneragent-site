import { defineConfig } from "vitest/config";
import semanticExposure from "./vitest.semantic.exposure.offline.config.mts";

export default defineConfig({ test: { ...semanticExposure.test,
  include: [...semanticExposure.test!.include!, "src/conversation/__tests__/hybrid.natural.capabilities.v1.test.ts"],
} });
