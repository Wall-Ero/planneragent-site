# Interpretation SECONDARY integration qualification

This harness uses the actual Core route, resolver, runtime, and Student adapter.
Only the existing realization provider seam is replaced: it captures the exact
input in memory and returns a fixed valid envelope. It generates no product prose.
Realization remains UNQUALIFIED. This is a local harness, not a deployed Core test.

From `planneragent/core`, run the offline boundaries:

```powershell
node node_modules/vitest/vitest.mjs run --config qualification/secondary/vitest.config.mts
```

Prepared live command — do not run until explicitly authorized:

```powershell
node qualification/secondary/live.mjs --live
```

Supply these through the invoking process environment, without putting credentials
in command arguments or logs:

- `INTERPRETATION_STUDENT_ENDPOINT`
- `INTERPRETATION_STUDENT_AUTHORIZATION`
- `INTERPRETATION_STUDENT_TIMEOUT_MS`

The command fixes SECONDARY activation and kill switch settings, makes one Core
qualification request (`What can PlannerAgent do?`), and permits at most one
identity GET followed by one interpretation POST to the configured origin.
No retries, OpenRouter requests, storage bindings, shadow scheduler, file writes,
or secret-file reads are supplied. A failed prerequisite may prevent inference.
All frozen identity fields plus bf16 and PA_STUDENT_HTTP_V1 must pass the actual
adapter before interpretation is attempted. The interpreted response is parsed
using the production canonicalizer/parser and compared in full with the runtime
capture. The sealed Student request is also compared with the production seal.

Output is limited to the eleven requested evidence fields. Exit 0 means all
acceptance fields and Core HTTP 200 passed; exit 1 means qualification failed.
No endpoint, bearer token, raw model response, or reasoning is printed or saved.
No Student result is written as authority or execution state. This qualification
does not establish broader model accuracy, Realization reliability, or deployed
Core configuration. The live invocation passed on 2026-10-18. See LIVE_QUALIFICATION_EVIDENCE_2026-10-18.md.
