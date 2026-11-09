import { afterEach } from "vitest";
import { createRequire } from "node:module";

const guard = createRequire(import.meta.url)("./offline.network-deny.cjs");
// A transport may sanitize/catch an error. A blocked network attempt must still fail its test.
afterEach(() => guard.assertNoUnexpectedAttempts());
