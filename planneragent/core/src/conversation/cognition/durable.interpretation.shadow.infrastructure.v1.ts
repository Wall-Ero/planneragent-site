import type { ShadowInterpretationEvidenceRepositoryV1, ShadowInterpretationEvidenceV1 } from "./conversational.interpretation.shadow.runtime.v1";
import { GCC4W_STUDENT_IDENTITY_V1 } from "./student.conversational.interpretation.adapter.v1";
import { CONVERSATIONAL_INTERACTIONS_V1, CONVERSATIONAL_PRODUCT_FOCUSES_V1 } from "./conversational.cognition.contracts.v1";
import { replayInterpretationStudentShadowWindowV1, type ShadowObservationWindowV1, type WindowedShadowObservationV1 } from "./interpretation.student.shadow.promotion.v1";
function validateEvidence(value: ShadowInterpretationEvidenceV1): ShadowInterpretationEvidenceV1 {
    if (!value || !value.candidate_identity || Object.entries(GCC4W_STUDENT_IDENTITY_V1).some(([k, v]) => (value.candidate_identity as Record<string, unknown>)[k] !== v))
        throw new Error("SHADOW_CANDIDATE_MISMATCH");
    const safe = admitted(value);
    const enums: Record<string, readonly unknown[]> = {
        deterministic_interaction: CONVERSATIONAL_INTERACTIONS_V1, student_interaction: CONVERSATIONAL_INTERACTIONS_V1,
        deterministic_product_focus: CONVERSATIONAL_PRODUCT_FOCUSES_V1, student_product_focus: CONVERSATIONAL_PRODUCT_FOCUSES_V1,
        hard_boundary_classification: ["NONE", "L1", "L2_CRITICAL", "L2_MAJOR", "L3"], role_surface_fidelity: ["NOT_APPLICABLE", "PRESERVED", "ROLE_SURFACE_CHANGED"],
        failure_class: ["TIMEOUT", "PROVIDER_ERROR", "JSON_INVALID", "CONTRACT_INVALID", "IDENTITY_MISMATCH"], provider_outcome: ["SUCCESS", "FAILURE"], activation_state: ["CONTROLLED_SHADOW"], student_lifecycle: ["QUALIFIED_FOR_SHADOW"]
    };
    for (const [key, allowed] of Object.entries(enums))
        if (key in safe && !allowed.includes((safe as Record<string, unknown>)[key]))
            throw new Error("INVALID_SHADOW_METADATA");
    for (const key of ["parser_valid", "closed_enum_valid", "exact_structured_match", "interaction_match", "product_focus_match", "hard_boundary_agreement", "audience_interaction_mismatch", "missing_role_due_to_interaction_mismatch", "grants_authority_observed", "grants_execution_observed", "protected_disclosure_violation"])
        if (typeof (safe as Record<string, unknown>)[key] !== "boolean")
            throw new Error("INVALID_SHADOW_METADATA");
    if (!timestamp(safe.observed_at) || typeof safe.correlation_id !== "string" || !safe.correlation_id || !/^sha256:[0-9a-f]{64}$/.test(safe.request_digest) || !Number.isFinite(safe.shadow_latency_ms) || safe.shadow_latency_ms < 0 || !Number.isFinite(safe.sample_percent) || safe.sample_percent < 0 || safe.sample_percent > 100 || !Number.isInteger(safe.sample_bucket) || safe.sample_bucket < 0 || safe.sample_bucket >= 10000 || value.version !== 1 || value.sampled !== true || value.telemetry_is_operational_truth !== false)
        throw new Error("INVALID_SHADOW_METADATA");
    if (safe.provider_outcome === "SUCCESS" ? (!!safe.failure_class || !safe.parser_valid || !safe.closed_enum_valid || !safe.student_interaction) : (!safe.failure_class || safe.parser_valid || safe.closed_enum_valid || !!safe.student_interaction || safe.interaction_match || safe.exact_structured_match))
        throw new Error("INCOHERENT_SHADOW_CONTRACT");
    return safe;
}
const servingPins = Object.freeze({ version: 1, protocol_version: "PA_STUDENT_HTTP_V1", ...GCC4W_STUDENT_IDENTITY_V1, expected_dtype: "bf16", endpoint_reference: "INTERPRETATION_STUDENT_ENDPOINT", credential_reference: "INTERPRETATION_STUDENT_AUTHORIZATION" } as const);
function deepFreeze<T>(value:T):T {
    if (value && typeof value === "object") {
        for (const child of Object.values(value)) deepFreeze(child);
        Object.freeze(value);
    }
    return value;
}
export type QualifiedStudentServingReferenceV1 = typeof servingPins;
export const QUALIFIED_STUDENT_SERVING_REFERENCE_V1 = servingPins;
export function createQualifiedStudentServingReferenceV1(input: QualifiedStudentServingReferenceV1): QualifiedStudentServingReferenceV1 {
    if (!input || Object.entries(servingPins).some(([key, value]) => (input as Record<string, unknown>)[key] !== value) || Object.keys(input).length !== Object.keys(servingPins).length)
        throw new TypeError("INVALID_QUALIFIED_STUDENT_SERVING_REFERENCE");
    return Object.freeze({ ...servingPins });
}
const timestamp = (value: string) => typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
export const isShadowWindowIdV1 = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
export async function shadowObservationIdV1(value: string): Promise<string> {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, "0")).join("");
}
type WindowRow = {
    window_id: string;
    state: "OPEN" | "CLOSED";
    serving_json: string;
    policy_version: 1;
    sample_percent: number;
    started_at: string;
    ended_at: string | null;
    total_eligible: number;
    sampled: number;
    revision: number;
    frozen_result_json: string | null;
};
const admitted = (v: ShadowInterpretationEvidenceV1): ShadowInterpretationEvidenceV1 => Object.freeze({ version: 1, observed_at: v.observed_at, correlation_id: v.correlation_id, request_digest: v.request_digest, deterministic_interaction: v.deterministic_interaction, ...(v.student_interaction ? { student_interaction: v.student_interaction } : {}), ...(v.deterministic_product_focus ? { deterministic_product_focus: v.deterministic_product_focus } : {}), ...(v.student_product_focus ? { student_product_focus: v.student_product_focus } : {}), parser_valid: v.parser_valid, closed_enum_valid: v.closed_enum_valid, exact_structured_match: v.exact_structured_match, interaction_match: v.interaction_match, product_focus_match: v.product_focus_match, hard_boundary_agreement: v.hard_boundary_agreement, hard_boundary_classification: v.hard_boundary_classification, role_surface_fidelity: v.role_surface_fidelity, audience_interaction_mismatch: v.audience_interaction_mismatch, missing_role_due_to_interaction_mismatch: v.missing_role_due_to_interaction_mismatch, ...(v.failure_class ? { failure_class: v.failure_class } : {}), candidate_identity: GCC4W_STUDENT_IDENTITY_V1, grants_authority_observed: v.grants_authority_observed, grants_execution_observed: v.grants_execution_observed, protected_disclosure_violation: v.protected_disclosure_violation, shadow_latency_ms: v.shadow_latency_ms, telemetry_is_operational_truth: false, provider_outcome: v.provider_outcome, activation_state: v.activation_state, sample_percent: v.sample_percent, sample_bucket: v.sample_bucket, sampled: true, student_lifecycle: v.student_lifecycle });
export class D1InterpretationShadowInfrastructureV1 implements ShadowInterpretationEvidenceRepositoryV1 {
    constructor(private readonly db: D1Database, private readonly active_window_id?: string) { }
    async start(input: Readonly<{
        window_id: string;
        serving: QualifiedStudentServingReferenceV1;
        policy_version: 1;
        sample_percent: number;
        started_at: string;
    }>): Promise<void> {
        const serving = createQualifiedStudentServingReferenceV1(input.serving);
        if (!isShadowWindowIdV1(input.window_id) || input.policy_version !== 1 || !timestamp(input.started_at) || !Number.isFinite(input.sample_percent) || input.sample_percent < 0 || input.sample_percent > 100)
            throw new TypeError("INVALID_SHADOW_WINDOW_START");
        await this.db.prepare(`INSERT INTO interpretation_shadow_windows(window_id,state,candidate_id,candidate_version,lifecycle,artifact_sha256,adapter_digest,policy_version,sample_percent,started_at,serving_json) VALUES(?,'OPEN',?,?,?,?,?,?,?,?,?)`).bind(input.window_id, serving.candidate_id, serving.candidate_version, serving.lifecycle, serving.artifact_sha256, serving.adapter_digest, input.policy_version, input.sample_percent, input.started_at, JSON.stringify(serving)).run();
    }
    private async snapshot(window_id: string) {
        const [windows, observations] = await this.db.batch([
            this.db.prepare(`SELECT * FROM interpretation_shadow_windows WHERE window_id=?`).bind(window_id),
            this.db.prepare(`SELECT observation_json FROM interpretation_shadow_observations WHERE window_id=? ORDER BY observation_id`).bind(window_id)
        ]);
        return { row: windows.results[0] as WindowRow | undefined, observations: observations.results.map(v => ({ window_id, observation: JSON.parse((v as {
                    observation_json: string;
                }).observation_json) as ShadowInterpretationEvidenceV1 })) };
    }
    async status(window_id: string) {
        const { row, observations } = await this.snapshot(window_id);
        if (!row)
            return undefined;
        const serving = createQualifiedStudentServingReferenceV1(JSON.parse(row.serving_json));
        const replay = row.frozen_result_json ? JSON.parse(row.frozen_result_json) as ShadowObservationWindowV1 : replayInterpretationStudentShadowWindowV1({ window_id, started_at: row.started_at, ended_at: row.started_at, total_authoritative_eligible_requests: row.total_eligible, sampled_requests: row.sampled, observations });
        const { closed, ended_at, recommendation, recommendation_reasons, ...aggregates } = replay;
        return deepFreeze({ window_id, state: row.state, serving, candidate_id: serving.candidate_id, candidate_version: serving.candidate_version, artifact_sha256: serving.artifact_sha256, policy_version: row.policy_version, sample_percent: row.sample_percent, started_at: row.started_at, ended_at: row.ended_at, total_eligible: row.total_eligible, sampled: row.sampled, completed: observations.length, aggregates, ...(row.state === "CLOSED" ? { recommendation, frozen_result: replay } : {}) });
    }
    async canSchedule(window_id: string, sample_percent?: number): Promise<boolean> {
        const row = await this.db.prepare(`SELECT * FROM interpretation_shadow_windows WHERE window_id=? AND state='OPEN'`).bind(window_id).first<WindowRow>();
        if (!row || row.policy_version !== 1 || (sample_percent !== undefined && row.sample_percent !== sample_percent))
            return false;
        try {
            const serving = createQualifiedStudentServingReferenceV1(JSON.parse(row.serving_json));
            for (const key of ["candidate_id", "candidate_version", "lifecycle", "artifact_sha256", "adapter_digest"] as const) {
                if ((row as unknown as Record<string, unknown>)[key] !== serving[key]) return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    // Admissions are append-only; triggers update counters atomically.
    async reserve(request_id: string, sampled: boolean, sample_percent: number): Promise<boolean> {
        if (!this.active_window_id || !await this.canSchedule(this.active_window_id, sample_percent))
            return false;
        const id = await shadowObservationIdV1(request_id);
        const result = await this.db.prepare(`INSERT OR IGNORE INTO interpretation_shadow_admissions(observation_id,window_id,sampled) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM interpretation_shadow_windows WHERE window_id=? AND state='OPEN' AND sample_percent=?)`).bind(id, this.active_window_id, sampled ? 1 : 0, this.active_window_id, sample_percent).run();
        return result.meta.changes > 0;
    }
    async append(value: ShadowInterpretationEvidenceV1): Promise<void> {
        if (!this.active_window_id)
            throw new Error("ACTIVE_SHADOW_WINDOW_REQUIRED");
        const safe = validateEvidence(value), id = await shadowObservationIdV1(safe.correlation_id);
        // Caller-selected IDs and request-content hashes are not retained.
        const metadata = { ...safe, correlation_id: id, request_digest: `sha256:${id}` };
        await this.db.prepare(`INSERT INTO interpretation_shadow_observations(observation_id,window_id,candidate_id,artifact_sha256,policy_version,observed_at,observation_json) VALUES(?,?,?,?,1,?,?)`).bind(id, this.active_window_id, safe.candidate_identity.candidate_id, safe.candidate_identity.artifact_sha256, safe.observed_at, JSON.stringify(metadata)).run();
    }
    async close(window_id: string, ended_at: string): Promise<ShadowObservationWindowV1> {
        const { row, observations } = await this.snapshot(window_id);
        if (!row || row.state !== "OPEN")
            throw new Error("SHADOW_WINDOW_NOT_OPEN");
        if (!timestamp(ended_at) || ended_at < row.started_at || observations.some(v => v.observation.observed_at > ended_at))
            throw new Error("INVALID_SHADOW_CLOSE_TIME");
        const frozen = replayInterpretationStudentShadowWindowV1({ window_id, started_at: row.started_at, ended_at, total_authoritative_eligible_requests: row.total_eligible, sampled_requests: row.sampled, observations });
        // Every admission and append increments revision. A racing writer cannot be omitted.
        const result = await this.db.prepare(`UPDATE interpretation_shadow_windows SET state='CLOSED',ended_at=?,frozen_result_json=? WHERE window_id=? AND state='OPEN' AND revision=?`).bind(ended_at, JSON.stringify(frozen), window_id, row.revision).run();
        if (!result.meta.changes)
            throw new Error("SHADOW_WINDOW_CLOSE_CONFLICT");
        return frozen;
    }
}
