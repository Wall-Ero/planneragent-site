import { LlmProvider } from "../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export function createOpenRouterProvider(env: any): LlmProvider {
  const hasKey = !!env.OPENROUTER_API_KEY;

  console.log("[OPENROUTER] Provider init — API key present:", hasKey);

  return {
    id: "openrouter",
    isFree: false,
    quality: "high",

    async generateScenarios(input) {
      if (!env.OPENROUTER_API_KEY) {
        console.warn("[OPENROUTER] Missing API key — skipping provider");
        throw new Error("OPENROUTER_API_KEY_MISSING");
      }

      console.log("[OPENROUTER] generateScenarios called", {
        domain: input.domain,
        intent: input.intent,
      });

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
              content:
                "You are a supply chain planning assistant. Output STRICT JSON. No prose. No markdown. JSON only.",
            },
            {
              role: "user",
              content: JSON.stringify(
                {
                  domain: input.domain,
                  intent: input.intent,
                  baseline: input.baseline,
                },
                null,
                2
              ),
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[OPENROUTER] HTTP failure", res.status, text);
        throw new Error(`OPENROUTER_HTTP_${res.status}`);
      }

      const json: any = await res.json();
      const content = json?.choices?.[0]?.message?.content;

      if (!content) {
        console.error("[OPENROUTER] Empty model response", json);
        throw new Error("OPENROUTER_EMPTY_RESPONSE");
      }

      // --- Safe JSON parsing ---
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        console.error("[OPENROUTER] JSON parse failed", {
          raw: content,
        });
        throw new Error("OPENROUTER_INVALID_JSON");
      }

      if (!Array.isArray(parsed)) {
        console.warn("[OPENROUTER] Response is not scenario array", parsed);
      }

      console.log("[OPENROUTER] Success — scenarios:", parsed.length ?? "unknown");

      return {
        model: "openai/gpt-4o-mini",
        scenarios: parsed,
      };
    },
  };
}