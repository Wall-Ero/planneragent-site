import { describe, expect, it } from "vitest";
import source from "./gcc5a.physical.e2e.ts?raw";
import config from "../../../vitest.gcc5a.physical.config.mts?raw";

describe("GCC-5A physical harness structure", () => {
  it("uses the repository Worker and canonical waitUntil completion API", () => {
    expect(source).toContain('worker from "../../worker"');
    expect(source).toContain("createExecutionContext");
    expect(source).toContain("waitOnExecutionContext");
    expect(source).not.toMatch(/waitUntil\s*:\s*\([^)]*\)\s*=>/);
  });

  it("is opt-in and receives temporary configuration only from process environment", () => {
    expect(config).toContain('include: ["src/conversation/evaluation/gcc5a.physical.e2e.ts"]');
    expect(config).toContain("process.env.INTERPRETATION_STUDENT_ENDPOINT");
    expect(config).toContain("process.env.INTERPRETATION_STUDENT_AUTHORIZATION");
    expect(config).toContain("GCC5A_PHYSICAL_PREREQUISITES_MISSING");
    expect(source).not.toMatch(/trycloudflare|Bearer\s+[A-Za-z0-9]/);
  });
});
