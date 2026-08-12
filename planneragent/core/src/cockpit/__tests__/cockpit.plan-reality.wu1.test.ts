import { describe, expect, expectTypeOf, it } from "vitest";
import type { PublicPlanSignalV1, PublicRealitySignalV1, SandboxEvaluateResponseV2, UiSignalsV1 } from "../../sandbox/contracts.v2";
import { deriveRealityState } from "../../reality/reality.state";
import type { BuildRealityStateInput } from "../../reality/reality.state";
import { computePlanCoherence } from "../../topology/plan.coherence";

describe("COCKPIT-PR-WU1 public contracts", () => {
  it("publishes only the selected Plan fields", () => {
    const plan: PublicPlanSignalV1 = {
      level: "COHERENT", source: "MASTER", confidence: 0.9,
      score: 0.9, quality: "HIGH", quality_score: 0.85,
    };
    expect(Object.keys(plan).sort()).toEqual([
      "confidence", "level", "quality", "quality_score", "score", "source",
    ]);
    expectTypeOf<SandboxEvaluateResponseV2["signals"]>().toEqualTypeOf<UiSignalsV1 | undefined>();
  });

  it.each([
    [{ realityScore: 0.9, topologyConfidence: 0.9 }, "STABLE"],
    [{ realityScore: 0.9, topologyConfidence: 0.9, processInstability: { overall_instability: 0.4, components: [], unstable_components: 0 } }, "SHIFTING"],
    [{ realityScore: 0.9, topologyConfidence: 0.9, processInstability: { overall_instability: 0.8, components: [], unstable_components: 1 } }, "UNSTABLE"],
    [{ realityScore: 0.4, topologyConfidence: 0.9 }, "ASSUMED"],
  ] as const)("keeps canonical Reality state %s", (input, state) => {
    const evidence = deriveRealityState(input as BuildRealityStateInput);
    const publicEvidence: PublicRealitySignalV1 = {
      realityState: evidence.realityState,
      confidence: evidence.confidence,
      reasons: evidence.reasons,
    };
    expect(publicEvidence.realityState).toBe(state);
    expect(["ALIGNED", "DRIFTING", "MISALIGNED"]).not.toContain(publicEvidence.realityState);
    expect(Object.keys(publicEvidence).sort()).toEqual(["confidence", "realityState", "reasons"]);
    expect(publicEvidence).not.toHaveProperty("metrics");
  });

  it("keeps coherent Plan independent from Stable, Unstable, and Assumed Reality", () => {
    const coherent = computePlanCoherence({
      orders: [{ id: "O1" }, { id: "O2" }],
      topologyLayers: {
        fromOrders: { nodes: [{}, {}], edges: [{}, {}] },
        fromBom: { nodes: [], edges: [{}] },
      },
      inferredBomQuality: {
        hasParents: true, hasComponents: true, parentCount: 1,
        componentLinkCount: 1, linkCoverage: 1, avgComponentsPerParent: 2,
      },
    });
    expect(coherent.level).toBe("COHERENT");
    expect(deriveRealityState({ realityScore: 0.9, topologyConfidence: 0.9 }).realityState).toBe("STABLE");
    expect(deriveRealityState({ realityScore: 0.9, topologyConfidence: 0.9, processInstability: { overall_instability: 0.8, components: [], unstable_components: 1 } }).realityState).toBe("UNSTABLE");
    expect(deriveRealityState({ realityScore: 0.4, topologyConfidence: 0.9 }).realityState).toBe("ASSUMED");
    expect(coherent.level).toBe("COHERENT");
  });
});
