// core/src/simulation/time.engine.ts
// ======================================================
// PlannerAgent — Time Simulation Engine
// ======================================================

export interface SimulationClock {

  currentDay: number;

}

export function advanceTime(
  clock: SimulationClock,
  days: number
): SimulationClock {

  return {

    currentDay: clock.currentDay + days,

  };

}