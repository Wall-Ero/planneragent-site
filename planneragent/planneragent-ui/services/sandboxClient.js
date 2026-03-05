/**
 * Stub for PlannerAgent sandboxClient integration.
 * Later (other chat): replace with real call to your Core Worker endpoint,
 * then map response -> signals.
 */
export async function fetchSignals(){
  return {
    dataAwareness: "behavioral",
    planCoherence: "coherent",
    realityAlignment: "aligned",
    decisionPressure: "medium",
  };
}
