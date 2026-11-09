# STEP 13L-R - hosted input uncertainty admission

Status: `CLOUDFLARE_ONE_SHOT_RISK_ADMISSION_PREPARED_GATE_CLOSED`.
This STEP prepares a risk boundary; it grants neither hosted-risk acceptance nor
permission to infer. Production `LIVE_NETWORK_ENABLED_V1` remains false.

## Minimum correction

13L required `NATIVE_INPUT_TOKEN_BOUND_QUALIFIED_V1` to be true before credential
entry. That required unavailable hosted-tokenizer/template evidence. 13L-R
replaces that admission check with verified local bounds plus a separate,
digest-bound operator acknowledgment. The old qualification constant remains
false as descriptive evidence only. It is no longer an execution permission.

`validateNativeAuthorizationV1` now requires both the unchanged exact experiment
authorization and a distinct `hosted_input_uncertainty_acknowledgment` field.
Missing, malformed, undigested or mismatched hosted acknowledgment is denied
before credential entry, journal mutation or network I/O. Neuron acceptance
cannot satisfy this field. The future CLI asks for this acknowledgment separately
before asking for the existing one-POST confirmation; its closed source gate
currently prevents all such prompts. `--inspect` only presents requirements and
reports `hosted_input_acknowledgment_collected: false`.

## Local input evidence and remaining uncertainty

The reused frozen-payload inspector verifies the canonical artifact SHA-256 and
equality to the canonical serializer before returning its wire bytes. Local
admission additionally checks exact model/path/method, fixed body/prompt lengths,
16 KiB body ceiling, nonstreaming mode and exactly 512 requested output tokens.
Native transport still requires the exact fixed account endpoint, frozen body and
allowed headers. An acknowledgment cannot relax these checks.

| Evidence | Result |
| --- | --- |
| Local classification | `LOCAL_INPUT_BYTES_VERIFIED` |
| Frozen UTF-8 REST body | 2,094 bytes; maximum 16,384 bytes |
| Decoded prompt | 1,762 UTF-8 bytes |
| Frozen canonical artifact SHA-256 | `74dce8541223ec4723953eeeb990970be3c4c6b70e372d4e3436c61ff1ac2764` |
| Raw wire-body UTF-8 SHA-256 | `8b0e30d724da4959bddb3404b099d14f8d0b72d06e2633622cf12049783e563d` |
| `LOCAL_TOKEN_ESTIMATE` | NOT_CLAIMED; no tokenizer estimate computed |
| Hosted input count | `HOSTED_INPUT_TOKEN_COUNT_UNKNOWN` |
| Hosted template overhead | `HOSTED_TEMPLATE_OVERHEAD_UNKNOWN` |
| Possible hosted schema expansion | UNKNOWN |
| Hosted tokenizer parity / qualification | UNVERIFIED / false |

The two SHA-256 values hash different objects; neither is a token count. No
numerical hosted-template allowance is invented. The prior 13L upstream-only
observations are historical, not hosted-token qualification or current estimates.

The supplied baseline documents Cloudflare's estimated-input-token validation
and the selected model's 32,768-token context limit. These are provider-side
safeguards, not local measurements, compatibility guarantees or exact token
counts. This STEP uses that supplied evidence without external requests or a
provider probe. Provider rejection is an accepted possible outcome only after
the separate acknowledgment is actually granted for this experiment.

## Exact approvals still required (none granted by this STEP)

Current nonsecret challenge digest from guarded `--inspect`:
`sha256:4b95090d212d3916002d91ac8ee5c05c2a3dd44907079027f103d42f11cc3034`.
It binds account `efd250d57d6fad4a3c4ca458fc20c550`, model
`@cf/qwen/qwen3-30b-a3b-fp8`, frozen payload digest, experiment
`teacher-realization-live-experiment-v1`, fixed module-relative `live-state/`,
dedicated token identity `planneragent-teacher-oneshot`, limits, SHADOW lifecycle,
CONVERSATIONAL_SURFACE_ONLY, direct REST route and both separate risk policies.
Use freshly inspected requirements if any bound identity changes.

Before any future live dispatch, the operator must separately provide:

1. Explicit approval of a reviewed source-gate change for this challenge:
   `APPROVE REVIEWED SOURCE GATE OPENING <challenge digest>`.
2. Explicit hosted-risk acknowledgment:
   `HOSTED_INPUT_TOKEN_UNCERTAINTY_ACCEPTED_FOR_ONE_EXPERIMENT <challenge digest>`.
3. Explicit one-POST authorization:
   `AUTHORIZE ONE POST <challenge digest>`.

The already supplied `USAGE_UNKNOWN_ACCEPTED_FOR_ONE_EXPERIMENT` concerns Neurons
only. Workers Free, no payment method/Paid upgrade, no Gateway/prepaid route,
dedicated account-scoped token validity and an unclaimed fixed journal remain
mandatory operator checks. Token name is an attestation, not proof that an unread
token has the correct permissions. The existing conservative 2026-10-29 00:00 UTC
expiry cutoff remains unchanged. No credential is read in this STEP.

The authorization validator requires the exact canonical challenge, including
the hosted-risk policy. The persistent journal binds that manifest digest and
commits exclusive synced reservation/dispatch markers before network I/O. Its
implementation and fixed location are unchanged. Input-length, compatibility,
quota and JSON Schema rejection all terminate the consumed attempt. No retry,
fallback, model change, payload change, automatic reset or public publication is
allowed. Realization verification remains separate from HTTP success. Actual
Neurons remain UNKNOWN. Student, Lightning, training, operational cognition and
general Teacher budget/governance are untouched.

## Files changed

Under `core/qualification/teacher-one-shot/`:

- `live.contracts.ts`: required risk policy in the fixed manifest; truthful blockers.
- `live.authorization.ts`: local proof, separate risk-ack validation and inspection.
- `live.transport.ts`: local-bound check in place of hosted-qualification gate.
- `live.http.ts`: same correction for direct native-client calls.
- `live.native.cli.ts`: future separate acknowledgment prompt behind closed gate.
- `FIRST_LIVE_ADMISSION.md`: historical supersession notice.
- `HOSTED_INPUT_RISK_ADMISSION.md`: this record.

Under `core/src/conversation/__tests__/`:

- `cloudflare.teacher.native.readiness.offline.v1.test.ts`: remove fake tokenizer
  qualification, use synthetic risk acknowledgments, test missing/wrong/cross-risk
  acceptance, immutable local bounds and permanent provider-error consumption.
- `cloudflare.teacher.network.containment.offline.v1.test.ts`: use synthetic risk
  acknowledgment in the missing-mock containment probe; keep qualification false.

The payload, serializer, journal, parser, Realization verifier, network-denial
preload/setup and offline runner config are reused unchanged. No dependency was
installed and no commit was created; existing working-tree changes are preserved.

## Offline verification

All tests run with immutable network denial before Vitest startup, inherited by
Node subprocesses and checked after tests. Missing/misconfigured HTTPS mocks are
stopped locally at TLS/socket connection; swallowed attempts still fail tests.
Only explicitly expected negative denial probes acknowledge their exact denial
sequence. No external HTTP/HTTPS/DNS request is sent by these probes.

```powershell
node --require ./qualification/teacher-one-shot/offline.network-deny.cjs node_modules/vitest/vitest.mjs run --config vitest.teacher.native.readiness.offline.config.mts
```

The real `--inspect` command was run under the same denial preload: dispatch
false, Teacher DISABLED/SHADOW, local bytes verified, hosted count/overhead UNKNOWN,
no estimate/qualification claimed, hosted acknowledgment uncollected. Production
`live-state/` is absent. No `--execute` command, actual token access, credential
prompt, external documentation lookup, AI call, deployment or billing change
was performed in STEP 13L-R.

Final regression result: **419/419 PASS across 11 files**, retaining the prior
397 tests and adding 22 risk-admission/local-bound/rejection cases. The targeted
TypeScript check has no one-shot-file diagnostics, but still exits nonzero on the
same three pre-existing learning-file errors recorded in 13K/13L. Those files
were not changed. No unexpected network-denial events occurred in passing tests;
deliberate negative probes were denied before external I/O.
