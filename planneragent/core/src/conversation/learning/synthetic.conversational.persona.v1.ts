import { createHash } from "node:crypto";

export const SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS_V1 = Object.freeze([
  "FLUENT", "IMPERFECT", "TERSE", "TYPO_PRONE", "ABBREVIATION_HEAVY", "MIXED_TERMINOLOGY",
] as const);
export type SyntheticPersonaLanguageQualityTraitV1 = (typeof SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS_V1)[number];

export const SYNTHETIC_PERSONA_EXPERTISE_LEVELS_V1 = Object.freeze(["NOVICE", "PRACTITIONER", "EXPERT"] as const);
export type SyntheticPersonaExpertiseV1 = (typeof SYNTHETIC_PERSONA_EXPERTISE_LEVELS_V1)[number];

export const SYNTHETIC_PERSONA_COMMUNICATION_TRAITS_V1 = Object.freeze([
  "DIRECT", "EXPLORATORY", "SKEPTICAL", "CONFUSED", "IMPATIENT", "NON_TECHNICAL", "FOLLOW_UP_HEAVY", "INCOMPLETE",
] as const);
export type SyntheticPersonaCommunicationTraitV1 = (typeof SYNTHETIC_PERSONA_COMMUNICATION_TRAITS_V1)[number];

export const SYNTHETIC_PERSONA_TERMINOLOGY_TRAITS_V1 = Object.freeze([
  "USES_DOMAIN_TERMINOLOGY", "USES_INDUSTRY_ABBREVIATIONS", "AVOIDS_TECHNICAL_TERMINOLOGY", "MIXES_ENGLISH_INDUSTRY_TERMINOLOGY",
] as const);
export type SyntheticPersonaTerminologyTraitV1 = (typeof SYNTHETIC_PERSONA_TERMINOLOGY_TRAITS_V1)[number];

export type CreateSyntheticConversationalPersonaInputV1 = Readonly<{
  version: 1;
  persona_id: string;
  persona_version: string;
  declared_role: Readonly<{ label: string }>;
  language: string;
  locale?: string;
  language_quality_traits: readonly SyntheticPersonaLanguageQualityTraitV1[];
  expertise: SyntheticPersonaExpertiseV1;
  communication_traits: readonly SyntheticPersonaCommunicationTraitV1[];
  terminology_traits: readonly SyntheticPersonaTerminologyTraitV1[];
}>;

declare const syntheticPersonaBrand: unique symbol;
export type SyntheticConversationalPersonaV1 = Readonly<CreateSyntheticConversationalPersonaInputV1 & {
  origin: "SYNTHETIC";
  authority: "NONE";
  identity_verified: false;
  operational_truth: false;
  persona_digest: string;
  readonly [syntheticPersonaBrand]: true;
}>;

const REQUIRED_KEYS = Object.freeze([
  "communication_traits", "declared_role", "expertise", "language", "language_quality_traits", "persona_id", "persona_version",
  "terminology_traits", "version",
] as const);
const ALLOWED_KEYS = Object.freeze([...REQUIRED_KEYS, "locale"] as const);
const ROLE_KEYS = Object.freeze(["label"] as const);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const LANGUAGE = /^[A-Za-z]{2,3}$/;
const LOCALE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})+$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

function exactInput(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return REQUIRED_KEYS.every((key) => keys.includes(key)) && keys.every((key) => ALLOWED_KEYS.includes(key as typeof ALLOWED_KEYS[number]));
}

function exactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && IDENTIFIER.test(value);
}

function canonicalLocale(value: string): string {
  const segments = value.split("-");
  return [segments[0].toLowerCase(), ...segments.slice(1).map((segment) => segment.length === 2 && /^[A-Za-z]+$/.test(segment) ? segment.toUpperCase() : segment)].join("-");
}

function canonicalTraits<T extends string>(value: unknown, allowed: readonly T[], failure: string): readonly T[] {
  if (!Array.isArray(value) || value.some((entry) => !allowed.includes(entry as T)) || new Set(value).size !== value.length) throw new TypeError(failure);
  return [...value].sort() as T[];
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

type CanonicalJson = null | boolean | number | string | readonly CanonicalJson[] | Readonly<{ [key: string]: CanonicalJson }>;
function stableJson(value: CanonicalJson): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Readonly<Record<string, CanonicalJson>>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function createSyntheticConversationalPersonaV1(input: unknown): SyntheticConversationalPersonaV1 {
  if (!exactInput(input) || input.version !== 1 || !identifier(input.persona_id) || !identifier(input.persona_version)) throw new TypeError("INVALID_SYNTHETIC_CONVERSATIONAL_PERSONA");
  if (!exactObject(input.declared_role, ROLE_KEYS) || typeof input.declared_role.label !== "string") throw new TypeError("INVALID_SYNTHETIC_PERSONA_DECLARED_ROLE");
  const roleLabel = input.declared_role.label.trim();
  if (roleLabel.length === 0 || roleLabel.length > 128 || CONTROL_CHARACTER.test(roleLabel)) throw new TypeError("INVALID_SYNTHETIC_PERSONA_DECLARED_ROLE");
  if (typeof input.language !== "string" || !LANGUAGE.test(input.language)) throw new TypeError("INVALID_SYNTHETIC_PERSONA_LANGUAGE");
  if (input.locale !== undefined && (typeof input.locale !== "string" || !LOCALE.test(input.locale))) throw new TypeError("INVALID_SYNTHETIC_PERSONA_LOCALE");
  if (!SYNTHETIC_PERSONA_EXPERTISE_LEVELS_V1.includes(input.expertise as SyntheticPersonaExpertiseV1)) throw new TypeError("INVALID_SYNTHETIC_PERSONA_EXPERTISE");

  const semantic = {
    version: 1 as const,
    persona_id: input.persona_id,
    persona_version: input.persona_version,
    declared_role: { label: roleLabel },
    language: input.language.toLowerCase(),
    ...(input.locale === undefined ? {} : { locale: canonicalLocale(input.locale) }),
    language_quality_traits: canonicalTraits(input.language_quality_traits, SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS_V1, "INVALID_SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS"),
    expertise: input.expertise as SyntheticPersonaExpertiseV1,
    communication_traits: canonicalTraits(input.communication_traits, SYNTHETIC_PERSONA_COMMUNICATION_TRAITS_V1, "INVALID_SYNTHETIC_PERSONA_COMMUNICATION_TRAITS"),
    terminology_traits: canonicalTraits(input.terminology_traits, SYNTHETIC_PERSONA_TERMINOLOGY_TRAITS_V1, "INVALID_SYNTHETIC_PERSONA_TERMINOLOGY_TRAITS"),
    origin: "SYNTHETIC" as const,
    authority: "NONE" as const,
    identity_verified: false as const,
    operational_truth: false as const,
  };
  if (semantic.language_quality_traits.includes("FLUENT") && semantic.language_quality_traits.includes("IMPERFECT")) throw new TypeError("CONTRADICTORY_SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS");
  const persona_digest = `synthetic-conversational-persona:sha256:${createHash("sha256").update(stableJson(semantic)).digest("hex")}`;
  return deepFreeze({ ...semantic, persona_digest }) as unknown as SyntheticConversationalPersonaV1;
}
