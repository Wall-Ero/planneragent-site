export const ANONYMOUS_VISION_INPUT_MAX_LENGTH_V1 = 16_384;

export type AnonymousVisionRequestContextV1 = Readonly<{
  version: 1;
  request_id: string;
  declared_role?: string;
  declared_company?: string;
  input: string;
  trust: Readonly<{
    source: "REQUESTER_SUPPLIED";
    authority: "NON_AUTHORITATIVE";
    scope: "REQUEST_BOUND";
  }>;
}>;

const allowedFields = new Set([
  "version",
  "request_id",
  "declared_role",
  "declared_company",
  "input",
]);

function boundedText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
}

/**
 * Admits descriptive input for one anonymous VISION evaluation. The returned
 * value is context only: it establishes no identity, participation, authority,
 * persistence, evidence provenance, or organizational-data entitlement.
 */
export function admitAnonymousVisionRequestContextV1(
  value: unknown,
): AnonymousVisionRequestContextV1 | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((field) => !allowedFields.has(field))) return undefined;
  if (input.version !== 1 || !boundedText(input.request_id, 256)) return undefined;
  if (!boundedText(input.input, ANONYMOUS_VISION_INPUT_MAX_LENGTH_V1)) return undefined;
  if (input.declared_role !== undefined && !boundedText(input.declared_role, 256)) return undefined;
  if (input.declared_company !== undefined && !boundedText(input.declared_company, 256)) return undefined;

  return Object.freeze({
    version: 1,
    request_id: input.request_id,
    ...(input.declared_role === undefined ? {} : { declared_role: input.declared_role }),
    ...(input.declared_company === undefined ? {} : { declared_company: input.declared_company }),
    input: input.input,
    trust: Object.freeze({
      source: "REQUESTER_SUPPLIED",
      authority: "NON_AUTHORITATIVE",
      scope: "REQUEST_BOUND",
    }),
  });
}
