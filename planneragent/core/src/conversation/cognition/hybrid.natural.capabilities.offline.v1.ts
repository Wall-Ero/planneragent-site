import type { ConversationalInterpretationProviderV1 } from "./conversational.cognition.contracts.v1";
import { sealConversationalInterpretationRequestV1 } from "./conversational.cognition.contracts.v1";
import { hybridSnapshotV1 } from "./hybrid.conversational.contracts.v1";
import { runOfflineHybridSupervisionV1, type OfflineHybridDependenciesV1 } from "./hybrid.conversational.supervision.v1";
import { admitNaturalCapabilitiesV1, authorizeNaturalCapabilitiesExposureV1, authorizeNaturalCapabilitiesTeacherExposureV1, createNaturalCapabilitiesAnswerPlanV1,
  prepareNaturalCapabilitiesRealizationV1, renderNaturalCapabilitiesV1, verifyNaturalCapabilitiesBindingV1, verifyNaturalCapabilitiesCandidateV1 } from "./hybrid.natural.capabilities.v1";

export type NaturalCapabilitiesOfflineDependenciesV1 = Readonly<{
  // Existing Student interface; trusted host supplies an offline fixture.
  interpretation: ConversationalInterpretationProviderV1;
  realization: OfflineHybridDependenciesV1["student"];
  registry: OfflineHybridDependenciesV1["registry"];
  now: () => string;
  teacher?: OfflineHybridDependenciesV1["teacher"];
}>;

export async function runOfflineNaturalCapabilitiesV1(input: Readonly<{ request_id: string; message: string; public_response: string }>, dependencies: NaturalCapabilitiesOfflineDependenciesV1) {
  input = hybridSnapshotV1(input);
  if (Object.keys(input).sort().join() !== "message,public_response,request_id" || typeof input.public_response !== "string" || typeof input.request_id !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,140}$/.test(input.request_id)) throw new TypeError("NATURAL_CAPABILITIES_INVALID_OFFLINE_INPUT");
  const admission = admitNaturalCapabilitiesV1(input.message);
  if (admission.decision === "DENY") return hybridSnapshotV1({ boundary: "CONVERSATIONAL_SURFACE_ONLY" as const, lifecycle: "SHADOW" as const, admission,
    public_response: input.public_response, offline_answer: "Please ask a general question about PlannerAgent's capabilities without operational or protected information." });
  if ([dependencies.interpretation.descriptor, dependencies.realization.descriptor].some(d => d.deployment_class !== "OFFLINE_FIXTURE")) {
    throw new TypeError("NATURAL_CAPABILITIES_OFFLINE_FIXTURES_REQUIRED");
  }
  const plan = createNaturalCapabilitiesAnswerPlanV1();
  const rendered = renderNaturalCapabilitiesV1(plan);
  const shared = { registry: dependencies.registry, now: dependencies.now, student_timeout_ms: 200, verification_timeout_ms: 200,
    authorize_exposure: authorizeNaturalCapabilitiesExposureV1, verify: verifyNaturalCapabilitiesBindingV1 };
  // Observe Interpretation locally; NO Interpretation Teacher is configured.
  // Student labels are recorded, never used to authorize external exposure.
  const interpretation_shadow = await runOfflineHybridSupervisionV1({ request_id: `${input.request_id}:interpretation`,
    request: { purpose: "INTERPRETATION", payload: sealConversationalInterpretationRequestV1(input.message) },
    public_response: input.public_response, semantic_family: "GENERAL_CAPABILITIES", evaluation_kind: "INDEPENDENT_NEW" }, {
    ...shared, student: { descriptor: dependencies.interpretation.descriptor,
      propose: async request => {
        if (request.purpose !== "INTERPRETATION") throw new TypeError("INTERPRETATION_ONLY");
        return dependencies.interpretation.interpret(request.payload);
      } },
  });
  // Realization Student/Teacher receive only the host-created public question/plan.
  const realizationRequest = prepareNaturalCapabilitiesRealizationV1();
  const realization_shadow = await runOfflineHybridSupervisionV1({ request_id: `${input.request_id}:realization`, request: realizationRequest,
    public_response: input.public_response, semantic_family: "GENERAL_CAPABILITIES", evaluation_kind: "INDEPENDENT_NEW" }, {
    ...shared, authorize_exposure: authorizeNaturalCapabilitiesTeacherExposureV1, student: dependencies.realization, teacher: dependencies.teacher,
  });
  const canonical_verification = verifyNaturalCapabilitiesCandidateV1(realizationRequest, { version: 1, answer: rendered.text });
  if (canonical_verification !== "PASS") throw new Error("NATURAL_CAPABILITIES_CANONICAL_RENDERING_UNVERIFIED");
  return hybridSnapshotV1({ boundary: "CONVERSATIONAL_SURFACE_ONLY" as const, lifecycle: "SHADOW" as const, admission,
    public_response: input.public_response, offline_answer: rendered.text, plan, rendering_evidence: rendered,
    canonical_verification, interpretation_shadow, realization_shadow });
}
