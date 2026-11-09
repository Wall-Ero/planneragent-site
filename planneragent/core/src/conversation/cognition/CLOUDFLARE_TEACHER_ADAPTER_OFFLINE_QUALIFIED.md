# STEP 13F — Cloudflare Teacher adapter, offline qualification

State: **CLOUDFLARE_TEACHER_ADAPTER_OFFLINE_QUALIFIED**.
Boundary: **CONVERSATIONAL_SURFACE_ONLY**. Lifecycle: **SHADOW**.
Exact model: `@cf/qwen/qwen3-30b-a3b-fp8`.
Transport: **IN_MEMORY_ONLY**. Provider contract: **MOCK_ONLY**.
Live Teacher: **TEACHER_DISABLED**. No real inference, training or release authority.

## Inventory

New files:

- `cloudflare.teacher.rest.offline.v1.ts`: REST serializer/parser, bounded mock
  transport, cancellation and permanent live-disable inspection.
- `../__tests__/cloudflare.teacher.rest.offline.v1.test.ts`: independent synthetic
  transport/error/accounting/integration fixtures, with global fetch blocked.
- `../../../vitest.cloudflare.teacher.offline.config.mts`: Node runner extending
  the unchanged 13D runner and all historical regressions.
- This report.

Four minimal changes to existing foundation components:

- `hybrid.conversational.contracts.v1.ts`: sanitized typed provider error carrying
  retryability, unknown-consumption status and optional known fixture usage;
  optional sanitized attempt failure code.
- `hybrid.conversational.teacher.v1.ts`: invalidate the existing mock accounting
  state and deny settlement of in-flight work after accounting becomes invalid.
- `hybrid.conversational.supervision.v1.ts`: stop nonrecoverable retries, record
  safe failure codes, settle known usage even when output is malformed, and
  quarantine unknown usage through the existing quota test double.
- `../learning/hybrid.conversational.evidence.v1.ts`: accept/validate the optional
  safe failure code in the existing content-free attempt record.

No second provider registry, routing layer, budget, database schema or evidence
store is introduced. Unknown errors from previous providers retain the foundation's
existing bounded behavior. New adapter errors carry explicit retry policy.

## Repository and architectural inspection

Git HEAD was `a0fab8b`; the working tree was already dirty. Existing modified
routes, transport mediator, worker configuration, UI and unrelated untracked work
were preserved. The earlier 13E-FIX wording remains unchanged.

The Edge gateway exposes assets/public entry points and delegates requests through
its `CORE` service binding. Core contains the existing conversational adapters and
the `POLICIES_DB` D1 binding. Neither worker configuration has an AI binding.
Provider transport therefore belongs beside the existing Core conversational
adapters; no Edge code, public route or Worker binding is changed or activated.

Existing HTTP adapters and `CognitiveTransportMediatorV1` were inspected. Their
provider enum, exposure seals and credentials do not authorize a new Cloudflare
Teacher. The mediator cannot be reused as an unqualified bypass. This adapter
instead implements the already existing `HybridTeacherProviderV1` injection point.

Current secret handling uses Worker secrets for existing providers. No dev.vars,
environment secret, Cloudflare token, account ID, AI Gateway setting or live toggle
is added or read. No request has an Authorization header or actual destination URL.

Existing budget/accounting inspected:

- `sandbox/budget.ts`: monthly EUR checks and later accounting writes, including
  paying-tier behavior; not an account-wide atomic daily Neuron reservation.
- `sandbox/llm/usageLedger.ts` and its SQL: token/EUR usage logging, not a distributed
  Workers AI free-allocation control.
- STEP 13A `OfflineMockTeacherQuotaV1`: synchronous pessimistic reservations,
  no refunds, duplicate/day/budget checks; explicitly volatile and nonproduction.

Reinterpreting the EUR budget or its separate read/write checks as a zero-cost
Neuron guarantee would be false. No new durable accounting primitive is fabricated.

## Cloudflare surface and documentary evidence

Documentation was read on 2026-10-20. Only documentation GETs were made; no account
endpoint, Playground, model endpoint, Wrangler session or inference API was used.

- [Model](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/)
- [Synchronous input schema](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/sync-input.json)
- [Synchronous output schema](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/sync-output.json)
- [REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
- [Workers binding](https://developers.cloudflare.com/workers-ai/get-started/workers-wrangler/)
- [JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Errors](https://developers.cloudflare.com/workers-ai/platform/errors/)

Only synchronous native REST mapping is implemented. It follows the model's raw
input schema (`prompt`, structured response format, nonstreaming generation and
explicit output-token maximum). The result parser expects the documented chat
completion shape inside the REST result envelope. It does not silently fall back
to another model's legacy `result.response` shape. No OpenAI-compatible endpoint,
streaming, function calling, batch mode or Workers AI binding is also configured.

The mock stores method, path TEMPLATE and body; `{ACCOUNT_ID}` is never resolved.
The transport constructor accepts only immutable in-memory response fixtures and
optional synthetic delay/metering. It has no network API, credential or callback
for implementing a network request. The adapter rejects absent/other transport
types; deployment configuration cannot turn it into a live client.

REST was chosen because existing adapters already separate HTTP serialization
from governed admission. Adding a native AI binding would create deployment
capability without providing the missing authorization/accounting guarantees.

Documentary schema compatibility is not proof of actual hosted response behavior
or hosted weight revision. The configured revision remains an offline fixture.

## Scope and payload

The adapter reuses `authorizeNaturalCapabilitiesTeacherExposureV1` and the current
source-derived answer plan. Request contract/model/revision/configuration/limits,
purpose, reserved attempt, surface digest and the complete exposure decision must
match. A PUBLIC_SAFE label alone cannot admit a changed surface.

INTERPRETATION is explicitly denied before transport, including an otherwise
admitted public question. This is deliberate separation of technical provider
capability from the currently authorized Realization scope.

For REALIZATION the wire contains only public Voice guidance and the six governed
statement elements from the qualified natural-answer plan, including the corrected
domain maturity qualification and capability boundary. The original question,
Student label, history, source digests, plan IDs, request ID, quota metadata,
organizational identity, credentials, documents and operational records are not
forwarded. Output must be a strict existing Realization envelope.

Input bytes, output tokens and total response bytes are bounded. Token usage is
checked against the existing limits when a fixture returns it. A real preflight
tokenizer/template bound has NOT been qualified; byte limits do not prove exact
provider token counts. This is another reason live use remains disabled.

## Errors, retries, parsing and observation

The adapter has no retry loop. The existing supervisor owns retry count and must
reserve a fresh pessimistic maximum for every new attempt.

Permanent failures include HTTP 400/401/403, generic 429 without qualified capacity
evidence, Paid-required 5035, daily-free-quota-exhausted 3036, abort, invalid requests,
malformed structured output and unverifiable metering. No billing upgrade, model
fallback or paid route is offered. Capacity 3040, provider timeout 3007 and generic
5xx can retry within the existing offline allowance. Explicit permanent codes take
precedence over a generic 5xx status. An external abort is nonretryable.

Cancellation reaches the mock transport; adapter timer/listeners are cleaned up.
Provider error messages, reasoning content and tool payloads are never recorded as
answers or raw error evidence. Only validated host failure codes enter the existing
registry. Tool calls, multiple choices, truncation, wrong model identity and invalid
Realization envelopes are rejected.

A valid envelope is still only a proposal. The unchanged natural-scope host verifier
judges the whole candidate after parsing. Free plausible and false prose remain
INCONCLUSIVE. Only a complete source-bound controlled rendering can obtain PASS,
and only as a SHADOW candidate; `public_response` remains the original baseline.
No general semantic verifier or new model qualification is claimed.

## Usage and hard zero-cost gate

The documented response provides token counts, not an authoritative per-request
Neuron receipt. The adapter never manufactures live Neurons from tokens, pricing,
missing fields, zero defaults or model-authored output. Tests supply a clearly
separate `offline_neurons` control-plane fixture solely to exercise the existing
mock quota contract. Those values are NOT actual Cloudflare consumption.

Missing/invalid token usage, inconsistent totals, exceeded limits or absent/invalid
synthetic metering produce METERING_INVALID. The existing quota becomes invalid,
future reservations are denied, and still-pending results cannot settle/select a
candidate. Known synthetic usage is settled even if the response text is malformed.
Timeout/error attempts retain pessimistic reservations without refunds. Their
unsettled consumption is reported rather than guessed. These mechanisms qualify
only the shared in-memory test double, not distributed production concurrency.

Live gate remains unconditionally disabled, with these seven explicit conditions:

| Condition | Current evidence |
| --- | --- |
| Account and Workers plan verified | NOT VERIFIED |
| Model free eligibility for this account | NOT VERIFIED |
| Authorized daily budget | Offline fixture only |
| Reliable distributed accounting | NOT IMPLEMENTED |
| Per-request consumption bound | Offline bounds only |
| Known consumption | Live consumption UNKNOWN |
| Qualified exposure | Current Realization scope only; no Interpretation egress |

Cloudflare documents a daily free allocation and billing beyond it on Workers Paid.
An existing Cloudflare account or successful Worker deployment is not evidence of
its Workers AI plan, entitlement or account-wide remaining usage. No billing,
upgrade, prepaid credit or Gateway capability was enabled. The gate has no positive
configuration/environment switch. Zero real Neurons are consumed by this adapter
because it has no live transport path, not because production metering was solved.

## Qualification results

From `planneragent/core`:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.cloudflare.teacher.offline.config.mts --no-cache
```

245/245 tests passed across seven suites: 62 new Cloudflare cases and all 183
previous 13A–13E-FIX regressions. Cases cover serialization, exact model/purpose,
exposure/digest/limits, valid and malformed output, semantic nonverification,
400/401/403/429/5xx, 5035/3036/3040, timeout/abort, bounded/permanent retries,
unknown/inconsistent usage, concurrency, in-flight quarantine, safe error evidence,
no Interpretation egress, SHADOW baseline, learning eligibility and no promotion.

Global fetch is replaced by a throwing stub in the new suite; the only available
transport executes fixture data in memory. No Wrangler was invoked. Actual network
inference, live-account consumption and real provider quality were not tested.

Focused TypeScript verification passed with no emit, strict mode, bundler module
resolution, JSON modules and importing TypeScript config extensions.

## Preserved boundaries and single next step

Operational Cognition, Universal Brain, ERP/MES/robot ingestion, I-ORS, Multi-Source
Reality, Authority tiers, OAG, Executor, Ledger, Cockpit, UI and public routes are
unchanged. Existing Interpretation v0.6 and Realization v0.4 qualification states
are not extended. SHADOW remains fixed; no SUPERVISED transition exists here.

The existing content-free registry is the only learning evidence path. No answer
plaintext corpus or TRAIN exporter is added. Teacher corrections do not become
TRAINING_ELIGIBLE automatically. No training, distillation, weights/dataset changes,
GPU, deployment, billing changes, paid credits or automatic commit occurred.

Minimum next step: independently review an offline specification for atomic
account-wide Neuron reservation/settlement using existing storage primitives.
Live activation remains blocked by the other unverified requirements as well.
