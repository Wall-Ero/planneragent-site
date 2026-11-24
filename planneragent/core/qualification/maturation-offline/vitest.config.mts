import { realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const directory = process.env.PAM_REPORT_DIR;
if (!directory || !/^\/tmp\/pam-02\.[A-Za-z0-9]+$/.test(directory) || realpathSync(directory) !== directory ||
    !statSync(directory).isDirectory() || (statSync(directory).mode & 0o077) !== 0) {
  throw new Error("PAM_REPORT_DIR must be a private temporary directory created with mktemp -d /tmp/pam-02.XXXXXX");
}

export default defineConfig({
  cacheDir: directory,
  test: {
    include: ["qualification/maturation-offline/runner.v1.test.ts"],
    setupFiles: [fileURLToPath(new URL("../teacher-one-shot/offline.network.setup.ts", import.meta.url))],
    environment: "node",
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 60_000,
    cache: false,
  },
});
