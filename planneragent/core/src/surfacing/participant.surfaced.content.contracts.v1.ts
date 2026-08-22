/**
 * Participant-safe content that has already passed surfacing admission.
 *
 * Absence of this contract at a transport boundary means silence. Classification
 * is descriptive only and grants no observation, advisory, or execution authority.
 * Anonymous invitation content belongs to the UI empty state, not this contract.
 */

export type ParticipantSurfacedContentOriginV1 =
  | "USER_REQUESTED_EVALUATION"
  | "ATTENTION_TRIGGER"
  | "CONVERSATION_RESPONSE"
  | "PLATFORM_ALERT";

export type ParticipantSurfacedContentClassificationV1 =
  | "OBSERVATIONAL"
  | "EXPLANATORY"
  | "ADVISORY"
  | "EXECUTION_RELATED";

export type ParticipantSurfacedContentV1 = Readonly<{
  version: 1;
  content_id: string;
  origin: ParticipantSurfacedContentOriginV1;
  channel: "COCKPIT";
  classification: ParticipantSurfacedContentClassificationV1;
  statements: readonly [string, ...string[]];
  issued_at: string;
  expires_at?: string;
  audience_scope_ref: string;
  audience_scope_digest: string;
  source_ref: string;
  source_digest: string;
  evidence_refs?: readonly string[];
  causal_references?: readonly string[];
}>;
