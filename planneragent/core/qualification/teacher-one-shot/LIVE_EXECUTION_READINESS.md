# STEP 13K — guarded native execution readiness

Implementation state: `CLOUDFLARE_TEACHER_LIVE_EXECUTION_READY_OFFLINE`.
This is neither LIVE QUALIFIED nor permission to infer. The production source
constant `LIVE_NETWORK_ENABLED_V1` remains `false`; no CLI argument, token,
environment variable or passing test opens it. Teacher remains DISABLED/SHADOW.

## Changes and preserved boundaries

13J denied native execution unconditionally in `HardDisabledHttpsClientV1` and
accepted only exact fixture clients with fixture journals in its runner. It had
no credential acquisition path. Those old entrypoints still deny native use.

13K adds a separate guarded native entrypoint to the same transport, not a new
transport/parser/journal architecture. Native authorization has an exact canonical
challenge: account, Qwen model, frozen digest, fixed experiment identity and state
location, limits, Workers Free operator verification, direct Workers AI route with
no AI Gateway/prepaid route, dedicated token name/expiry, UNKNOWN Neurons and
exactly one POST. Missing/extra/changed fields or incorrect confirmation fail closed.
The confirmation is `AUTHORIZE ONE POST <challenge digest>`. Inspection is not consent.

The existing fixed experiment identity is single-use. There is no experiment-ID,
state-path or reset option. Another experiment requires a separately reviewed change.
Native journal permission is also claimed in memory exactly once; reconstruction
or another native client cannot claim it again. Both exclusive fsynced markers
precede HTTPS construction. A native failure consumes the attempt permanently.

The native backend validates the exact endpoint, frozen body and allowed headers,
uses verified TLS, no keepalive, one socket and one POST, without redirects/retries.
The existing shared reader/parser retains the 30-second deadline, 65,536-byte
maximum, no fallback, separate Realization verification and private bounded receipt.
HTTP success is not semantic success or independent linguistic review. Provider
token provenance distinguishes native responses from injected fixtures; Neurons
remain UNKNOWN in every case. No public answer, Student or training path is added.

## Windows secure entry procedure (future authorization only)

Use an interactive Windows console running Node, from `planneragent/core`.
Do not use redirected stdin, an IDE debug input channel, shell variables, shell
transcription/session recording, command arguments or credential files for the token.
Do not enter a token during this STEP. No token is needed for inspection:

```powershell
node node_modules/vite-node/vite-node.mjs --script qualification/teacher-one-shot/live.native.cli.ts --inspect
```

After a future explicit authorization and reviewed source-gate change only, the
execution command would be the same command with `--execute` instead of `--inspect`.
Today that command denies before any prompt or journal write.

The future CLI prints the full nonsecret challenge. The operator verifies the
exact account/model/digest/identity/location, current Workers Free status and
direct route, then types the displayed digest-bound confirmation at the Node
prompt. This input is not a PowerShell command and does not enter shell history.
Only then does a raw-console prompt request the dedicated token with echo disabled.
Paste/type it there and press Enter; Ctrl+C cancels. Raw mode and listeners are
restored/removed on completion, cancellation, invalid input or stream error.
No OAuth/environment/file discovery exists. Redirected console input is rejected.
No credentials or raw errors are logged; CLI errors use a fixed generic message.
The token is held only in process memory and removed from owned references after
the attempt. JavaScript cannot promise cryptographic erasure of immutable strings.

The token is conservatively rejected starting 2026-10-29 00:00 UTC because its
exact expiry time is unknown. Never reuse other credentials on failure.

## Verification and containment incident

The inherited 340 tests pass. The 13K suite adds exact authorization negatives,
expiry/cancellation, hidden console entry and cleanup, source-gate denial before
credential/state/I/O, synthetic native success/error/redirect/deadline/oversize,
journal-before-request, redaction and replay denial. Native tests replace both
default and named HTTPS exports at module import; they never need a real token.

Final run: 366/366 tests pass across ten files (340 inherited + 26 new), using
`node node_modules/vitest/vitest.mjs run --config vitest.teacher.native.readiness.offline.config.mts`.
Inspection reports `real_dispatch_enabled: false`, Teacher DISABLED/SHADOW; the
production `live-state/` directory is absent. A targeted TypeScript check reports
no one-shot-file errors, but is not globally clean: three existing diagnostics
remain in unchanged `conversational.training.source.eligibility.v1.ts` (lines 122,
132) and `synthetic.conversational.persona.v1.ts` (line 113). Repository-wide diff
checking also finds pre-existing whitespace in the unchanged UI SVG. These files
were left untouched. No commit was created.
The production `--execute` command was also checked: it exits 1 with the fixed
`ONE_SHOT_DENIED_OR_STOPPED_NO_RETRY` message before any credential prompt or
production state creation.

An initial test harness incorrectly spied only on the HTTPS default export while
the native implementation imported its named export. Four tests therefore reached
the fixed endpoint using a deliberately synthetic invalid credential and a
test-only substituted gate/location. The visible failure receipt reported
`CF_PROVIDER_ERROR`; other responses were not retained. No actual operator token
was requested/read/used. No successful inference was observed, but this STEP
cannot truthfully provide proof of zero HTTPS dispatches or independently certify
provider-side execution/Neuron usage. Neuron usage remains UNKNOWN. The temporary
test receipts were removed by normal test cleanup; no forensic detail is invented.
The production source gate was never changed. The harness was corrected before
subsequent passing runs. No deployment, billing/route change or commit occurred.

## Remaining prerequisites and next action

Before any future real Qwen request: review these changes and the containment
incident; explicitly authorize one experiment and a source-gate opening; verify
current Workers Free status, exact token/account/permissions/validity and no
Gateway/prepaid route; review UNKNOWN daily Neurons and existing unqualified live
input-token/hosted-response compatibility limits; verify the fixed live journal
is unclaimed. Do not reset consumed/uncertain state. Then complete the interactive
challenge and hidden token entry. Provisioning a token and offline success confer
no inference authority.

The single next executable step is the nonsecret `--inspect` command above.
