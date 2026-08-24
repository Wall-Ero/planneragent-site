export const COGNITIVE_REALIZATION_ANSWER_MAX_LENGTH_V1 = 16_384;

export type RealizationEnvelopeV1 = Readonly<{
  version: 1;
  answer: string;
}>;

export function parseRealizationEnvelopeV1(value: string): RealizationEnvelopeV1 | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
  const object = parsed as Record<string, unknown>;
  if (Object.keys(object).sort().join(",") !== "answer,version" || object.version !== 1 || typeof object.answer !== "string") return undefined;
  const answer = object.answer.trim();
  if (answer.length === 0 || answer.length > COGNITIVE_REALIZATION_ANSWER_MAX_LENGTH_V1) return undefined;
  return Object.freeze({ version: 1, answer });
}
