//core/src/reality/process.instability.v1.ts

// ======================================================
// PlannerAgent — Process Instability Detector
// Canonical Source of Truth
// ======================================================

export type ComponentInstability = {
  parent: string;
  component: string;
  variance: number;
  samples: number;
  instability: number; // 0 → 1
};

export type ProcessInstabilitySignal = {
  components: ComponentInstability[];
  overall_instability: number;
  unstable_components: number;
};

export function computeProcessInstability(params: {
  realityBom: Array<{
    parent: string;
    components: Array<{
      component: string;
      variance: number;
      samples: number;
    }>;
  }>;
}): ProcessInstabilitySignal {

  const out: ComponentInstability[] = [];

  for (const p of params.realityBom ?? []) {

    for (const c of p.components ?? []) {

      const variance = c.variance ?? 0;
      const samples = c.samples ?? 0;

      // ------------------------------------------------------
      // Instability model
      // ------------------------------------------------------
      // variance high + low samples = risky
      // ------------------------------------------------------

      const varianceScore = clamp01(variance);
      const samplePenalty = samples < 3 ? 0.3 : samples < 5 ? 0.15 : 0;

      const instability = clamp01(varianceScore + samplePenalty);

      out.push({
        parent: p.parent,
        component: c.component,
        variance,
        samples,
        instability: round3(instability)
      });
    }
  }

  const unstable = out.filter(c => c.instability > 0.4);

  const overall =
    out.length > 0
      ? out.reduce((s, c) => s + c.instability, 0) / out.length
      : 0;

  return {
    components: out,
    overall_instability: round3(overall),
    unstable_components: unstable.length
  };
}

// ------------------------------------------------------

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function round3(x: number) {
  return Math.round(x * 1000) / 1000;
}
