# STEP 13B — Independent public semantic verification and Teacher exposure

State: **SEMANTIC_EXPOSURE_POLICY_OFFLINE_QUALIFIED**.
Scope: **ANONYMOUS_VISION_PUBLIC_PRODUCT_QUESTION_V1**.
Boundary: **CONVERSATIONAL_SURFACE_ONLY**. Lifecycle remains SHADOW.
Teacher remains MOCK_ONLY; real Teacher DISABLED. No production release authority.

## Repository evidence and files

Before implementation, Git status showed the seven untracked foundation files
(contracts, supervision, teacher, evidence, foundation tests, documentation, runner)
and unrelated pre-existing changes. The unchanged Node runner passed **88/88** tests.
Current Git HEAD was `a0fab8b`; the project-memory snapshot is older and is not
evidence of the current implementation. Existing public routes already had local
changes; this step does not modify them or any other pre-existing file.

Four new files only:

- `hybrid.public.semantic.exposure.v1.ts`: admission, minimized request construction,
  deterministic renderer, independent verification and foundation callback adapters.
- `../__tests__/hybrid.public.semantic.exposure.v1.test.ts`: new independent cases.
- `../../../vitest.semantic.exposure.offline.config.mts`: Node runner, no Wrangler.
- This document.

## Reused canonical contracts

- `planneragent.public.capabilities.v1.ts`: sole runtime source for public facts,
  tier names/availability/execution possibility, domains, data categories, VISION
  restrictions, registration/data introduction and limitations. Its existing
  dependencies are industrial capabilities, offers and execution eligibility;
  those modules remain unchanged. Execution possibility never grants authority.
- `conversational.cognition.contracts.v1.ts`: sealed interpretation request,
  closed product-focus taxonomy, parser and non-authority invariants.
- `cognitive.realization.envelope.v1.ts`: realization envelope parser.
- `planneragent.voice.profile.v1.ts`: existing public voice.
- STEP 13A contracts/digests/snapshots, exposure and verifier callbacks, mock
  provider, quota double, evidence registry and SHADOW orchestration.
- Founder FAQ v4.1 and public conversation policy were read for boundary alignment;
  no new capability is inferred from doctrine or generated Teacher text.

## Admission and exposure

Admission recognizes exactly ten reviewed questions: five public topics in English
and Italian (capabilities, authority levels, domains, limitations, getting started).
There is no trimming, normalization, substring match, confidence threshold or
Student-dependent admission. This is a closed public input language, not a
general natural-language classifier or a detector of every possible secret.

Anything else is DENY, including plausible paraphrases, missing context, operational
requests, appended data, hidden characters and injection. This deliberately
restricts coverage to establish exposure safety without guessing. A public caller
must never select or attest the policy callbacks.

Interpretation exposes only the exact admitted public question plus the existing
sealed contract. Realization is rebuilt from the admitted topic and receives only
that topic token, required public canonical meaning, existing public voice and
output contract. It receives neither the original message nor Student interpretation.
The exposure adapter independently reconstructs and compares the entire request:
extra fields, modified metadata, forged meaning and wrong request digests deny.

ERP/MES/robot/I-ORS records, documents, organization data/identity/privileges,
credentials, protected information, histories, out-of-scope evidence and unknown
fields have no permitted payload slot. They cannot be appended to an admitted
question or governed meaning. Request and candidate digests bind verification;
the evidence reference includes the canonical public projection digest.

## Semantic decisions and actual guarantees

PASS for Interpretation requires the exact independently selected focus, clear
PRODUCT_QUESTION and every existing non-authority invariant. Schema-valid wrong
focus or missing required focus is FAIL. Malformed contracts are FAIL.

PASS for Realization requires equality to a complete deterministic rendering of
the host's canonical meaning. That rendering is labeled public facts with canonical
JSON values, rather than newly generated prose. Every topic retains VISION
observation-only/execution-false and all public limitations. Topic-specific facts
are copied in full. Tier execution possibility is explicitly not present authority.
No omitted negation, substituted tier, invented capability, added company claim,
internal mechanism claim or missing mandatory value can pass exact equality.

This is verification of membership in a closed canonical rendering language, not
general semantic verification by keyword, regex, schema or model confidence.
Every other schema-valid free answer is **INCONCLUSIVE**, including fluent true
paraphrases and mixed true/false claims. The verifier does not pretend it can prove
which individual semantic property a free answer violates. The aggregate semantic,
authority and uncertainty checks remain inconclusive together. No model judges
its own response; the host policy recomputes the canonical content independently.

General semantic equivalence, arbitrary multilingual language, factual accuracy
outside the public projection, hidden meaning in arbitrary text, customer claims,
and qualification of either Student or live Teacher remain **BLOCKED** here.
No independent proof of the business truth of upstream canonical contracts is
claimed. Canonical changes require reviewing and rerunning this offline policy.

The deterministic renderer is available for an offline canonical fallback, but no
public route/fallback or release behavior is wired or changed. Even PASS remains
a SHADOW observation; the existing public baseline is returned unchanged.

## Verification results

Command from `planneragent/core`:

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.semantic.exposure.offline.config.mts
```

**126/126 tests passed**: 38 new tests and all 88 unchanged regressions.
The focused TypeScript check of both new TypeScript files and the runner passed
with `--noEmit --strict --target es2022 --module esnext --moduleResolution bundler
--resolveJsonModule --esModuleInterop --skipLibCheck` (exit 0).
Cases are newly authored synthetic inputs, independent of frozen evaluation data.
Positive cases cover both languages/all five topics, complete canonical facts and
canonical mock Teacher correction. Negative cases cover invented capabilities,
altered tiers/authority, removed negations, appended sensitive data, organization
privileges, injection, masked operational requests, ambiguity, missing information,
schema-valid wrong Student focus, mixed truth and partial facts, forged payloads,
digest mismatch and extra fields.

Integration tests use the actual unchanged STEP 13A supervisor and mock provider:
denied exposure invokes neither provider; Student FAIL and INCONCLUSIVE plus
Teacher FAIL and INCONCLUSIVE produce no `shadow_candidate`; Teacher attempts
are REJECTED; baseline is unchanged. A canonical correction yields only a SHADOW
candidate. Thus FAIL/INCONCLUSIVE never authorize release or verified selection.

Global `git diff --check` reported whitespace already present in the unrelated UI
SVG; this file was not changed. No commit, deployment, real AI/network inference,
RunPod startup, training, dataset edits or SUPERVISED activation was performed.
Operational Cognition, I-ORS, all reality families, Decision Pressure, Authority,
OAG, Executor, Cockpit and UI remain outside this change. Interpretation v0.6 and
Realization v0.4 qualifications remain unchanged.

## Single minimum next step

Independently review the ten admitted public formulations and the closed canonical
rendering contract before considering any expansion of this offline scope.
This status alone authorizes neither real Teacher calls nor production release.
