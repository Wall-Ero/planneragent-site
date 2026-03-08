// core/src/runtime/twin.runtime.ts
// ======================================================
// PlannerAgent — Twin Runtime Loop
// ======================================================

import { processEvent } from "../event/event.processor";
import { updateSystemState } from "../state/system.state";

import { buildReality } from "../reality/reality.builder";
import { createTwinSnapshot } from "../simulation/twin.snapshot";

import { runScenario } from "../simulation/scenario.runner";
import { runOptimizerV1 } from "../decision/optimizer/optimizer";

export async function runTwinCycle(event: any) {

  // 1️⃣ process incoming event

  const processed = processEvent(event);

  // 2️⃣ update runtime state

  const state = updateSystemState(processed);

  // 3️⃣ rebuild reality

  const reality = buildReality({
    orders: state.orders,
    inventory: state.inventory,
    movements: state.movements
  });

  // 4️⃣ create twin snapshot

  const twin = createTwinSnapshot(reality);

  // 5️⃣ simulate scenario

  const scenario = runScenario(twin);

  // 6️⃣ run optimizer

  const result = await runOptimizerV1({
    requestId: "runtime",
    plan: "VISION",
    asOf: new Date().toISOString(),
    orders: state.orders,
    inventory: state.inventory,
    movements: state.movements,
    inferredBom: scenario.bom
  });

  return result;
}