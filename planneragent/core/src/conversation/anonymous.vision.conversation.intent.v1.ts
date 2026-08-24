import type { AnonymousConversationAdmissionV1 } from "./anonymous.vision.conversation.policy.v1";

export type AnonymousVisionIntentFeaturesV1 = Readonly<{
  protected_disclosure: boolean;
  data_introduction: boolean;
  direct_execution: boolean;
  bounded_continuity: boolean;
  explicit_product_relationship: boolean;
  operational_subject: boolean;
  requester_context: boolean;
  descriptive_state_or_change: boolean;
}>;

const protectedDisclosure = /system prompt|hidden (?:prompt|instruction)|internal (?:prompt|instruction|architecture|implementation)|proprietary (?:algorithm|implementation)|credentials?|api key|secret key|security internals?|chain of thought/i;
const dataIntroduction = /\b(?:upload|attach|import|provide|submit|send|analy[sz]e|use)\b[\s\S]{0,60}\b(?:csv|xlsx|excel|spreadsheet|file|dataset|company data|operational data)\b|\b(?:csv|xlsx|excel|spreadsheet|dataset)\b[\s\S]{0,60}\b(?:upload|attach|import|analy[sz]e|use)\b|\bconnect\b[\s\S]{0,40}\b(?:sap|erp|api|data source|source)\b/i;
const directExecution = /^(?:(?:please\s+)?|(?:can|could|would)\s+you\s+(?:please\s+)?|use\s+planneragent\s+to\s+)(?:move|reschedule|approve|execute|change|update|remediate|place|cancel)\b[\s\S]{0,160}\b(?:delivery|date|production|purchase|approval|inventory|order|plan|schedule|system|erp|action|transaction|level)\b/i;
const boundedContinuity = /^(?:(?:hello|hi|hey)(?:\s+planneragent)?[!.?]*|(?:are you ready|who are you|are you there|can you hear me|can we begin)[?.!]*|(?:ok(?:ay)?|understood|got it|thanks|thank you)[!.?]*)$/i;
const namedProduct = /\bplanneragent\b|\bvision\b|\b(?:graduate|junior|senior|principal)\s+(?:tier|plan|capabilit(?:y|ies))\b/i;
const namedTierCapabilityQuestion = /\b(?:graduate|junior|senior|principal)\b[\s\S]{0,80}\b(?:can|capabilit|execute|execution|actions?|allow)/i;
const productRelationship = /\b(?:capabilit(?:y|ies)|tier|limitation|getting started|use cases?|supported?|work in|work with)\b|\bwhat can (?:you|planneragent) do\b|\bhow (?:can|could|do) you help\b|\bwhat is vision\b|\bwhich [\w -]+ domains? (?:do you|does planneragent) support\b/i;
const operationalSubject = /\b(?:supplier|material availability|materials?|inventory|orders?|production|delivery|schedule|weekly plan|milestones?|warehouse|logistics|finance|planning|operations?|operational pressure|pressure)\b/i;
const requesterContext = /\b(?:i(?:'m| am| don't| do not)|we(?:'re| are| keep| repeatedly)|our|one of our|to me)\b/i;
const descriptiveStateOrChange = /\b(?:miss(?:ing|ed)?|late|delay(?:ed|s)?|slip(?:ping|s|ped)?|shortage|blocked|unstable|pressure|risk|problem|issue|keeps? (?:moving|changing|slipping)|constantly|repeatedly|changes? (?:late|at the last moment)|unclear|don't know where|do not know where|mismatch|fail(?:ing|ure|s|ed)?)\b/i;

export function extractAnonymousVisionIntentFeaturesV1(message: string): AnonymousVisionIntentFeaturesV1 {
  const explicitProductTarget = namedProduct.test(message);
  const explicitProductRelationship = productRelationship.test(message);
  return Object.freeze({
    protected_disclosure: protectedDisclosure.test(message),
    data_introduction: dataIntroduction.test(message),
    direct_execution: directExecution.test(message),
    bounded_continuity: boundedContinuity.test(message),
    explicit_product_relationship: explicitProductTarget || namedTierCapabilityQuestion.test(message) || explicitProductRelationship,
    operational_subject: operationalSubject.test(message),
    requester_context: requesterContext.test(message),
    descriptive_state_or_change: descriptiveStateOrChange.test(message),
  });
}

export function resolveAnonymousVisionIntentV1(features: AnonymousVisionIntentFeaturesV1): AnonymousConversationAdmissionV1 | undefined {
  if (features.protected_disclosure) return "PROTECTED_DISCLOSURE";
  if (features.data_introduction) return "DATA_INTRODUCTION";
  if (features.direct_execution) return "EXECUTION_REQUEST";
  if (features.bounded_continuity) return "BOUNDED_CONVERSATION";
  if (features.explicit_product_relationship) return "PRODUCT_CONVERSATION";
  if (features.operational_subject && features.descriptive_state_or_change) return "DESCRIPTIVE_OPERATIONAL_CONTEXT";
  return undefined;
}

export function interpretAnonymousVisionIntentV1(message: string): AnonymousConversationAdmissionV1 | undefined {
  return resolveAnonymousVisionIntentV1(extractAnonymousVisionIntentFeaturesV1(message));
}
