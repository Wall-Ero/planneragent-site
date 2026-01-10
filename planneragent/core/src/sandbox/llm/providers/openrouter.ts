import { LlmProvider } from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Billing model (can be refined later):
 * - cost is estimated via token usage returned by OpenRouter
 */
export const OpenRouterProvider: LlmProvider = {
  id: "openrouter",

  isFree: false,

  quality: "high",

  async generateScenarios(input) {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://planneragent.ai",
        "X-Title": "PlannerAgent",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // configurable later
        messages: [
          {
            role: "system",
            content:
              "You are a supply chain planning assistant. Output JSON only.",
          },
          {
            role: "user",
            content: `
Domain: ${input.domain}
Intent: ${input.intent}
Baseline: ${JSON.stringify(input.baseline)}

Generate multiple planning scenarios.
`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter error ${res.status}`);
    }

    const json = await res.json();

    // 🧠 normalize output
    const content = json.choices?.[0]?.message?.content;

    return {
      scenarios: JSON.parse(content),
    };
  },
};