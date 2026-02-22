// core/src/scheduler/scheduler.types.ts

import type { OpenSrlInputs } from "../governance/rules/open-srl.rule";

export interface GovernanceSchedulerInput {
  now_iso: string;
  open_srl_input: OpenSrlInputs;
}

export interface GovernanceSchedulerResult {
  ok: true;
  action?: "OPEN_SRL_TRIGGERED";
}