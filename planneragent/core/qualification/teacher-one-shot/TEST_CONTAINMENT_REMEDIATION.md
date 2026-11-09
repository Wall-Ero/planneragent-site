# STEP 13K-S - one-shot HTTPS test containment

## Incident evidence and execution path

Evidence: the STEP 13K record in `LIVE_EXECUTION_READINESS.md:87`, the retained
conversation's initial failing test output, the current native source and tests.
The faulty version was changed in place and was not committed. Its temporary
receipts were deleted by normal test cleanup; no provider-side audit was accessed.

The initial spy changed `https.default.request` via `vi.spyOn(https, "request")`.
`live.http.ts:1` imports `request as httpsRequest` as a named built-in export.
Replacing the default object's property did not replace that already-bound named
export. There was no socket-level independent denial. A test-only module override
set `LIVE_NETWORK_ENABLED_V1: true` and substituted a temporary fixed journal path;
the credential reader was replaced with a synthetic nonsecret string. The
production source constant remained false.

The four affected test invocations were synchronous native failure and the three
native error/redirect/success cases. Each followed:

1. `runNativeLiveTransportExperimentV1` (`live.transport.ts:16`): test-only gate,
   exact synthetic authorization, synthetic credential, frozen request.
2. Shared `runTransportV1`: synced reservation and dispatch markers, then exactly
   one `client.post` (`live.transport.ts:126`).
3. `GuardedNativeHttpsClientV1.post`: native HTTPS named export, followed by
   `outgoing.end` (`live.http.ts:45`). The stale default-export spy saw zero calls.

The unchanged target was the genuine endpoint:
`https://api.cloudflare.com/client/v4/accounts/efd250d57d6fad4a3c4ca458fc20c550/ai/run/@cf/qwen/qwen3-30b-a3b-fp8`.
The fixed frozen payload was used, with no redirect/retry/fallback mechanism.
Only a deliberately synthetic invalid credential was used; the operator token
was not requested, read or supplied. Four requests are reported by the incident
record and consistent with the four affected test paths; packet/provider logs
are not available to independently audit wire delivery.

One retained assertion shows `outcome: PROVIDER_ERROR` and `CF_PROVIDER_ERROR`.
This is a local classification (`live.transport.ts:77`), not a numeric Cloudflare
error code. Exact HTTP status, numeric provider error, response bodies and the
other three outcomes are unavailable. Do not infer 401/403 or claim every response
was an authentication rejection. No retained response establishes successful
inference. Provider-side inference and Neuron usage cannot be independently
certified from these records; Neurons remain UNKNOWN. No live re-probe is permitted.

## Permanent containment

- Existing corrected module mock returns the same throwing-by-default fixture
  function as BOTH default and named HTTPS exports. It has no native fallback.
- New `offline.network-deny.cjs` is a test-only preload that immutably denies TCP
  socket connects, TLS, HTTP2, UDP and external DNS; synchronizes named built-in
  exports; and defaults fetch to denial. It stores fixed route labels only.
- Vite's exact `localhost` lookup is answered from an in-memory loopback fixture.
  No OS lookup is used and loopback socket connections are also denied.
- The one-shot config installs the guard before tests/workers, and its setup file
  installs/checks it in each test realm. The native test file also imports this
  setup directly. Restoring mocks cannot restore locked socket methods.
- The preload propagates to Node subprocesses via NODE_OPTIONS. Unexpected attempts
  fail afterEach even when transport code sanitizes the error; unacknowledged
  attempts also make process exit fail. Only deliberate negative probes explicitly
  acknowledge an exact expected denial sequence.

The shared transport calls the supplied client once and records an error on
failure. The fixture entrypoint rejects native/arbitrary clients; neither catches
an injection error and substitutes a native client. The deliberate missing-mock
test exercises the native path with only synthetic inputs and proves its socket
attempt is independently denied before DNS/network I/O. Its legacy receipt field
`actual_network_requests` is not wire-delivery evidence.

This is a Node test containment layer for accidental missing/misconfigured mocks,
not an OS firewall against hostile test code, native addons or unrelated external
executables. The configured regression subprocesses are Node and inherit denial.
Nothing here changes production transport, authorization or the closed gate.

## Inspection safety

`live.native.cli.ts:8` handles --inspect, prints the availability/challenge/digest,
and returns at line 10. This precedes console creation, confirmation and native
runner invocation. Availability and challenge construction only read constants,
build immutable data and calculate a digest. Imports define functions/classes;
they do not call the credential reader or native client. The guarded subprocess
test executes the real inspection command and verifies exit zero, closed-gate
output, no hidden credential prompt and no production state creation.

## Verification command

From `planneragent/core`, with installed dependencies and no credentials:

```powershell
node --require ./qualification/teacher-one-shot/offline.network-deny.cjs node_modules/vitest/vitest.mjs run --config vitest.teacher.native.readiness.offline.config.mts
```

The guard is active before the runner starts. Negative tests exercise real Node
HTTP/HTTPS default/named entrypoints without mocks, TLS, raw TCP, fetch, HTTP2, UDP
and DNS; reproduce the original default-only spy mismatch; verify missing-mock
denial, immutable socket methods, inherited child containment and failure despite
swallowed errors. All probes stop locally before network I/O. No token access,
real HTTP/HTTPS request, inference, deployment, billing change or commit is part
of STEP 13K-S. Existing working-tree changes are preserved.

Full regression result: **381/381 PASS across 11 files**, consisting of the prior
366 tests and 15 containment tests. No unacknowledged network attempts occurred.
The first guarded startup failed closed on Vite's localhost probe; only after the
in-memory localhost fixture was added did tests run. Production source still has
`LIVE_NETWORK_ENABLED_V1 = false as const`; production `live-state/` is absent.

Final state: `CLOUDFLARE_ONE_SHOT_TEST_CONTAINMENT_VERIFIED`.
This verifies offline containment; it does not authorize live inference or recover
the unavailable historical HTTP statuses/provider responses.
