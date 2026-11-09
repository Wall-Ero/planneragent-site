# STEP 13D — Governed natural conversation, first offline vertical

State: **GOVERNED_NATURAL_CONVERSATION_VERTICAL_OFFLINE**.
Scope: **ANONYMOUS_VISION_GENERAL_CAPABILITIES_EN_V1**.
Boundary: **CONVERSATIONAL_SURFACE_ONLY**. Lifecycle: **SHADOW**.
Teacher: **MOCK_ONLY**, live **DISABLED**. No public release authority.

## Change inventory and baseline

Five new files; no pre-existing source, configuration or documentation was edited:

- `hybrid.natural.capabilities.v1.ts`: bounded compositional admission grammar,
  source-derived answer plan, source-bound English wording, presentation renderer,
  independent host verifier and separate Teacher exposure admission.
- `hybrid.natural.capabilities.offline.v1.ts`: small adapter that composes the
  existing STEP 13A supervisor for Interpretation and Realization observations.
- `../__tests__/hybrid.natural.capabilities.v1.test.ts`: dedicated offline cases.
- `../../../vitest.natural.capabilities.offline.config.mts`: extends the unchanged
  STEP 13B Node runner, retaining all 126 previous tests.
- This report.

Initial Git HEAD: `a0fab8b`. The working tree already contained 13 modified tracked
files and unrelated untracked work, including the seven foundation and four STEP
13B files. Those files were preserved. The tracked diff summary remained 13 files,
299 insertions and 122 deletions. No automatic commit was made.

## Reuse and ownership

The only factual source is `createPlannerAgentPublicCapabilityProjectionV1()`.
The selected public facts are its purpose and planning domains. VISION restrictions
and all three limitations are mandatory. No data categories, connector availability,
customer observations or additional authority promises are inferred.

Existing components reused unchanged:

- Interpretation taxonomy, sealed requests, parser, non-authority invariants and
  `ConversationalInterpretationProviderV1`.
- `StudentConversationalInterpretationAdapterV1`, exercised with an in-memory
  mock transport in tests. Its v0.6 model identity is retained; the test wrapper
  explicitly identifies the deployment as OFFLINE_FIXTURE. No weights run and no
  extension of the v0.6 qualification is claimed.
- Voice profile, semantic invariants and natural/professional quality guidance.
- Realization envelope parser.
- STEP 13A supervisor, immutable snapshots, canonical digests, mock Teacher, quota
  test double and content-free evidence registry.
- STEP 13B runner and all ten historical admitted formulations as regressions.

`explainability/canonicalExplanation.ts` was inspected. It requires tenant/company
identity and canonical operational reality, with optional Decision Pressure and
operational claims. It is therefore inappropriate for this anonymous product
question. No fabricated operational explanation basis or audience role is created.
The public answer plan remains in the existing conversational cognition family.

## Three separate decisions

1. The host fully parses a bounded English grammar before invoking any provider.
   It handles question/imperative forms, polite wrappers, controlled synonyms,
   singular/plural capability wording, case/space/punctuation variations and
   specific small grammatical variations. This is composition of productions,
   not enumeration of complete questions. It is not unrestricted understanding.
2. The existing Interpretation Student proposes its taxonomy/focus in SHADOW.
   The host independently compares it with the admitted general-capabilities
   meaning. A wrong focus is recorded as FAIL and cannot change that meaning.
3. Teacher exposure has its own callback. It denies every Interpretation request
   and admits only the exact host-built Realization request, with a matching
   digest. The original wording and Student classification never reach Teacher.

Every grammar token must be consumed; unknown tokens, additional clauses, digits,
control characters, non-ASCII text, mixed questions and strings longer than 160
characters are denied. The lexical checks are grammar restrictions, not a claim
that regex can solve general semantic classification or detect every secret.
No arbitrary slots for organizations, names, credentials or operational records
exist. Out-of-grammar requests get a deterministic offline clarification:

> Please ask a general question about PlannerAgent's capabilities without operational or protected information.

The offline wrapper accepts only fixtures for both Students. This deployment label
is a trusted-host assertion, not a network sandbox. Tests replace global fetch with
a throwing stub and inject only an in-memory adapter transport; no real inference
or network provider is configured. Future callers must not substitute live callbacks.

## One canonical answer plan

Equivalent admitted inputs use the same plan; neither wording nor Student output
is part of it. Its structure distinguishes:

- `allowed_facts`: current public purpose and supported planning domains.
- `mandatory_elements`: PURPOSE, DOMAINS, VISION, ANONYMOUS_BOUNDARY,
  EVIDENCE_LIMIT and CAPABILITY_BOUNDARY. Each binds a source path/value to its
  complete deterministic English sentence.
- `qualifications_and_limits`: all existing public limitations.
- `binding_negations`: VISION cannot execute, anonymous restrictions and the
  operational-evidence condition.
- `forbidden_capability_claims`: VISION execution and claims outside the public
  projection, derived from those same source restrictions.
- `provenance`: projection source/version/digest and wording version.
- Existing Voice plus explicit `grants_authority:false`, `grants_execution:false`.

The fixed source values beside the wording rules are compatibility assertions,
not alternative facts. Facts are loaded from the current public projection; a
changed selected value or additional limitation blocks rendering for wording
review. Plan tampering is rejected by full reconstruction/equality. A source
change must not silently turn old prose into an authorized new product promise.

The English wording is authored here against existing approved public content;
this does not attest a separate founder or external reviewer approval of the new
sentences. The next review can inspect each source-to-sentence mapping directly.

## Actual deterministic English output

The following inputs are exercised independently and yield the same plan and text:

- `What can PlannerAgent do?`
- `What capabilities does PlannerAgent offer?`
- `Could you please describe the capabilities of PlannerAgent?`
- `What capability do PlannerAgent have?`
- `What are PlannerAgent's capabilities?`

Observed plan digest for the current source snapshot:
`sha256:61255260d86d564bcd05e1dfecd9d4e03fef64ebf3b4768fc0fdf15dd720fa45`.
Both presentation styles bind this same plan; the digest is host evidence only.

Default PARAGRAPHS output:

> PlannerAgent provides operational planning support, helping people understand plans, operational reality and the boundaries for governed action. It supports supply chain, production, logistics, finance and general planning.
>
> VISION is observation-only and cannot execute actions. In this anonymous conversation, you cannot introduce data, access organizations, monitor participants or execute actions.
>
> No claim about your own operations is made until appropriate data has been admitted. No capabilities beyond the public product information are claimed.

Controlled BULLETS output:

- PlannerAgent provides operational planning support, helping people understand plans, operational reality and the boundaries for governed action.
- It supports supply chain, production, logistics, finance and general planning.
- VISION is observation-only and cannot execute actions.
- In this anonymous conversation, you cannot introduce data, access organizations, monitor participants or execute actions.
- No claim about your own operations is made until appropriate data has been admitted.
- No capabilities beyond the public product information are claimed.

Both presentations retain all six sentences in the same order. Only paragraph or
bullet layout changes. No optional omission of a limitation exists. JSON, claim
IDs, contract names, digests, provider identity and span evidence are not placed in
the answer text. Plan digests and source/span coverage are separate host evidence.

## What PASS proves and what remains blocked

The host renderer verifies the full plan against the current source-bound plan.
Its output contains complete authored sentences. The host verifier reconstructs
the plan and compares the entire parsed answer with either permitted rendering.
Coverage spans link the exact sentences back to their source paths; IDs or schema
alone are insufficient. Tests use an independently written full expected answer,
check current source values and exercise altered/omitted/added claims.

PASS establishes membership in these source-bound controlled English renderings.
It does not establish general semantic equivalence or independently prove business
truth/implementation maturity of upstream public facts. Paragraph/bullet variants
and parser trimming do not authorize new wording. An independent reviewer must
still judge the source-to-English mapping itself; the host does not consult an LLM.

All other well-formed free answers remain INCONCLUSIVE, including plausible true
prose, false execution claims, missing qualifications and text listing valid claim
IDs while changing their meaning. Invalid contracts FAIL. Neither outcome selects
a verified shadow candidate or replaces the public baseline.

## Shadow observation and unchanged public behavior

The wrapper calls the unchanged 13A supervisor twice: first for the offline
Interpretation fixture, then for Realization Student and optional mock Teacher.
Realization receives a canonical public question and the answer plan only.
Interpretation has no Teacher dependency. Teacher remains governed by existing
quota/configuration checks and the separate exposure callback.

The existing registry records Student/Teacher checks, candidate digests, source
identity, attempts and dispositions. It deliberately stores no rejected answer
plaintext. This permits result comparison and binding, but is not a plaintext
corpus for later semantic review. No new evidence store, dataset or curriculum
export is created. Escalations remain pending eligibility and never automatically
become TRAINING_ELIGIBLE.

`offline_answer` is the host renderer's preview. `public_response` and the public
responses inside both supervisor results remain byte-for-byte baseline values.
Even a model that reproduces the exact controlled rendering can obtain only a
SHADOW candidate. No route imports or serves this new wrapper.

## Public-content freshness review

The repository FAQ v4.1 calls PlannerAgent an authority layer and describes broader
observation, governance, advisory and approved/delegated execution, including
deterministic VISION simulations. The current public projection has a narrower
planning-support purpose and a small fact set. This is a coverage gap between
doctrine and the projection, not proof that the projection's claims are false.
This vertical neither expands those claims nor imports the broader roadmap prose.

The project-memory CURRENT_STATE snapshot still reports July HEAD `04dabca`,
whereas current Git HEAD is `a0fab8b`. Searches of project-memory/docs filenames
did not identify a separate current authoritative roadmap. Consequently current
roadmap completeness/freshness is NOT VERIFIED; no public fact is declared obsolete
without evidence, and no doctrine/projection correction is made automatically.

The projection's supported domains are product statements, not proof that every
integration is deployed or anonymously accessible. This renderer adds no connector,
deployment, runtime-readiness or customer-specific guarantee. Qualification of
Realization v0.4 remains NON QUALIFIED; Interpretation v0.6 keeps its own perimeter.

## Validation

From `planneragent/core`:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.natural.capabilities.offline.config.mts
```

183/183 tests passed: 57 new tests plus all 126 historical regressions. The new
suite includes fourteen input formulations, 18 additional grammar combinations,
protected/mixed/out-of-scope/continuity denial, source/plan tampering, separate
Teacher exposure, independent expected prose, both presentations, source drift,
wrong Student focus, false/plausible free answers, content-free observations,
unchanged public baseline, no automatic learning eligibility and live descriptor
rejection. Fetch is blocked globally for this suite; adapter transport is mocked.

Focused TypeScript check passes with `--noEmit --strict --allowImportingTsExtensions
--target es2022 --module esnext --moduleResolution bundler --resolveJsonModule
--esModuleInterop --skipLibCheck` for both new modules, tests and runner.

No ERP, MES, robot, I-ORS, reality family, Universal Cognition, Decision Pressure,
Authority tier, OAG, Executor, Ledger, Cockpit, UI or public route was modified.
No real AI, deployment, training, GPU, RunPod, frozen dataset change, automatic
commit, curriculum transfer or SUPERVISED activation occurred.

## Single executable next step

Independently review the six source-to-English mappings and the bounded admission
grammar offline before authorizing any expansion or public wiring.
