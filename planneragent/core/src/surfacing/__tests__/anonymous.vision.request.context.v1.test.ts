import { describe, expect, it } from "vitest";
import {
  admitAnonymousVisionRequestContextV1,
  ANONYMOUS_VISION_INPUT_MAX_LENGTH_V1,
} from "../anonymous.vision.request.context.v1";

describe("ANONYMOUS-VISION-REQUEST-CONTEXT-V1", () => {
  it("admits bounded descriptive context as non-authoritative and request-bound", () => {
    const context = admitAnonymousVisionRequestContextV1({
      version: 1,
      request_id: "request-1",
      declared_role: "Production planner",
      declared_company: "Example Works",
      input: "Orders are slipping while available inventory appears unchanged.",
    });

    expect(context).toEqual({
      version: 1,
      request_id: "request-1",
      declared_role: "Production planner",
      declared_company: "Example Works",
      input: "Orders are slipping while available inventory appears unchanged.",
      trust: {
        source: "REQUESTER_SUPPLIED",
        authority: "NON_AUTHORITATIVE",
        scope: "REQUEST_BOUND",
      },
    });
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context?.trust)).toBe(true);
  });

  it.each(["tenant_id", "company_id", "membership_id", "principal_id", "oag_actor_id", "authority", "executionAllowed", "subscription_id"])(
    "rejects prohibited authority-bearing field %s",
    (field) => expect(admitAnonymousVisionRequestContextV1({
      version: 1,
      request_id: "request-1",
      input: "Observed conditions",
      [field]: "untrusted-claim",
    })).toBeUndefined(),
  );

  it("rejects empty, malformed, and oversized input", () => {
    expect(admitAnonymousVisionRequestContextV1(undefined)).toBeUndefined();
    expect(admitAnonymousVisionRequestContextV1({ version: 1, request_id: "r", input: " " })).toBeUndefined();
    expect(admitAnonymousVisionRequestContextV1({
      version: 1,
      request_id: "r",
      input: "x".repeat(ANONYMOUS_VISION_INPUT_MAX_LENGTH_V1 + 1),
    })).toBeUndefined();
  });

  it("has no persistence or organizational lookup behavior", () => {
    const context = admitAnonymousVisionRequestContextV1({ version: 1, request_id: "r", input: "Observed conditions" });
    expect(context).not.toHaveProperty("persistence");
    expect(context).not.toHaveProperty("company_id");
    expect(context).not.toHaveProperty("tenant_id");
    expect(context).not.toHaveProperty("actor_id");
  });
});
