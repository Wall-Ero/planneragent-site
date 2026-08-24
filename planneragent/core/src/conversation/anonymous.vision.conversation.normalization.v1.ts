export type AnonymousVisionIntentNormalizationV1 = Readonly<{
  protected_disclosure: boolean;
  data_introduction: boolean;
  direct_execution: boolean;
  bounded_continuity: boolean;
  explicit_product_relationship: boolean;
  operational_subject: boolean;
  descriptive_state_or_change: boolean;
}>;

type IntentTokenV1 = Readonly<{ raw: string; value: string; identifier_like: boolean }>;

function tokenize(message: string): IntentTokenV1[] {
  return (message.match(/[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*/g) ?? []).map((raw) => Object.freeze({
    raw,
    value: raw.toLowerCase(),
    identifier_like: /\d/.test(raw) || raw.includes("_") || raw.includes("-") || (/^[A-Z]{2,}$/.test(raw) && raw.length > 3),
  }));
}

function withinOneEdit(value: string, expected: string): boolean {
  if (value === expected) return true;
  if (Math.abs(value.length - expected.length) > 1) return false;
  if (value.length === expected.length) {
    const differences: number[] = [];
    for (let index = 0; index < value.length; index++) if (value[index] !== expected[index]) differences.push(index);
    return differences.length === 1 || (differences.length === 2 && differences[1] === differences[0] + 1 && value[differences[0]] === expected[differences[1]] && value[differences[1]] === expected[differences[0]]);
  }
  const [longer, shorter] = value.length > expected.length ? [value, expected] : [expected, value];
  let longIndex = 0, shortIndex = 0, skipped = false;
  while (longIndex < longer.length && shortIndex < shorter.length) {
    if (longer[longIndex] === shorter[shortIndex]) { longIndex++; shortIndex++; continue; }
    if (skipped) return false;
    skipped = true; longIndex++;
  }
  return true;
}

const exact = (token: IntentTokenV1 | undefined, value: string) => token?.value === value;
const near = (token: IntentTokenV1 | undefined, value: string) => Boolean(token && !token.identifier_like && value.length >= 5 && withinOneEdit(token.value, value));
const anyNear = (tokens: readonly IntentTokenV1[], values: readonly string[]) => tokens.some((token) => values.some((value) => near(token, value)));
const anyExact = (tokens: readonly IntentTokenV1[], values: readonly string[]) => tokens.some((token) => values.includes(token.value));

function productCue(tokens: readonly IntentTokenV1[]): boolean {
  const what = exact(tokens[0], "what") || exact(tokens[0], "wht");
  const can = exact(tokens[1], "can") || exact(tokens[1], "cna");
  const doLike = exact(tokens[3], "do") || exact(tokens[3], "dot");
  if (what && can && (exact(tokens[2], "you") || near(tokens[2], "planneragent")) && doLike) return true;
  if (what && exact(tokens[1], "is") && (exact(tokens[2], "vision") || exact(tokens[2], "vison"))) return true;
  return exact(tokens[0], "explain") && near(tokens[1], "planneragent") && /^capabilit/.test(tokens[2]?.value ?? "");
}

function boundedCue(tokens: readonly IntentTokenV1[]): boolean {
  if (tokens.length === 3 && exact(tokens[0], "are") && (exact(tokens[1], "you") || exact(tokens[1], "yu")) && near(tokens[2], "ready")) return true;
  if (tokens.length === 1 && near(tokens[0], "thanks")) return true;
  return tokens.length === 2 && near(tokens[0], "thank") && exact(tokens[1], "you");
}

function dataCue(tokens: readonly IntentTokenV1[]): boolean {
  const action = anyNear(tokens, ["upload", "connect"]);
  const object = anyExact(tokens, ["csv", "xlsx", "excel", "sap", "erp", "spreadsheet", "dataset", "file", "source"]) || anyNear(tokens, ["spreadsheet"])
    || tokens.some((token, index) => token.value === "dat" && tokens[index + 1]?.value === "source");
  return action && object;
}

function executionCue(tokens: readonly IntentTokenV1[]): boolean {
  const commands = ["reschedule", "approve", "execute", "change", "update", "remediate", "cancel"] as const;
  const commandAt = (index: number) => commands.some((command) => near(tokens[index], command));
  const command = commandAt(0) || ((exact(tokens[0], "can") || exact(tokens[0], "could") || exact(tokens[0], "would")) && near(tokens[1], "planneragent") && commandAt(2));
  const object = anyExact(tokens, ["production", "delivery", "purchase", "approval", "inventory", "order", "plan", "schedule", "system", "erp", "action", "transaction"]);
  return command && object;
}

function protectedCue(tokens: readonly IntentTokenV1[]): boolean {
  const disclosureVerb = anyNear(tokens, ["reveal"]) || anyExact(tokens, ["show"]);
  const protectedObject = anyExact(tokens, ["prompt", "instructions", "instruction", "credentials", "credential"]);
  const protectedQualifier = anyNear(tokens, ["hidden", "internal"]);
  return disclosureVerb && protectedObject && protectedQualifier;
}

export function deriveEnglishAnonymousVisionIntentNormalizationV1(message: string): AnonymousVisionIntentNormalizationV1 {
  const tokens = tokenize(message);
  return Object.freeze({
    protected_disclosure: protectedCue(tokens),
    data_introduction: dataCue(tokens),
    direct_execution: executionCue(tokens),
    bounded_continuity: boundedCue(tokens),
    explicit_product_relationship: productCue(tokens),
    operational_subject: anyNear(tokens, ["availability"]),
    descriptive_state_or_change: anyNear(tokens, ["slipping", "missing", "broken"]),
  });
}
