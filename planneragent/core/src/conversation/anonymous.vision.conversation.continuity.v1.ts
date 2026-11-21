import { PUBLIC_CONVERSATION_CONTEXT_HEADER_V1, PUBLIC_CONVERSATION_CONTEXT_PATTERN_V1, PUBLIC_CONVERSATION_ID_HEADER_V1, PUBLIC_CONVERSATION_ID_PATTERN_V1, type PublicConversationContinuityMetadataV1 } from "./anonymous.vision.conversation.contracts.v1";
import { interpretAnonymousVisionIntentV1 } from "./anonymous.vision.conversation.intent.v1";
import { hybridCanonicalV1, hybridDigestV1, hybridSnapshotV1 } from "./cognition/hybrid.conversational.contracts.v1";
import { prepareNaturalCapabilitiesRealizationV1, verifyNaturalCapabilitiesCandidateV1, type NaturalCapabilitiesAnswerPlanV1, type renderNaturalCapabilitiesV1 } from "./cognition/hybrid.natural.capabilities.v1";

export const PUBLIC_CONTINUITY_TTL_MS_V1 = 5 * 60_000;
export const PUBLIC_CONTINUITY_MAX_RECORDS_V1 = 512;
export const PUBLIC_CONTINUITY_MAX_RECORD_BYTES_V1 = 2 * 1024;
const ordinals = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"] as const;

export function parsePublicContinuityHeadersV1(headers: Headers): PublicConversationContinuityMetadataV1 | undefined {
  const id = headers.get(PUBLIC_CONVERSATION_ID_HEADER_V1), ref = headers.get(PUBLIC_CONVERSATION_CONTEXT_HEADER_V1);
  if (!id || !PUBLIC_CONVERSATION_ID_PATTERN_V1.test(id)) return undefined;
  // Retain only the valid namespace so a malformed reference can invalidate an
  // intervened parent, but can neither read nor mint any context. Drop its text.
  if (ref !== null && !PUBLIC_CONVERSATION_CONTEXT_PATTERN_V1.test(ref)) return Object.freeze({ conversation_id: id, invalid_context: true });
  return Object.freeze({ conversation_id: id, ...(ref !== null ? { context_ref: ref } : {}) });
}

export function admitsPublicDomainListQuestionV1(message: string): boolean {
  return /^which (?:planning )?domains does planneragent support[.!?]?$/i.test(message.trim().replace(/\s+/g, " "));
}

export function publicDomainOrdinalV1(message: string): number | undefined {
  if (interpretAnonymousVisionIntentV1(message)) return undefined;
  const match = /^(?:explain|and) the (first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth) one[.!?]?$/i.exec(message.trim().replace(/\s+/g, " "));
  return match ? ordinals.indexOf(match[1].toLowerCase() as typeof ordinals[number]) : undefined;
}

function approvedPlan() {
  const prepared = prepareNaturalCapabilitiesRealizationV1();
  if (prepared.purpose !== "REALIZATION") throw new Error("CONTINUITY_PUBLIC_SOURCE_UNAVAILABLE");
  return prepared.payload.governed_meaning as NaturalCapabilitiesAnswerPlanV1;
}
const bytes = (value: unknown) => new TextEncoder().encode(hybridCanonicalV1(value)).byteLength;

export type PublicDomainContextRecordV1 = Readonly<{
  version: 1; scope: "CORE_PUBLIC_DOMAIN_LIST_V1";
  conversation_id: string; context_ref: string; originating_request_id: string;
  issued_at_ms: number; expires_at_ms: number;
  source_digest: string; plan_digest: string; render_digest: string;
  ordered_domains: readonly string[]; record_digest: string;
}>;

function compatibleRecord(record: PublicDomainContextRecordV1): boolean {
  try {
    const { record_digest, ...payload } = record;
    const plan = approvedPlan();
    return record_digest === hybridDigestV1(payload) && bytes(record) <= PUBLIC_CONTINUITY_MAX_RECORD_BYTES_V1 &&
      record.version === 1 && record.scope === "CORE_PUBLIC_DOMAIN_LIST_V1" &&
      PUBLIC_CONVERSATION_ID_PATTERN_V1.test(record.conversation_id) && PUBLIC_CONVERSATION_CONTEXT_PATTERN_V1.test(record.context_ref) &&
      record.expires_at_ms - record.issued_at_ms === PUBLIC_CONTINUITY_TTL_MS_V1 &&
      record.source_digest === plan.provenance.source_digest && record.plan_digest === hybridDigestV1(plan) &&
      hybridCanonicalV1(record.ordered_domains) === hybridCanonicalV1(plan.allowed_facts.supported_planning_domains);
  } catch { return false; }
}

// Volatile, bounded public provenance only. No raw prompts, transcripts, tenant
// data, identity sessions or durable storage. A missing isolate safely loses context.
export class PublicDomainContinuityRepositoryV1 {
  private readonly records = new Map<string, PublicDomainContextRecordV1>();
  constructor(private readonly now_ms: () => number = () => Date.now()) {}
  private purge(): void {
    const now = this.now_ms();
    if (!Number.isSafeInteger(now) || now < 0) { this.records.clear(); return; }
    for (const [id, record] of this.records) if (record.expires_at_ms <= now || record.issued_at_ms > now) this.records.delete(id);
  }
  get size(): number { this.purge(); return this.records.size; }
  reset(): void { this.records.clear(); }
  invalidate(conversation_id: string): void { this.records.delete(conversation_id); }

  issue(conversation_id: string, request_id: string, plan: NaturalCapabilitiesAnswerPlanV1, rendered: ReturnType<typeof renderNaturalCapabilitiesV1>): string | undefined {
    this.purge();
    const expected = approvedPlan();
    if (!PUBLIC_CONVERSATION_ID_PATTERN_V1.test(conversation_id) || !request_id.trim() || request_id.length > 256 ||
        hybridCanonicalV1(plan) !== hybridCanonicalV1(expected) || rendered.plan_digest !== hybridDigestV1(plan) ||
        verifyNaturalCapabilitiesCandidateV1(prepareNaturalCapabilitiesRealizationV1(), { version: 1, answer: rendered.text }) !== "PASS") return undefined;
    const context_ref = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
    const now = this.now_ms();
    if (!Number.isSafeInteger(now) || now < 0) return undefined;
    const payload = { version: 1 as const, scope: "CORE_PUBLIC_DOMAIN_LIST_V1" as const,
      conversation_id, context_ref, originating_request_id: request_id, issued_at_ms: now, expires_at_ms: now + PUBLIC_CONTINUITY_TTL_MS_V1,
      source_digest: plan.provenance.source_digest, plan_digest: rendered.plan_digest, render_digest: hybridDigestV1(rendered.text),
      ordered_domains: plan.allowed_facts.supported_planning_domains };
    const record = hybridSnapshotV1({ ...payload, record_digest: hybridDigestV1(payload) });
    if (bytes(record) > PUBLIC_CONTINUITY_MAX_RECORD_BYTES_V1) return undefined;
    this.records.delete(conversation_id);
    while (this.records.size >= PUBLIC_CONTINUITY_MAX_RECORDS_V1) this.records.delete(this.records.keys().next().value!);
    this.records.set(conversation_id, record);
    return context_ref;
  }

  // Check and delete synchronously, before any await: only one request can take
  // a reference in this isolate. A mismatch never reads another conversation.
  take(metadata: PublicConversationContinuityMetadataV1): PublicDomainContextRecordV1 | undefined {
    this.purge();
    if (metadata.invalid_context) return undefined;
    const record = this.records.get(metadata.conversation_id);
    if (!record || record.context_ref !== metadata.context_ref) return undefined;
    this.records.delete(metadata.conversation_id);
    return compatibleRecord(record) ? record : undefined;
  }
}
export const defaultPublicDomainContinuityRepositoryV1 = new PublicDomainContinuityRepositoryV1();

export function createPublicDomainReferencePlanV1(record: PublicDomainContextRecordV1, index: number) {
  if (!compatibleRecord(record) || !Number.isInteger(index) || index < 0 || index >= record.ordered_domains.length) throw new Error("CONTINUITY_REFERENCE_NOT_VERIFIED");
  const sourcePlan = approvedPlan();
  const domain = record.ordered_domains[index];
  const qualification = sourcePlan.mandatory_elements.find(element => element.id === "DOMAINS")!;
  const boundary = sourcePlan.mandatory_elements.filter(element => element.id === "VISION" || element.id === "ANONYMOUS_BOUNDARY").map(element => element.approved_text).join(" ");
  return hybridSnapshotV1({ version: 1, scope: "PUBLIC_DOMAIN_REFERENCE_V1", parent: record, index, domain,
    text: `The ${ordinals[index]} item in the list I provided was ${domain.replaceAll("_", " ")}. ${qualification.approved_text} ${boundary}`,
    grants_authority: false, grants_execution: false, operational_evidence: false });
}
export type PublicDomainReferencePlanV1 = ReturnType<typeof createPublicDomainReferencePlanV1>;

export function renderPublicDomainReferenceV1(plan: PublicDomainReferencePlanV1) {
  if (!plan || hybridCanonicalV1(plan) !== hybridCanonicalV1(createPublicDomainReferencePlanV1(plan.parent, plan.index)) || plan.text.length > 700) throw new Error("CONTINUITY_UNTRUSTED_PLAN");
  return hybridSnapshotV1({ text: plan.text, plan_digest: hybridDigestV1(plan) });
}
