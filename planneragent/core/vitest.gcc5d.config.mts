import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// The custom Workers pool does not use Vitest's maxWorkers to limit workerd
// instances. One instance avoids resource exhaustion on local Windows hosts.
export default defineWorkersConfig({
  test: {
    include: ["src/conversation/**/*.test.ts"],
    poolOptions: {
      workers: { singleWorker: true, wrangler: { configPath: "./wrangler.toml" } },
    },
  },
});
