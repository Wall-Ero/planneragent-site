const text = (value: unknown, maximum: number): value is string => typeof value === "string" && value.length > 0 && value.length <= maximum;

export function normalizeEmailIdentityV1(value: unknown): string {
  if (!text(value, 320)) throw new Error("EMAIL_INVALID");
  const candidate = value.trim(), at = candidate.lastIndexOf("@");
  if (at <= 0 || at === candidate.length - 1 || candidate.indexOf("@") !== at) throw new Error("EMAIL_INVALID");
  const local = candidate.slice(0, at), domain = candidate.slice(at + 1).toLowerCase();
  if (!local || local.length > 64 || !domain.includes(".") || /\s/.test(candidate)) throw new Error("EMAIL_INVALID");
  return `${local}@${domain}`;
}
