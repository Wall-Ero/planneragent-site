import { admitAnonymousVisionConversationV1, type AnonymousConversationAdmissionV1 } from "../anonymous.vision.conversation.policy.v1";
import { sealConversationalInterpretationRequestV1, type ConversationalInterpretationProviderV1, type ConversationalInterpretationResultV1, type ConversationalInteractionV1, type ConversationalProviderDescriptorV1 } from "../cognition/conversational.cognition.contracts.v1";
import type { ConversationalInterpretationGoldCaseV1, ConversationalInterpretationGoldCategoryV1 } from "./conversational.interpretation.gold.corpus.v1";

export type ConversationalInterpretationComparisonV1 = "AGREEMENT" | "COGNITIVE_COVERAGE_GAIN" | "DETERMINISTIC_ONLY" | "CONFLICT" | "AMBIGUOUS" | "EVALUATION_FAILURE";
export type ConversationalInterpretationRiskV1 = "NONE" | "HIGH_RISK_CONFLICT";

const mapping: Readonly<Record<AnonymousConversationAdmissionV1, ConversationalInteractionV1>> = Object.freeze({
  PRODUCT_CONVERSATION: "PRODUCT_QUESTION",
  BOUNDED_CONVERSATION: "CONVERSATIONAL_CONTINUITY",
  DESCRIPTIVE_OPERATIONAL_CONTEXT: "OPERATIONAL_DESCRIPTION",
  DATA_INTRODUCTION: "DATA_INTRODUCTION",
  EXECUTION_REQUEST: "EXECUTION_REQUEST",
  PROTECTED_DISCLOSURE: "PROTECTED_DISCLOSURE",
});
const hard = new Set<ConversationalInteractionV1>(["DATA_INTRODUCTION", "EXECUTION_REQUEST", "PROTECTED_DISCLOSURE"]);

export type ConversationalInterpretationShadowObservationV1 = Readonly<{
  version: 1;
  input_id: string;
  deterministic_interaction?: ConversationalInteractionV1;
  cognitive_result?: ConversationalInterpretationResultV1;
  comparison: ConversationalInterpretationComparisonV1;
  risk: ConversationalInterpretationRiskV1;
  provider_descriptor: ConversationalProviderDescriptorV1;
  failure?: "INTERPRETATION_FAILED";
}>;

export class ConversationalInterpretationShadowEvaluatorV1 {
  constructor(private readonly provider: ConversationalInterpretationProviderV1) {}

  async evaluate(fixture: ConversationalInterpretationGoldCaseV1): Promise<ConversationalInterpretationShadowObservationV1> {
    const admitted = admitAnonymousVisionConversationV1({ version: 1, request_id: `shadow:${fixture.input_id}`, message: fixture.message });
    const deterministic = admitted ? mapping[admitted.admission] : undefined;
    let cognitive: ConversationalInterpretationResultV1;
    try { cognitive = await this.provider.interpret(sealConversationalInterpretationRequestV1(fixture.message)); }
    catch { return Object.freeze({ version: 1, input_id: fixture.input_id, ...(deterministic ? { deterministic_interaction: deterministic } : {}), comparison: "EVALUATION_FAILURE", risk: "NONE", provider_descriptor: this.provider.descriptor, failure: "INTERPRETATION_FAILED" }); }
    const comparison: ConversationalInterpretationComparisonV1 = cognitive.interaction === "AMBIGUOUS" || cognitive.resolution === "AMBIGUOUS" ? "AMBIGUOUS"
      : deterministic === cognitive.interaction ? "AGREEMENT"
      : !deterministic && cognitive.resolution === "CLEAR" ? "COGNITIVE_COVERAGE_GAIN"
      : deterministic && (cognitive.interaction === "UNRELATED" || cognitive.resolution === "UNSUPPORTED") ? "DETERMINISTIC_ONLY"
      : "CONFLICT";
    const risk = hard.has(fixture.expected_interaction) && cognitive.interaction !== fixture.expected_interaction ? "HIGH_RISK_CONFLICT" : "NONE";
    return Object.freeze({ version: 1, input_id: fixture.input_id, ...(deterministic ? { deterministic_interaction: deterministic } : {}), cognitive_result: cognitive, comparison, risk, provider_descriptor: this.provider.descriptor });
  }
}

export type ConversationalInterpretationShadowMetricsV1 = Readonly<{
  total: number;
  exact_interaction_accuracy: number;
  hard_boundary_recall: number;
  audience_declaration_recall: number;
  product_question_accuracy: number;
  operational_description_accuracy: number;
  ambiguity_handling: number;
  product_focus_accuracy: number;
  coverage_gains: number;
  high_risk_conflicts: number;
  evaluation_failures: number;
  by_category: Readonly<Record<ConversationalInterpretationGoldCategoryV1, number>>;
}>;

const ratio = (matches: number, total: number) => total === 0 ? 1 : matches / total;
export function calculateConversationalInterpretationShadowMetricsV1(fixtures: readonly ConversationalInterpretationGoldCaseV1[], observations: readonly ConversationalInterpretationShadowObservationV1[]): ConversationalInterpretationShadowMetricsV1 {
  const indexed = new Map(observations.map((value) => [value.input_id, value]));
  const selected = (predicate: (fixture: ConversationalInterpretationGoldCaseV1) => boolean) => fixtures.filter(predicate);
  const interactionAccuracy = (cases: readonly ConversationalInterpretationGoldCaseV1[]) => ratio(cases.filter((fixture) => indexed.get(fixture.input_id)?.cognitive_result?.interaction === fixture.expected_interaction).length, cases.length);
  const categories = ["PRODUCT", "AUDIENCE", "OPERATIONAL", "DATA", "EXECUTION", "PROTECTED", "CONTINUITY", "UNRELATED", "AMBIGUOUS", "ITALIAN"] as const;
  const productFocus = selected((fixture) => fixture.expected_product_focus !== undefined);
  return Object.freeze({
    total: fixtures.length,
    exact_interaction_accuracy: interactionAccuracy(fixtures),
    hard_boundary_recall: interactionAccuracy(selected((fixture) => hard.has(fixture.expected_interaction))),
    audience_declaration_recall: interactionAccuracy(selected((fixture) => fixture.expected_interaction === "AUDIENCE_DECLARATION")),
    product_question_accuracy: interactionAccuracy(selected((fixture) => fixture.expected_interaction === "PRODUCT_QUESTION")),
    operational_description_accuracy: interactionAccuracy(selected((fixture) => fixture.expected_interaction === "OPERATIONAL_DESCRIPTION")),
    ambiguity_handling: interactionAccuracy(selected((fixture) => fixture.expected_interaction === "AMBIGUOUS")),
    product_focus_accuracy: ratio(productFocus.filter((fixture) => indexed.get(fixture.input_id)?.cognitive_result?.product_focus === fixture.expected_product_focus).length, productFocus.length),
    coverage_gains: observations.filter((value) => value.comparison === "COGNITIVE_COVERAGE_GAIN").length,
    high_risk_conflicts: observations.filter((value) => value.risk === "HIGH_RISK_CONFLICT").length,
    evaluation_failures: observations.filter((value) => value.comparison === "EVALUATION_FAILURE").length,
    by_category: Object.freeze(Object.fromEntries(categories.map((category) => [category, interactionAccuracy(selected((fixture) => fixture.category === category))])) as Record<ConversationalInterpretationGoldCategoryV1, number>),
  });
}
