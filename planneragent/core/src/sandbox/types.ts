// src/sandbox/types.ts

import type { computeDqmV1 } from "./dqm";

// 1) Input lato Sandbox: baseline + vincoli
export type SandboxInput = {
  baselinePlan: any;
  baselineMetrics: any; // DqmMetrics-like (stessa shape del tuo dqm.ts)
  constraints: any;
};

// 2) Output grezzo di un singolo LLM (solo proposta)
export type LlmScenarioProposal = {
  plan: any;
  metrics: any;     // DqmMetrics-like
  feasible: boolean;
};

// 3) Contratto che ogni adapter LLM deve implementare
export interface SandboxLLM {
  id: string; // es: "openai-gpt", "anthropic-claude", "local-heuristic"
  generateScenario(input: {
    baselinePlan: any;
    constraints: any;
  }): Promise<LlmScenarioProposal>;
}

// 4) Scenario arricchito con metadati (chi l’ha prodotto)
export type SandboxScenario = {
  scenarioId: string;
  llm: string;
  plan: any;
  metrics: any;
  feasible: boolean;
};

// 5) Scenario con score deterministico
export type RankedScenario = SandboxScenario & {
  dqm: ReturnType<typeof computeDqmV1>;
};

// 6) Risultato complessivo dell’orchestrazione
export type SandboxResult = {
  baselineMetrics: any;
  ranked: RankedScenario[];
};