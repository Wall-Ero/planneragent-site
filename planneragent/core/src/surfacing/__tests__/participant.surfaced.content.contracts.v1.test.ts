import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  ParticipantSurfacedContentClassificationV1,
  ParticipantSurfacedContentOriginV1,
  ParticipantSurfacedContentV1,
} from "../participant.surfaced.content.contracts.v1";

const minimal = {
  version: 1,
  content_id: "participant-surfaced-content:sha256:abc123",
  origin: "USER_REQUESTED_EVALUATION",
  channel: "COCKPIT",
  classification: "OBSERVATIONAL",
  statements: ["Production remains within the observed operating envelope."],
  issued_at: "2026-08-22T10:00:00Z",
  audience_scope_ref: "participant-scope:1",
  audience_scope_digest: "scope-digest-1",
  source_ref: "snapshot:1",
  source_digest: "source-digest-1",
} as const satisfies ParticipantSurfacedContentV1;

describe("PARTICIPANT-SURFACED-CONTENT-V1-CONTRACT", () => {
  it("accepts the minimal admitted-content shape", () => {
    expect(minimal).toEqual({
      version: 1,
      content_id: "participant-surfaced-content:sha256:abc123",
      origin: "USER_REQUESTED_EVALUATION",
      channel: "COCKPIT",
      classification: "OBSERVATIONAL",
      statements: ["Production remains within the observed operating envelope."],
      issued_at: "2026-08-22T10:00:00Z",
      audience_scope_ref: "participant-scope:1",
      audience_scope_digest: "scope-digest-1",
      source_ref: "snapshot:1",
      source_digest: "source-digest-1",
    });
  });

  it("freezes the version, cockpit channel, origins, and descriptive classifications", () => {
    expectTypeOf<ParticipantSurfacedContentV1["version"]>().toEqualTypeOf<1>();
    expectTypeOf<ParticipantSurfacedContentV1["channel"]>().toEqualTypeOf<"COCKPIT">();
    expectTypeOf<ParticipantSurfacedContentOriginV1>().toEqualTypeOf<
      "USER_REQUESTED_EVALUATION" | "ATTENTION_TRIGGER" | "CONVERSATION_RESPONSE" | "PLATFORM_ALERT"
    >();
    expectTypeOf<ParticipantSurfacedContentClassificationV1>().toEqualTypeOf<
      "OBSERVATIONAL" | "EXPLANATORY" | "ADVISORY" | "EXECUTION_RELATED"
    >();
  });

  it.each([
    "USER_REQUESTED_EVALUATION",
    "ATTENTION_TRIGGER",
    "CONVERSATION_RESPONSE",
    "PLATFORM_ALERT",
  ] as const)("accepts origin %s", (origin) => {
    const value: ParticipantSurfacedContentV1 = { ...minimal, origin };
    expect(value.origin).toBe(origin);
  });

  it.each(["OBSERVATIONAL", "EXPLANATORY", "ADVISORY", "EXECUTION_RELATED"] as const)(
    "accepts non-authorizing classification %s",
    (classification) => {
      const value: ParticipantSurfacedContentV1 = { ...minimal, classification };
      expect(value.classification).toBe(classification);
      expect(value).not.toHaveProperty("authority");
      expect(value).not.toHaveProperty("allowed");
    },
  );

  it("supports only the frozen optional fields", () => {
    const complete: ParticipantSurfacedContentV1 = {
      ...minimal,
      expires_at: "2026-08-22T10:05:00Z",
      evidence_refs: ["evidence:1"],
      causal_references: ["request:1"],
    };
    expect(complete.expires_at).toBe("2026-08-22T10:05:00Z");
    expect(complete.evidence_refs).toEqual(["evidence:1"]);
    expect(complete.causal_references).toEqual(["request:1"]);
  });

  it("requires non-empty ordered text statements", () => {
    expect(minimal.statements).toEqual(["Production remains within the observed operating envelope."]);
    // @ts-expect-error silence cannot be represented by an empty statements tuple
    const emptyStatements: ParticipantSurfacedContentV1 = { ...minimal, statements: [] };
    expect(emptyStatements.statements).toEqual([]);
  });

  it("requires the identity, scope, source, and issue-time fields", () => {
    // @ts-expect-error content_id is required
    const noContentId: ParticipantSurfacedContentV1 = (({ content_id: _, ...value }) => value)(minimal);
    // @ts-expect-error audience_scope_ref is required
    const noAudienceRef: ParticipantSurfacedContentV1 = (({ audience_scope_ref: _, ...value }) => value)(minimal);
    // @ts-expect-error audience_scope_digest is required
    const noAudienceDigest: ParticipantSurfacedContentV1 = (({ audience_scope_digest: _, ...value }) => value)(minimal);
    // @ts-expect-error source_ref is required
    const noSourceRef: ParticipantSurfacedContentV1 = (({ source_ref: _, ...value }) => value)(minimal);
    // @ts-expect-error source_digest is required
    const noSourceDigest: ParticipantSurfacedContentV1 = (({ source_digest: _, ...value }) => value)(minimal);
    // @ts-expect-error issued_at is required
    const noIssuedAt: ParticipantSurfacedContentV1 = (({ issued_at: _, ...value }) => value)(minimal);
    expect([noContentId, noAudienceRef, noAudienceDigest, noSourceRef, noSourceDigest, noIssuedAt]).toHaveLength(6);
  });

  it("rejects an empty surfaced object and keeps silence outside the contract", () => {
    // @ts-expect-error an empty object is not admitted surfaced content
    const empty: ParticipantSurfacedContentV1 = {};
    const silence: ParticipantSurfacedContentV1 | undefined = undefined;
    expect(empty).toEqual({});
    expect(silence).toBeUndefined();
  });

  it("is recursively immutable by type convention", () => {
    const value: ParticipantSurfacedContentV1 = minimal;
    if (false) {
      // @ts-expect-error surfaced fields are readonly
      value.content_id = "replacement";
      // @ts-expect-error statement arrays are readonly
      value.statements.push("replacement");
    }
    expect(value.content_id).toBe(minimal.content_id);
  });

  it("excludes invitation, admission, authority, raw cognition, HTML, actions, and credentials", () => {
    expect(Object.keys(minimal).sort()).toEqual([
      "audience_scope_digest",
      "audience_scope_ref",
      "channel",
      "classification",
      "content_id",
      "issued_at",
      "origin",
      "source_digest",
      "source_ref",
      "statements",
      "version",
    ]);
    for (const prohibited of [
      "invitation", "admitted", "allowed", "authorization", "authority", "permission_graph",
      "actor", "company", "narrative", "attention", "notification", "suppression_reason",
      "denial_reason", "policy", "optimizer", "governance", "html", "actions", "credentials",
    ]) expect(minimal).not.toHaveProperty(prohibited);
  });
});
