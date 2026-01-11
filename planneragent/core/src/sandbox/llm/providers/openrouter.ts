import { LlmProvider } from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export function createOpenRouterProvider(env: any): LlmProvider {
  return {
    id: "openrouter",
    isFree: false,
    quality: "high",

    async generateScenarios(input) {
      const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://planneragent.ai",
          "X-Title": "PlannerAgent",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a supply chain planning assistant. Output JSON only.",
            },
            {
              role: "user",
              content: `
Domain: ${input.domain}
Intent: ${input.intent}
Baseline: ${JSON.stringify(input.baseline)}
`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenRouter error ${res.status}`);
      }

      const json: any = await res.json();
      const content = json.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty OpenRouter response");
      }

      return {
        scenarios: JSON.parse(content),
      };
    },
  };
}