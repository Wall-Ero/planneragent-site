import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OpenRouterConversationalInterpretationAdapterV1, type OpenRouterConversationalInterpretationEvidenceV1 } from "../cognition/openrouter.conversational.interpretation.adapter.v1";
import { CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1, type ConversationalInterpretationGoldCaseV1 } from "./conversational.interpretation.gold.corpus.v1";
import { calculateConversationalInterpretationShadowMetricsV1, ConversationalInterpretationShadowEvaluatorV1, type ConversationalInterpretationShadowObservationV1 } from "./conversational.interpretation.shadow.evaluator.v1";

const localValue = (name: string): string | undefined => {
  const path = resolve(process.cwd(), ".dev.vars");
  if (!existsSync(path)) return undefined;
  const line = readFileSync(path, "utf8").split(/\r?\n/).find((value) => value.trim().startsWith(`${name}=`));
  if (!line) return undefined;
  return line.slice(line.indexOf("=") + 1).trim().replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;
};

const apiKey = process.env.OPENROUTER_API_KEY?.trim() || localValue("OPENROUTER_API_KEY");
const model = process.env.OPENROUTER_CONVERSATIONAL_MODEL?.trim() || localValue("OPENROUTER_CONVERSATIONAL_MODEL");
const supplemental: ConversationalInterpretationGoldCaseV1 = Object.freeze({ input_id: "supplemental-product-erp-capability", category: "PRODUCT", message: "Can PlannerAgent connect to ERP systems?", expected_interaction: "PRODUCT_QUESTION", expected_resolution: "CLEAR" });

if (!apiKey || !model) {
  console.error("CONFIGURATION_UNAVAILABLE: set OPENROUTER_API_KEY and OPENROUTER_CONVERSATIONAL_MODEL");
  process.exitCode = 2;
} else if (model === "openrouter/free" || model === "openrouter/auto") {
  console.error("QUALIFICATION_MODEL_NOT_PINNED: configure an explicit model other than openrouter/free or openrouter/auto");
  process.exitCode = 2;
} else {
  const completed: Readonly<{ run: number; observations: readonly ConversationalInterpretationShadowObservationV1[] }>[] = [];
  for (let run = 1; run <= 3; run++) {
    const evidence: OpenRouterConversationalInterpretationEvidenceV1[] = [];
    const provider = new OpenRouterConversationalInterpretationAdapterV1({ api_key: apiKey, model, on_evidence: (value) => evidence.push(value) });
    const evaluator = new ConversationalInterpretationShadowEvaluatorV1(provider);
    const observations: ConversationalInterpretationShadowObservationV1[] = [];
    for (const fixture of CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1) {
      const observation = await evaluator.evaluate(fixture);
      observations.push(observation);
      console.log(JSON.stringify({ run, input_id: fixture.input_id, message: fixture.message, gold_interaction: fixture.expected_interaction, actual_interaction: observation.cognitive_result?.interaction, gold_resolution: fixture.expected_resolution, actual_resolution: observation.cognitive_result?.resolution, gold_product_focus: fixture.expected_product_focus, actual_product_focus: observation.cognitive_result?.product_focus, audience_declaration_detected: Boolean(observation.cognitive_result?.audience_declaration), comparison: observation.comparison, high_risk_conflict: observation.risk === "HIGH_RISK_CONFLICT" }));
    }
    const extra = await evaluator.evaluate(supplemental);
    console.log(JSON.stringify({ run, supplemental: true, input_id: supplemental.input_id, message: supplemental.message, gold_interaction: supplemental.expected_interaction, actual_interaction: extra.cognitive_result?.interaction, gold_resolution: supplemental.expected_resolution, actual_resolution: extra.cognitive_result?.resolution, actual_product_focus: extra.cognitive_result?.product_focus, audience_declaration_detected: Boolean(extra.cognitive_result?.audience_declaration), comparison: extra.comparison, high_risk_conflict: extra.risk === "HIGH_RISK_CONFLICT" }));
    console.log(JSON.stringify({ run, configured_model: model, returned_models: [...new Set(evidence.map((value) => value.returned_model))], returned_providers: [...new Set(evidence.flatMap((value) => value.returned_provider ? [value.returned_provider] : []))], adapter_id: provider.descriptor.adapter_id, adapter_version: provider.descriptor.adapter_version, metrics: calculateConversationalInterpretationShadowMetricsV1(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1, observations) }));
    completed.push(Object.freeze({ run, observations: Object.freeze(observations) }));
  }
  const unstable = CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1.flatMap((fixture) => {
    const values = completed.map(({ observations }) => observations.find((value) => value.input_id === fixture.input_id)?.cognitive_result).map((value) => JSON.stringify({ interaction: value?.interaction, resolution: value?.resolution, product_focus: value?.product_focus, audience: Boolean(value?.audience_declaration) }));
    return new Set(values).size > 1 ? [{ input_id: fixture.input_id, message: fixture.message, results: values.map((value, index) => ({ run: index + 1, ...JSON.parse(value) })) }] : [];
  });
  console.log(JSON.stringify({ cross_run_instability: unstable }));
}
