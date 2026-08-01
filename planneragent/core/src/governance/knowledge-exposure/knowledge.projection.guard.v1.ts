import { createHash } from "node:crypto";
import type {
  KnowledgeProjectionManifestV1,
  KnowledgeReferenceV1,
  KnowledgeExposureFailureCode,
} from "./knowledge.exposure.contracts.v1";

const TEXT = /^[A-Za-z0-9][A-Za-z0-9:._/-]{0,255}$/;
const FIELD = /^[A-Za-z][A-Za-z0-9_.-]{0,127}$/;
const DIGEST = /^[0-9a-f]{64}$/;

export function deepCopyAndFreeze<T>(input: T): Readonly<T> {
  const copy = structuredClone(input);
  const freeze = (value: unknown): void => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  };
  freeze(copy);
  return copy;
}

function manifestSubject(manifest: Omit<KnowledgeProjectionManifestV1, "projection_digest">) {
  return {
    version: manifest.version,
    schema_id: manifest.schema_id,
    schema_version: manifest.schema_version,
    representation: manifest.representation,
    included_fields: manifest.included_fields.map(field => ({ ...field })),
    excluded_categories: [...manifest.excluded_categories],
    source_knowledge_references: [...manifest.source_knowledge_references],
  };
}

export function knowledgeProjectionDigestV1(
  manifest: Omit<KnowledgeProjectionManifestV1, "projection_digest">,
): string {
  return createHash("sha256")
    .update(JSON.stringify(manifestSubject(manifest)), "utf8")
    .digest("hex");
}

export function validateKnowledgeProjectionManifestV1(
  manifest: KnowledgeProjectionManifestV1,
  knowledge: readonly KnowledgeReferenceV1[],
): readonly KnowledgeExposureFailureCode[] {
  const failures = new Set<KnowledgeExposureFailureCode>();
  if (
    !manifest || manifest.version !== 1 || !TEXT.test(manifest.schema_id ?? "") ||
    !TEXT.test(manifest.schema_version ?? "") ||
    !["STRUCTURED_JSON", "PLAIN_TEXT", "GENERATED_DOCUMENT"].includes(manifest.representation) ||
    !Array.isArray(manifest.included_fields) || manifest.included_fields.length === 0 ||
    !Array.isArray(manifest.excluded_categories) ||
    !Array.isArray(manifest.source_knowledge_references)
  ) failures.add("KNOWLEDGE_PROJECTION_INVALID");

  const refs = new Map(knowledge.map(reference => [reference.knowledge_reference, reference]));
  const fields = manifest?.included_fields ?? [];
  const names = fields.map(field => field?.field);
  if (names.some(name => !FIELD.test(name ?? "") || name.includes("*") || name.includes("["))) {
    failures.add("KNOWLEDGE_PROJECTION_INVALID");
  }
  if (new Set(names).size !== names.length || names.some((name, index) => index > 0 && names[index - 1]! >= name!)) {
    failures.add("KNOWLEDGE_PROJECTION_INVALID");
  }
  for (const field of fields) {
    const reference = refs.get(field?.knowledge_reference);
    if (!reference || !reference.authorized_fields.includes(field.field)) {
      failures.add("KNOWLEDGE_PROJECTION_FIELD_UNAUTHORIZED");
      continue;
    }
    if (reference.category !== field.category || manifest.excluded_categories.includes(field.category)) {
      failures.add("KNOWLEDGE_PROJECTION_FIELD_UNAUTHORIZED");
    }
  }
  const referenced = new Set(fields.map(field => field.knowledge_reference));
  if (
    new Set(manifest.source_knowledge_references).size !== manifest.source_knowledge_references.length ||
    manifest.source_knowledge_references.some((reference, index) =>
      !refs.has(reference) || !referenced.has(reference) ||
      (index > 0 && manifest.source_knowledge_references[index - 1]! >= reference)
    )
  ) failures.add("KNOWLEDGE_PROJECTION_INVALID");

  if (!DIGEST.test(manifest.projection_digest ?? "")) {
    failures.add("KNOWLEDGE_PROJECTION_INVALID");
  } else if (knowledgeProjectionDigestV1(manifest) !== manifest.projection_digest) {
    failures.add("KNOWLEDGE_PROJECTION_DIGEST_MISMATCH");
  }
  return Object.freeze([...failures].sort());
}
