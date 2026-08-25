import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createSyntheticConversationalPersonaV1,
  type CreateSyntheticConversationalPersonaInputV1,
  type SyntheticConversationalPersonaV1,
} from "../learning/synthetic.conversational.persona.v1";

const input = (): CreateSyntheticConversationalPersonaInputV1 => ({
  version: 1,
  persona_id: "persona:supply-chain-manager",
  persona_version: "1",
  declared_role: { label: "supply chain manager" },
  language: "en",
  language_quality_traits: ["FLUENT", "ABBREVIATION_HEAVY"],
  expertise: "PRACTITIONER",
  communication_traits: ["DIRECT"],
  terminology_traits: ["USES_INDUSTRY_ABBREVIATIONS"],
});

describe("SyntheticConversationalPersonaV1", () => {
  it("constructs a deeply immutable persona with fixed constitutional invariants", () => {
    const persona = createSyntheticConversationalPersonaV1(input());
    expect(persona).toMatchObject({ origin: "SYNTHETIC", authority: "NONE", identity_verified: false, operational_truth: false });
    expect(Object.isFrozen(persona) && Object.isFrozen(persona.declared_role) && Object.isFrozen(persona.language_quality_traits)).toBe(true);
    expectTypeOf(persona).toEqualTypeOf<SyntheticConversationalPersonaV1>();
  });

  it("rejects caller-selected constitutional markers", () => {
    for (const override of [{ authority: "OPERATIONAL" }, { identity_verified: true }, { operational_truth: true }, { origin: "HUMAN" }]) {
      expect(() => createSyntheticConversationalPersonaV1({ ...input(), ...override })).toThrow("INVALID_SYNTHETIC_CONVERSATIONAL_PERSONA");
    }
  });

  it("accepts open role labels as non-authoritative communication metadata", () => {
    const persona = createSyntheticConversationalPersonaV1({ ...input(), declared_role: { label: "maintenance planning lead" } });
    expect(persona.declared_role).toEqual({ label: "maintenance planning lead" });
    expect(persona.authority).toBe("NONE");
    expect(persona).not.toHaveProperty("authenticated_role");
  });

  it("keeps canonical language and optional locale separate", () => {
    const persona = createSyntheticConversationalPersonaV1({ ...input(), language: "IT", locale: "it-it" });
    expect(persona.language).toBe("it");
    expect(persona.locale).toBe("it-IT");
    expect(createSyntheticConversationalPersonaV1(input())).not.toHaveProperty("locale");
  });

  it.each([
    [{ ...input(), persona_id: "" }, "INVALID_SYNTHETIC_CONVERSATIONAL_PERSONA"],
    [{ ...input(), persona_version: "" }, "INVALID_SYNTHETIC_CONVERSATIONAL_PERSONA"],
    [{ ...input(), declared_role: { label: "" } }, "INVALID_SYNTHETIC_PERSONA_DECLARED_ROLE"],
    [{ ...input(), language: "english" }, "INVALID_SYNTHETIC_PERSONA_LANGUAGE"],
    [{ ...input(), locale: "Italy" }, "INVALID_SYNTHETIC_PERSONA_LOCALE"],
    [{ ...input(), expertise: "AUTHORITY" }, "INVALID_SYNTHETIC_PERSONA_EXPERTISE"],
    [{ ...input(), language_quality_traits: ["PERFECT"] }, "INVALID_SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS"],
    [{ ...input(), communication_traits: ["OBEDIENT"] }, "INVALID_SYNTHETIC_PERSONA_COMMUNICATION_TRAITS"],
    [{ ...input(), terminology_traits: ["ERP_ADMIN"] }, "INVALID_SYNTHETIC_PERSONA_TERMINOLOGY_TRAITS"],
  ])("rejects malformed identity and unknown profile values", (candidate, failure) => {
    expect(() => createSyntheticConversationalPersonaV1(candidate)).toThrow(failure);
  });

  it("rejects duplicate traits", () => {
    expect(() => createSyntheticConversationalPersonaV1({ ...input(), language_quality_traits: ["TERSE", "TERSE"] })).toThrow("INVALID_SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS");
    expect(() => createSyntheticConversationalPersonaV1({ ...input(), communication_traits: ["DIRECT", "DIRECT"] })).toThrow("INVALID_SYNTHETIC_PERSONA_COMMUNICATION_TRAITS");
    expect(() => createSyntheticConversationalPersonaV1({ ...input(), language_quality_traits: ["FLUENT", "IMPERFECT"] })).toThrow("CONTRADICTORY_SYNTHETIC_PERSONA_LANGUAGE_QUALITY_TRAITS");
  });

  it("canonicalizes semantic trait sets before sealing identity", () => {
    const first = createSyntheticConversationalPersonaV1({ ...input(), language_quality_traits: ["TERSE", "TYPO_PRONE"] });
    const reordered = createSyntheticConversationalPersonaV1({ ...input(), language_quality_traits: ["TYPO_PRONE", "TERSE"] });
    expect(reordered.language_quality_traits).toEqual(["TERSE", "TYPO_PRONE"]);
    expect(reordered.persona_digest).toBe(first.persona_digest);
  });

  it("changes the digest when semantic persona content changes", () => {
    const persona = createSyntheticConversationalPersonaV1(input());
    expect(createSyntheticConversationalPersonaV1({ ...input(), declared_role: { label: "buyer" } }).persona_digest).not.toBe(persona.persona_digest);
    expect(createSyntheticConversationalPersonaV1({ ...input(), expertise: "EXPERT" }).persona_digest).not.toBe(persona.persona_digest);
  });

  it("seals the same digest regardless of input object property order", () => {
    const original = input();
    const reordered = {
      terminology_traits: original.terminology_traits, communication_traits: original.communication_traits, expertise: original.expertise,
      language_quality_traits: original.language_quality_traits, language: original.language, declared_role: original.declared_role,
      persona_version: original.persona_version, persona_id: original.persona_id, version: original.version,
    };
    expect(createSyntheticConversationalPersonaV1(reordered).persona_digest).toBe(createSyntheticConversationalPersonaV1(original).persona_digest);
  });

  it("requires canonical construction to obtain the branded type", () => {
    const plain = input();
    // @ts-expect-error Plain input lacks the private nominal brand and sealed fields.
    const branded: SyntheticConversationalPersonaV1 = plain;
    expect(branded).toBe(plain);
  });

  it("rejects production identity, scenario truth, utterance, provider, and Voice fields", () => {
    for (const forbidden of [
      { tenant_id: "tenant:1" }, { organization_id: "organization:1" }, { authenticated_role: "manager" },
      { scenario_id: "scenario:1" }, { facts: [] }, { truth_projection: {} }, { utterance: "hello" },
      { provider: "openrouter" }, { teacher_model: "model" }, { voice_profile: {} },
    ]) expect(() => createSyntheticConversationalPersonaV1({ ...input(), ...forbidden })).toThrow("INVALID_SYNTHETIC_CONVERSATIONAL_PERSONA");
  });

  it("is independent of scenario, message, provider, authority, and runtime identities", () => {
    const persona = createSyntheticConversationalPersonaV1(input());
    expect(Object.keys(persona)).not.toEqual(expect.arrayContaining(["scenario_id", "conversation_id", "turn_id", "utterance", "provider", "tenant_id", "user_id"]));
  });
});
