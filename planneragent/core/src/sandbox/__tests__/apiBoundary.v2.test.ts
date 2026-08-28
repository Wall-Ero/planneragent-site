import { describe, expect, it } from "vitest";
import type { DatasetDescriptor, SandboxEvaluateRequestV2 } from "../contracts.v2";
import { parseEdgeRequestV2, parseSandboxEvaluateRequestV2 } from "../apiBoundary.v2";

const base = {
  company_id: "company-1",
  request_id: "request-1",
  plan: "VISION",
  intent: "INFORM",
  domain: "general",
  actor_id: "actor-1",
  baseline_snapshot_id: "snapshot-1",
  baseline_metrics: {},
};

const descriptors = {
  SNAPSHOT: { hasSnapshot: true, hasBehavioralEvents: false, hasStructuralData: false },
  BEHAVIORAL: { hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: false },
  STRUCTURAL: { hasSnapshot: true, hasBehavioralEvents: true, hasStructuralData: true },
} satisfies Record<string, DatasetDescriptor>;

function parseBoth(dataset_descriptor: unknown): SandboxEvaluateRequestV2[] {
  return [
    parseEdgeRequestV2({ ...base, dataset_descriptor }),
    parseSandboxEvaluateRequestV2({ ...base, dataset_descriptor, snapshot: {} }),
  ];
}

describe("Sandbox API boundary dataset descriptor normalization", () => {
  it.each(Object.entries(descriptors))("preserves canonical %s descriptors", (_level, descriptor) => {
    for (const parsed of parseBoth(descriptor)) expect(parsed.dataset_descriptor).toEqual(descriptor);
  });

  it.each([
    ["NONE", { hasSnapshot: false, hasBehavioralEvents: false, hasStructuralData: false }],
    ["SNAPSHOT", descriptors.SNAPSHOT],
    ["BEHAVIORAL", descriptors.BEHAVIORAL],
    ["STRUCTURAL", descriptors.STRUCTURAL],
    [0, { hasSnapshot: false, hasBehavioralEvents: false, hasStructuralData: false }],
    [1, descriptors.SNAPSHOT],
    [2, descriptors.BEHAVIORAL],
    [3, descriptors.STRUCTURAL],
  ])("translates legacy awareness_level %s", (awareness_level, expected) => {
    for (const parsed of parseBoth({ awareness_level })) expect(parsed.dataset_descriptor).toEqual(expected);
  });

  it.each([
    undefined,
    null,
    "SNAPSHOT",
    {},
    { awareness_level: "UNKNOWN" },
    { awareness_level: 4 },
    { hasSnapshot: true, hasBehavioralEvents: "yes", hasStructuralData: false },
  ])("preserves the undefined downstream fallback for malformed input %#", descriptor => {
    for (const parsed of parseBoth(descriptor)) expect(parsed.dataset_descriptor).toBeUndefined();
  });
});
