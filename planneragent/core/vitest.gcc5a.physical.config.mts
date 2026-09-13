import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const endpoint = process.env.INTERPRETATION_STUDENT_ENDPOINT?.trim();
const authorization = process.env.INTERPRETATION_STUDENT_AUTHORIZATION?.trim();
if (!endpoint || !authorization) throw new Error("GCC5A_PHYSICAL_PREREQUISITES_MISSING");

export default defineWorkersConfig({
  test: {
    include: ["src/conversation/evaluation/gcc5a.physical.e2e.ts"],
    reporters: ["verbose"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          bindings: {
            INTERPRETATION_STUDENT_SHADOW_ENABLED: "true",
            INTERPRETATION_STUDENT_ENDPOINT: endpoint,
            INTERPRETATION_STUDENT_AUTHORIZATION: authorization,
            INTERPRETATION_STUDENT_TIMEOUT_MS: "30000",
          },
        },
      },
    },
  },
});
