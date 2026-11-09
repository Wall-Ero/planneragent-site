# STEP 13A — Sovereign Hybrid Conversational Intelligence

State: **HYBRID_CONVERSATIONAL_FOUNDATION_OFFLINE**. Lifecycle: **SHADOW**.
Boundary: **CONVERSATIONAL_SURFACE_ONLY**. Cloudflare provider: **MOCK_ONLY**.

## Canonical scope and unchanged qualifications

The approved direction is Interpretation Student + Realization Student + a governed,
replaceable open-weight Teacher. Only linguistic interpretation and realization are
in scope. Core remains the source of governed meaning. This foundation changes no
Operational Cognition, Universal Brain, acquisition, I-ORS, reality, planning,
feasibility, Decision Pressure, OAG, tier, approval, delegation, executor, cockpit,
UX, dataset, public route or current secondary admission policy.

Interpretation v0.6 retains its existing qualified perimeter. Realization v0.4
remains OFFLINE_QUALIFICATION_FAILED. This step neither inspects nor starts RunPod;
the user-reported STOPPED state is not changed. No deployment, inference request,
training, automatic weight update, promotion or commit is performed.

## Existing components reused

- `conversational.cognition.contracts.v1.ts`: sealed requests, interpretation parser,
  closed taxonomy, requester-content/non-authority invariants and provider identities.
- `cognitive.realization.envelope.v1.ts`: strict realization envelope parser.
- `planneragent.voice.profile.v1.ts`: canonical common Voice profile, unchanged.
- `learning/conversational.training.source.eligibility.v1.ts`: validated source
  decisions, provenance identity, digest and effective-time checks.

The existing remote transport remains untouched. Its PUBLIC exposure/provider
contract does not authorize a new Cloudflare Teacher or arbitrary enterprise
content. The existing euro-denominated sandbox budget does not provide atomic
Workers AI neuron reservations; reusing it would not establish zero-cost safety.

## Offline orchestration

`runOfflineHybridSupervisionV1` accepts the existing Interpretation or Realization
request, a public baseline, opaque request/family labels and an evaluation category.
It snapshots the complete input and never includes the baseline in model input.
An independent, trusted host exposure policy must admit the exact request digest
as PUBLIC_SAFE or SYNTHETIC_FIXTURE before either provider is called. No policy
means no exposure. Labels alone are not privacy verification. No general enterprise
admission policy, secret detector or customer-data authorization is implemented.

The Student is injected through its existing provider descriptor and a bounded
offline proposal callback. Its output must first pass the existing Core parser.
An injected independent policy/review must then provide all four checks:
semantic fidelity, authority boundary, uncertainty preservation and exposure
boundary. Verification is bound to request/candidate digests and an explicit scope,
policy, verifier and evidence reference. Missing, partial, unbound or model-self
verification is inconclusive. A model confidence value never establishes acceptance.
Ambiguous/unsupported interpretation does not become a clear interpretation merely
because its JSON is valid.

If needed, a valid mock Teacher receives the same immutable surface request, purpose,
contract versions, model/revision/configuration, exposure admission, input/output
limits, timeout, escalation reason and reserved attempt number. Teacher output goes
through the same independent checks. A schema-valid or Teacher-produced answer is
not intrinsically correct. Semantic rejection never triggers blind retries; only
provider errors/timeouts can retry, bounded by configuration (maximum two retries)
and a fresh pessimistic reservation for every attempt.

The output always contains the original public baseline, unchanged. Verified
candidates are returned only as `shadow_candidate`, never as a replacement response.
Unresolved interpretation reports clarification required; other unresolved cases
use deterministic fallback. These are offline dispositions, not new public copy or
route behavior. Registry errors/timeouts suppress the shadow candidate and retain
the baseline, with `registry_status: UNAVAILABLE`.

## Semantic verification limitations

There is **no general semantic verifier** in this foundation. Trusted host policy
callbacks are extension points, not proof that such policies already exist.
Tests use hand-authored synthetic fixtures and an exact oracle confined to those
fixtures. They prove gate behavior, immutability, refusal and fallback; they do not
qualify arbitrary natural language, the Teacher, either Student or production use.
Scope/evidence references must be supplied by trusted policy code, never accepted
as attested evidence from an LLM or public caller. Their real-world provenance and
qualification require a separate reviewed implementation.

The independent verifier receives a parsed candidate and the unchanged governed
request. Authority and uncertainty must not be strengthened. No existing audience,
language-selection or uncertainty-presentation policy is invented here. Voice
remains independent of audience, language and locale. No CEO-to-OAG mapping exists
in this module.

## Zero-cost controls and blockers

`inspectLiveTeacherAvailabilityV1()` always reports TEACHER_DISABLED. There is no
live provider, API credential field, Workers AI binding, HTTP adapter, paid fallback
or automatic upgrade. The mock configuration requires the exact Cloudflare model,
revision/configuration labels, explicit offline fixture confirmations of Free plan
and model eligibility, the current UTC day, known daily quota, input bytes/token
limits, output token limit, neuron reservation, timeout and retry limit.

`OfflineMockTeacherQuotaV1` is explicitly a **volatile offline test double**. It
reserves synchronously before the mock callback and never refunds reservations,
including timeout/error or unknown usage. Duplicate reservations, day rollover,
insufficient quota and malformed/overflow usage fail closed. Unknown metering
blocks subsequent reservations. Usage is recorded separately from reserved upper
bounds. Concurrent tests prove only this test double's behavior; they do not prove
distributed production accounting. Live execution is blocked without a reviewed
durable atomic reservation/settlement primitive, account-wide quota isolation,
validated token/neuron bounds and actual account/model entitlement evidence.

Documentation checked on 2026-10-19, without inference or account calls:

- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/):
  Free allocation is 10,000 neurons/day, resetting at 00:00 UTC. Usage beyond the
  allocation requires Paid; some models have additional billing requirements.
  The candidate appears in the model pricing table. This is not account approval.
- [Candidate model](https://developers.cloudflare.com/ai/models/%40cf/qwen/qwen3-30b-a3b-fp8/).
- [Qwen FP8 license](https://huggingface.co/Qwen/Qwen3-30B-A3B-FP8/blob/main/LICENSE):
  Apache 2.0 model license. This does not independently establish Cloudflare output
  reuse rights, privacy terms or training eligibility.

The hosted alias is not an immutable upstream revision. Mock revision labels are
explicit fixtures, not a claim about the deployed Cloudflare weights. Production
capacity, free eligibility for this account and complete hosted-service rights are
unverified. An available free tier is not unlimited production capacity.

## Separate learning evidence

The content-free offline registry stores purpose, digests, model/version identities,
per-family gate results, attempts, measured/reserved usage and dispositions. It
stores no prompt, completion, enterprise document, credential or public baseline.
Rejected Teacher attempts retain Teacher identity as well as verification outcomes.
Its storage is volatile; production durability is not implemented. Source identity
uses `cf/…` for the model alias beginning `@cf/…`, because the existing source
identity contract excludes leading `@`; the Teacher identity retains the exact alias.

States are RUNTIME_ONLY, PENDING_ELIGIBILITY, TRAINING_ELIGIBLE and REJECTED.
Teacher escalation/correction never produces TRAINING_ELIGIBLE automatically.
Frozen evaluation observations are rejected for training. Classification requires
an independent review bound to the observation digest, a valid effective source
eligibility decision, and evidence for all six requirements: provenance, license
and service terms, usage rights, authorized data only, independent semantic
validation and frozen-split separation. Unknown evidence stays pending; denial
rejects. The classifier does not mutate the registry and has no TRAIN exporter.
Customer training rights must have an explicit authorization basis; neither a
Teacher correction nor a model's permissive weights license supplies that basis.

## Metrics and lifecycle

Interpretation and Realization are summarized separately: totals, escalation demand,
actual mock calls, scoped autonomous verification, family errors, critical violations,
fallbacks/clarifications, reserved/measured mock quota and unknown consumption.
Independent audits join on observation and candidate digests, expose late gate
failures and report independent/new case results. Missing audit results are not
quality passes. Live quota is explicitly not measured. A reduced escalation rate
never creates a quality conclusion or promotion recommendation.

SHADOW → SUPERVISED → MATURING → SOVEREIGN describes future formally qualified
states only. `assessHybridLifecycleV1` keeps SHADOW, disables live Teacher use and
blocks every transition in STEP 13A. No promotion threshold is invented or copied
from the separately qualified Interpretation shadow policy. Regressions require
disabling the Teacher/returning to SHADOW; no autonomous state transition or live
activation path is added. SOVEREIGN would mean autonomy within qualified scope.

## Offline verification

From `planneragent/core`:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.hybrid.offline.config.mts
```

The dedicated Node configuration does not load Wrangler or Workers bindings. It
includes the foundation suite and existing cognition, source eligibility and persona
contract suites. No frozen evaluation data is used to author its synthetic fixtures.

Minimum next step: specify and review one independently verifiable conversational
semantic scope and its exposure policy offline, including explicit inconclusive
conditions. This does not authorize inference, datasets, training, promotion or deployment.
