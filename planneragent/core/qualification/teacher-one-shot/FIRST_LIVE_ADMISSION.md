# STEP 13L - first Teacher inference admission (offline)

Historical STEP 13L record. STEP 13L-R supersedes its exact-hosted-bound admission
requirement with the separate, ungranted risk acknowledgment described in
[HOSTED_INPUT_RISK_ADMISSION.md](./HOSTED_INPUT_RISK_ADMISSION.md). The evidence
limitations below remain valid; the hard hosted-qualification gate is no longer
the current admission rule.

Status: **NOT ADMISSION READY - input-token bound unresolved**.
Do not claim `CLOUDFLARE_TEACHER_FIRST_LIVE_ADMISSION_READY`.
No inference is authorized. Production dispatch remains CLOSED. The supplied
decision `USAGE_UNKNOWN_ACCEPTED_FOR_ONE_EXPERIMENT` waives only the remaining
daily Neuron-allocation check for this fixed experiment, not token-bound evidence,
Workers Free, operator authorization, credentials or the one-shot restrictions.

## Token-bound evidence

Read-only documentation research used the
[Cloudflare model reference](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/),
[Cloudflare prompting guide](https://developers.cloudflare.com/workers-ai/features/prompting/),
[Qwen tokenization explanation](https://qwen.readthedocs.io/en/latest/getting_started/concepts.html)
and the publisher's
[Qwen3 tokenizer configuration/template](https://huggingface.co/Qwen/Qwen3-30B-A3B-FP8/blob/main/tokenizer_config.json).
No API inference endpoint, credential, dependency install or model invocation was
used for this research. No compatible tokenizer package was identified among the
installed Node dependencies inspected. The full tokenizer data was not loaded.

Cloudflare specifies a 32,768-token context and defaults `raw` to false, applying
a chat template. The frozen payload omits `raw`. Its JSON serialization is still
2,094 UTF-8 bytes, with decoded prompt **1,762 bytes**, JSON-schema serialization
192 bytes and requested output at most 512 tokens. REST JSON bytes are not an
exact token count or the provider's rendered model input.

Qwen describes UTF-8 byte-level BPE: starting from bytes and merging cannot
increase token count. Conditional on compatible byte-level preprocessing without
expansion, this gives a conservative content-only bound of 1,762 tokens; it does
not establish the deployed tokenizer revision or provider additions.

For the publisher's upstream single-user, no-tools template, the wrapper is 50
UTF-8 bytes; disabling thinking appends another 19 bytes. These are separately
accounted upstream overhead, not measured Cloudflare overhead and not exact token
counts. Under the same byte-BPE assumptions, the upstream-only prompt plus these
wrappers is bounded by 1,831 tokens. Reserving 512 output tokens leaves 30,425
tokens of context headroom for other additions, but headroom is not proof that
the provider's additions fit. Do not treat an arbitrary overhead allowance as
qualification.

**Exact unresolved limitation:** reviewed Cloudflare documentation does not pin
its deployed tokenizer/template revision or bound default system/template,
reasoning-prefix and potential `response_format` schema-to-prompt expansion for
this exact native `prompt` request. The publisher's template cannot establish
Cloudflare parity. The complete rendered-input upper bound therefore remains
UNRESOLVED; exact prompt tokens, provider template overhead and provider schema
overhead remain UNKNOWN. No documented numeric provider-overhead allowance was
found to substitute for this evidence. The frozen payload/model were not changed.

`NATIVE_INPUT_TOKEN_BOUND_QUALIFIED_V1` remains false. The native runner, direct
native client and CLI preflight reject it before credential entry or network
dispatch, even if a future change opens the independent dispatch flag. Qualifying
it requires authoritative deployed-tokenizer/template parity or an authoritative
complete overhead bound sufficient for input plus 512 output tokens <= 32,768.
No live token-count request is permitted as a workaround in this STEP.

## Experiment-specific UNKNOWN policy

`ONE_EXPERIMENT_USAGE_POLICY_V1` is embedded only in the native experiment manifest:

- Experiment `teacher-realization-live-experiment-v1`, account
  `efd250d57d6fad4a3c4ca458fc20c550`, model `@cf/qwen/qwen3-30b-a3b-fp8`.
- Frozen digest `sha256:74dce8541223ec4723953eeeb990970be3c4c6b70e372d4e3436c61ff1ac2764`.
- UNKNOWN daily allocation is explicitly accepted by the operator for this one
  experiment. Actual Neurons remain UNKNOWN; tokens/pricing do not establish them.
- Workers Free required; payment method and Paid upgrade forbidden; direct
  Workers AI only, no AI Gateway or prepaid route.
- One POST, no retry/fallback; quota errors permanently consume the attempt.

Exact canonical authorization rejects any weakened/missing policy or mismatched
account/model/digest/experiment/path/token identity. The persistent journal binds
the entire manifest, including policy, in its digest before network I/O. A quota
failure stores the private terminal receipt and a reconstructed runner cannot
send again. General Teacher budgets/governance, D1 and operational cognition are
unchanged. The token name is bound as an operator attestation; no actual token
value, permissions or expiry were inspected in this STEP.

## Controlled future opening and remaining admission requirements

The existing source gate is retained; no environment switch, argument, token
presence, test result or inspection command opens it. `--inspect` now presents a
nonsecret request `APPROVE REVIEWED SOURCE GATE OPENING <challenge digest>`.
This is a request template, not a grant, and this STEP does not submit or approve it.

After token-bound qualification, a separate explicit operator decision must
authorize a reviewed source-gate change for this exact challenge. The future CLI
must still obtain the existing interactive `AUTHORIZE ONE POST <challenge digest>`
confirmation and hidden entry of the dedicated `planneragent-teacher-oneshot`
token. That interactive confirmation and the exclusive, fsynced fixed-location
journal make the attempt single-use. No additional authorization store, runtime
toggle, orchestration or accounting system is introduced.

Before that future opening: establish the full token bound; refresh the challenge
if bound identity changes; verify Workers Free/no payment method/no upgrade and
direct route; verify the dedicated token's account/permissions/validity externally;
confirm the same fixed `live-state/` is unclaimed. The current token is rejected
starting 2026-10-29 00:00 UTC conservatively. Never reset consumed/uncertain state.
Hosted response compatibility remains a first-experiment observation; the existing
parser/verifier fail closed. HTTP success does not establish Realization fidelity
or linguistic approval. No public response, Student use or training is enabled.

The next operational step is to obtain the missing authoritative offline token/
overhead evidence. Once qualified, request the separate digest-bound source-gate
opening authorization above; do not invoke `--execute` as part of readiness work.

## Changes and verification

Exact STEP 13L files changed:

1. `live.contracts.ts`: fixed-experiment UNKNOWN policy, truthful blockers and
   independent false token-bound qualification flag.
2. `live.authorization.ts`: no-payment attestation, bound inspection and pure
   future gate-opening request.
3. `live.transport.ts`: token-bound denial before credential entry.
4. `live.http.ts`: same denial on direct native-client invocation.
5. `live.native.cli.ts`: nonsecret admission inspection and pre-prompt check.
6. `../../src/conversation/__tests__/cloudflare.teacher.native.readiness.offline.v1.test.ts`:
   authorization/policy negatives, explicit no-authorization case, permanent
   simulated quota consumption, truthful token-bound inspection and preflight.
7. `../../src/conversation/__tests__/cloudflare.teacher.network.containment.offline.v1.test.ts`:
   synthetic token-bound qualification in the deliberately missing-mock probe.
8. `FIRST_LIVE_ADMISSION.md`: this record.

The frozen payload, journal implementation, response parser, Realization verifier
and immutable network-denial safeguard are reused unchanged. All native-path
tests use synthetic authorization/credentials and test-only qualified-bound
substitution. These fixture substitutions do not qualify the production bound.
The real inspection command is tested under network denial; `--execute` is never
invoked. Existing working-tree modifications are preserved; no commit is made.

Regression command, from `planneragent/core`:

```powershell
node --require ./qualification/teacher-one-shot/offline.network-deny.cjs node_modules/vitest/vitest.mjs run --config vitest.teacher.native.readiness.offline.config.mts
```

Full result: **397/397 PASS across 11 files**, including all prior 381 tests and
16 new admission cases. Focused native/containment result: 57/57 PASS. The targeted
TypeScript check reports no one-shot-file errors, but still exits nonzero on the
same three unchanged learning-file diagnostics previously recorded in 13K.
Inspection reports dispatch false, Teacher DISABLED/SHADOW, token bound false,
UNKNOWN quota accepted only for the fixed experiment, and an opening request
that does not open anything. Production `live-state/` is absent. No unintended
external HTTP/HTTPS traffic occurred under the immutable test safeguard. Only
public documentation was browsed outside that test process.
