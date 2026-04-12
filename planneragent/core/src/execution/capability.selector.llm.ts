// core/src/execution/capability.selector.llm.ts

import type { PlannerAction } from "./action.types";
import type { CapabilityOption } from "./capability.resolver";

export async function selectCapabilityWithLLM(params: {
  action: PlannerAction;
  options: CapabilityOption[];
}): Promise<string | null> {

  const { action, options } = params;

  if (!options.length) return null;

  // fallback deterministico
  const bestDeterministic = options.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  try {

    const prompt = `
You are a strict decision selector.

Action:
${JSON.stringify(action)}

Allowed capabilities:
${options.map(o => o.id).join(", ")}

Rules:
- You MUST select ONLY one capability from the list
- Do NOT invent new capabilities
- Return ONLY the capability id

Answer:
`;

    const llmResult = await fakeLLMCall(prompt);

    const selected = llmResult.trim();

    const isValid = options.some(o => o.id === selected);

    if (!isValid) {
      return bestDeterministic.id; // 🔒 fallback sicuro
    }

    return selected;

  } catch {
    return bestDeterministic.id; // 🔒 fallback sicuro
  }
}

// 🔁 stub (poi colleghi OpenAI/OpenRouter)
async function fakeLLMCall(_: string): Promise<string> {
  return "RESCHEDULE_PRODUCTION";
}
