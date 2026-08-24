import { OpenAIConversationalInterpretationAdapterV1 } from "../cognition/openai.conversational.interpretation.adapter.v1";
import { CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1 } from "./conversational.interpretation.gold.corpus.v1";
import { calculateConversationalInterpretationShadowMetricsV1, ConversationalInterpretationShadowEvaluatorV1 } from "./conversational.interpretation.shadow.evaluator.v1";

const apiKey = process.env.OPENAI_CONVERSATIONAL_API_KEY?.trim();
const model = process.env.OPENAI_CONVERSATIONAL_MODEL?.trim();
if (!apiKey || !model) {
  console.error("CONFIGURATION_UNAVAILABLE: set OPENAI_CONVERSATIONAL_API_KEY and OPENAI_CONVERSATIONAL_MODEL");
  process.exitCode = 2;
} else {
  const provider = new OpenAIConversationalInterpretationAdapterV1({ api_key: apiKey, model });
  const evaluator = new ConversationalInterpretationShadowEvaluatorV1(provider);
  const observations = [];
  for (const fixture of CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1) {
    const observation = await evaluator.evaluate(fixture);
    observations.push(observation);
    console.log(JSON.stringify({ input_id: fixture.input_id, expected: fixture.expected_interaction, cognitive: observation.cognitive_result?.interaction, comparison: observation.comparison, risk: observation.risk }));
  }
  console.log(JSON.stringify({ metrics: calculateConversationalInterpretationShadowMetricsV1(CONVERSATIONAL_INTERPRETATION_GOLD_CORPUS_V1, observations) }));
}
