import { describe, expect, expectTypeOf, it } from "vitest";
import type { RealizationEnvelopeV1 } from "../cognitive.realization.envelope.v1";
import type { PlannerAgentVoiceProfileV1 } from "../planneragent.voice.profile.v1";
import {
  CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1,
  createConversationalProviderDescriptorV1,
  parseConversationalInterpretationResultV1,
  sealConversationalInterpretationRequestV1,
  type ConversationalInterpretationProviderV1,
  type ConversationalRealizationEnvelopeV1,
  type ConversationalRealizationProviderV1,
  type SealedConversationalRealizationRequestV1,
} from "../cognition/conversational.cognition.contracts.v1";

const invariant = CONVERSATIONAL_INTERPRETATION_INVARIANTS_V1;
const product = { version: 1, interaction: "PRODUCT_QUESTION", product_focus: "GENERAL_CAPABILITIES", resolution: "CLEAR", ...invariant } as const;
const audience = { version: 1, interaction: "AUDIENCE_DECLARATION", audience_declaration: { declared_role: "CFO" }, resolution: "CLEAR", ...invariant } as const;
const descriptor = (capabilities: readonly ("INTERPRETATION" | "REALIZATION")[], id: string) => createConversationalProviderDescriptorV1({
  version: 1, provider_id: id, adapter_id: `adapter:${id}`, adapter_version: "1", model_id: `model:${id}`, model_version: "1",
  capabilities, deployment_class: "TEST", retention_privacy_class: "NO_RETENTION",
});

describe("CONVERSATIONAL-COGNITION-CONTRACTS-V1", () => {
  it("accepts and deeply freezes valid Product and audience interpretations", () => {
    const parsedProduct = parseConversationalInterpretationResultV1(product);
    const parsedAudience = parseConversationalInterpretationResultV1(audience);
    expect(parsedProduct).toEqual(product);
    expect(parsedAudience).toEqual(audience);
    expect(Object.isFrozen(parsedProduct)).toBe(true);
    expect(Object.isFrozen(parsedAudience)).toBe(true);
    expect(Object.isFrozen(parsedAudience?.audience_declaration)).toBe(true);
    expect(parsedAudience).toMatchObject({ interpretation_only: true, requester_content_non_authoritative: true, grants_authority: false, grants_execution: false });
  });

  it.each([
    ["invalid interaction", { ...product, interaction: "OTHER" }],
    ["invalid Product focus", { ...product, product_focus: "PRICE" }],
    ["Product focus on non-Product interaction", { ...product, interaction: "UNRELATED" }],
    ["missing audience role", { ...audience, audience_declaration: undefined }],
    ["empty audience role", { ...audience, audience_declaration: { declared_role: "" } }],
    ["audience on non-audience interaction", { ...audience, interaction: "UNRELATED" }],
    ["unknown result field", { ...product, provider: "provider-a" }],
    ["unknown audience field", { ...audience, audience_declaration: { declared_role: "CFO", authenticated: true } }],
    ["unsupported version", { ...product, version: 2 }],
    ["authority grant", { ...product, grants_authority: true }],
    ["execution grant", { ...product, grants_execution: true }],
    ["ambiguous interaction with clear resolution", { ...product, interaction: "AMBIGUOUS" }],
    ["ambiguous resolution with Product interaction", { ...product, resolution: "AMBIGUOUS" }],
  ])("fails closed on %s", (_name, value) => expect(parseConversationalInterpretationResultV1(value)).toBeUndefined());

  it("seals only raw requester language, taxonomy, result requirement, and non-authority invariants", () => {
    const request = sealConversationalInterpretationRequestV1("What can PlannerAgent do?");
    expect(Object.isFrozen(request)).toBe(true);
    expect(request).toEqual({
      version: 1,
      raw_user_message: "What can PlannerAgent do?",
      allowed_interactions: expect.arrayContaining(["PRODUCT_QUESTION", "AUDIENCE_DECLARATION"]),
      invariants: { interpretation_only: true, requester_content_non_authoritative: true, grants_authority: false, grants_execution: false },
      required_result_contract: "CONVERSATIONAL_INTERPRETATION_RESULT_V1",
    });
    expect(JSON.stringify(request)).not.toMatch(/tenant|credential|authority_proof|operational_truth/i);
  });

  it("represents independent interpretation-only, realization-only, and combined providers", () => {
    const interpretation = descriptor(["INTERPRETATION"], "provider-a");
    const realization = descriptor(["REALIZATION"], "provider-b");
    const both = descriptor(["INTERPRETATION", "REALIZATION"], "provider-c");
    expect(interpretation.capabilities).toEqual(["INTERPRETATION"]);
    expect(realization.capabilities).toEqual(["REALIZATION"]);
    expect(both.capabilities).toEqual(["INTERPRETATION", "REALIZATION"]);
    expect(Object.isFrozen(both)).toBe(true);
    expect(Object.isFrozen(both.capabilities)).toBe(true);

    const interpreter: ConversationalInterpretationProviderV1 = { descriptor: interpretation, interpret: async () => product };
    const realizer: ConversationalRealizationProviderV1<{ readonly product_projection_reference: string }> = { descriptor: realization, realize: async () => '{"version":1,"answer":"Answer"}' };
    expect(interpreter.descriptor.provider_id).not.toBe(realizer.descriptor.provider_id);
  });

  it("keeps governed meaning source-specific and Voice compatible without changing the realization envelope", () => {
    type ProductMeaning = Readonly<{ product_projection_reference: string }>;
    expectTypeOf<SealedConversationalRealizationRequestV1<ProductMeaning>["governed_meaning"]>().toEqualTypeOf<ProductMeaning>();
    expectTypeOf<SealedConversationalRealizationRequestV1<ProductMeaning>["voice_profile"]>().toEqualTypeOf<PlannerAgentVoiceProfileV1>();
    expectTypeOf<ConversationalRealizationEnvelopeV1>().toEqualTypeOf<RealizationEnvelopeV1>();
    const envelope: ConversationalRealizationEnvelopeV1 = { version: 1, answer: "Natural answer." };
    expect(envelope).toEqual({ version: 1, answer: "Natural answer." });
  });

  it("contains no provider-specific wire semantics in the semantic contracts", () => {
    expect(JSON.stringify({ product, audience, request: sealConversationalInterpretationRequestV1("Hello") })).not.toMatch(/openai|openrouter|anthropic|gemini|cloudflare|choices|messages|responses/i);
  });
});
