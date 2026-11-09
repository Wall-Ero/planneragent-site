import { HYBRID_TEACHER_MODEL_V1 } from "../../src/conversation/cognition/hybrid.conversational.teacher.v1";
import { createNaturalCapabilitiesAnswerPlanV1, renderNaturalCapabilitiesV1 } from "../../src/conversation/cognition/hybrid.natural.capabilities.v1";
import type { InjectedHttpFixtureV1 } from "./live.http";

// Authored offline data only. No captured conversations, credentials or provider responses.
export function createValidInjectedCompletionV1(answer = renderNaturalCapabilitiesV1(createNaturalCapabilitiesAnswerPlanV1()).text) {
  return { success: true, errors: [], messages: [], result: { id: "offline-completion-v1", object: "chat.completion", created: 1,
    model: HYBRID_TEACHER_MODEL_V1, choices: [{ index: 0, finish_reason: "stop", stop_reason: null,
      message: { role: "assistant", content: JSON.stringify({ version: 1, answer }) } }],
    usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 } } };
}
export function createValidInjectedHttpFixtureV1(): InjectedHttpFixtureV1 {
  return { status: 200, headers: { "content-type": "application/json" }, chunks: [JSON.stringify(createValidInjectedCompletionV1())] };
}
