# PlannerAgent Agent Instructions

## Mission

Preserve perfect cognitive continuity of PlannerAgent development by grounding every development decision in the current repository rather than in conversational memory.

## Canonical source priority

Use sources in this order:

1. Current repository files
2. Founder-approved PlannerAgent FAQ
3. Git status and Git history
4. Current project state
5. Conversation history

Conversation memory is supplementary and must never override current repository evidence.

## Mandatory startup sequence

Before answering any PlannerAgent development question:

1. Read `project-memory/state/CURRENT_STATE.md`
2. Read `project-memory/generated/REPOSITORY_TREE.txt`
3. Read `project-memory/doctrine/faq-v4.1.md` when product doctrine is relevant
4. Inspect `git status`
5. Inspect recent commits
6. Identify the smallest set of relevant source files
7. Read those files directly
8. Read related tests, runners, and end-to-end integrations
9. Only then propose or modify code

## Repository reality principle

The repository is the source of truth for what has been implemented.

Do not assume that something is missing merely because it is absent from conversation history.

Do not assume that something is implemented merely because it was discussed previously.

Always verify directly in the repository.

## Minimum reading principle

Read the smallest set of repository files sufficient to answer correctly.

Do not read the whole repository without need.

Do not answer from memory when repository evidence is available.

## Semantic reading rule

When reading a canonical file, extract and preserve:

- purpose
- canonical responsibility
- does
- does not
- core principles
- security principles
- determinism principles
- inputs
- outputs
- imports
- exports
- invariants
- denial conditions
- fail-closed conditions
- upstream lineage
- downstream responsibility
- deferred evolution
- future evolution
- version notes

Do not invent missing semantics.

Distinguish clearly between:

- explicitly declared behavior
- behavior demonstrated by code
- inferred architectural meaning
- planned or deferred behavior

## Architectural boundary rule

Preserve existing family boundaries.

Do not allow one family to absorb responsibilities assigned to another family.

Do not create parallel abstractions when an existing family already owns the responsibility.

Before creating a new file or family:

1. Search the repository tree
2. Search by domain name, responsibility, terminology, and exports
3. Read any potentially overlapping implementation
4. Verify that the capability does not already exist

## PlannerAgent product doctrine

PlannerAgent is an authority layer.

It begins from operational reality.

It helps organizations observe, govern, authorize, delegate, execute, and verify operational decisions across systems, teams, workflows, tools, and AI participation.

Human intent must remain in control.

Capability does not create authority.

Execution does not create legitimacy.

Governance determines legitimacy.

Runtime determines eligibility.

Mechanisms execute.

The implementation must remain aligned with the founder-approved FAQ.

## Fail-closed rule

Incomplete, ambiguous, malformed, unauthorized, incoherent, cross-boundary, or unverifiable states must be rejected unless an existing canonical contract explicitly defines otherwise.

Missing evidence must not be interpreted as authorization.

## Immutability and lineage

Preserve:

- canonical operational facts
- durable identities
- tenant and company boundaries
- domain and encryption-domain boundaries
- source object immutability
- defensive copying
- decision lineage
- execution lineage
- evidence lineage
- ledger lineage
- audit lineage
- cryptographic lineage

## Development completion sequence

A development unit is not complete until all applicable steps are finished:

1. Implementation
2. Dedicated runner or test
3. Family runner
4. End-to-end integration
5. Direct verification of negative boundaries
6. `git diff` review
7. Repository tree regeneration
8. `CURRENT_STATE.md` update
9. Focused commit

## Current-state discipline

`project-memory/state/CURRENT_STATE.md` stores only information that cannot be reconstructed reliably from repository content alone, including:

- current active family
- current objective
- latest verified completion
- pending commits
- blockers
- next permitted action
- deferred development decisions relevant to the active work

Keep it concise and current.

## Prohibited behavior

Do not:

- reconstruct implementation state primarily from chat history
- ask the user to reattach files that are already accessible in the repository
- propose a new abstraction before checking for an existing one
- treat planned work as implemented
- treat source existence as proof of successful verification
- change product doctrine without explicit founder approval
- redesign completed architecture without explicit approval
- mix unrelated architectural families in one commit
- include `node_modules`, build output, coverage, or generated dependencies in commits

## Response discipline

When resuming development, report:

- verified current state
- unverified assumptions
- files inspected
- existing implementation relevant to the request
- next permitted action
- architectural constraints that must be preserved

Do not begin code changes until repository evidence has been examined.
