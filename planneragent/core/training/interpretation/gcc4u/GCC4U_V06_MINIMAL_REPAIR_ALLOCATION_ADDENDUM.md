# GCC-4U-A — v0.6 Minimal Repair Allocation Addendum

Status: **FROZEN ALLOCATION ADDENDUM**  
Scope: allocation only; the semantic scope and qualification gates in GCC-4U are unchanged.  
Corpus generation, training, packaging, and model changes performed: **NO**

## 1. Extracted GCC-4U marginals

Frozen recommended corpus total: **160**.

| Category | Frozen total |
|---|---:|
| `PROTECTED_PRECEDENCE` | 44 |
| `EXECUTION_PRECEDENCE` | 52 |
| `ROLE_LITERAL_FIDELITY` | 32 |
| `CLOSED_ENUM_DISCIPLINE` | 32 |
| **Total** | **160** |

| Split | Frozen total |
|---|---:|
| TRAIN | 96 |
| VALIDATION | 24 |
| QUALIFICATION | 16 |
| HOLDOUT | 12 |
| ADVERSARIAL | 12 |
| **Total** | **160** |

GCC-4U recommends category language profiles of approximately 50/30/20 EN/IT/mixed for protected precedence, 45/35/20 for execution precedence, and 50/25/25 for closed-enum discipline. It requires EN, IT, and mixed role surfaces but does not state a numeric role profile.

## 2. Frozen category × split matrix

| Category | TRAIN | VALID | QUAL | HOLD | ADV | TOTAL |
|---|---:|---:|---:|---:|---:|---:|
| `PROTECTED_PRECEDENCE` | 26 | 7 | 4 | 3 | 4 | **44** |
| `EXECUTION_PRECEDENCE` | 31 | 8 | 5 | 4 | 4 | **52** |
| `ROLE_LITERAL_FIDELITY` | 20 | 4 | 4 | 2 | 2 | **32** |
| `CLOSED_ENUM_DISCIPLINE` | 19 | 5 | 3 | 3 | 2 | **32** |
| **TOTAL** | **96** | **24** | **16** | **12** | **12** | **160** |

Allocation rule:

1. Start from proportional category allocation within each frozen split.
2. Apply deterministic integer rounding while preserving every row and column marginal.
3. Assign the limited adversarial rounding surplus to protected and execution precedence because they contain the GCC-4R Level 2 Critical topology.
4. Keep qualification and holdout broadly proportional and give every category non-TRAIN coverage.
5. Resolve remaining equal-cost cells in the fixed category order protected, execution, role, closed enum and split order TRAIN, VALIDATION, QUALIFICATION, HOLDOUT, ADVERSARIAL.

## 3. Frozen language totals

The exact global allocation is:

| Language | Count |
|---|---:|
| EN | **76** |
| IT | **49** |
| mixed | **35** |
| **Total** | **160** |

Category language marginals:

| Category | EN | IT | mixed | Total |
|---|---:|---:|---:|---:|
| `PROTECTED_PRECEDENCE` | 22 | 13 | 9 | 44 |
| `EXECUTION_PRECEDENCE` | 23 | 18 | 11 | 52 |
| `ROLE_LITERAL_FIDELITY` | 15 | 10 | 7 | 32 |
| `CLOSED_ENUM_DISCIPLINE` | 16 | 8 | 8 | 32 |
| **Total** | **76** | **49** | **35** | **160** |

Split language marginals:

| Split | EN | IT | mixed | Total |
|---|---:|---:|---:|---:|
| TRAIN | 46 | 30 | 20 | 96 |
| VALIDATION | 11 | 7 | 6 | 24 |
| QUALIFICATION | 7 | 5 | 4 | 16 |
| HOLDOUT | 6 | 5 | 1 | 12 |
| ADVERSARIAL | 6 | 2 | 4 | 12 |
| **Total** | **76** | **49** | **35** | **160** |

## 4. Frozen category × split × language allocation

Each cell is `EN / IT / mixed`.

| Category | TRAIN | VALID | QUAL | HOLD | ADV | Category total |
|---|---|---|---|---|---|---|
| `PROTECTED_PRECEDENCE` | 13 / 8 / 5 | 3 / 2 / 2 | 2 / 1 / 1 | 2 / 1 / 0 | 2 / 1 / 1 | 22 / 13 / 9 |
| `EXECUTION_PRECEDENCE` | 14 / 10 / 7 | 4 / 3 / 1 | 2 / 2 / 1 | 1 / 2 / 1 | 2 / 1 / 1 | 23 / 18 / 11 |
| `ROLE_LITERAL_FIDELITY` | 9 / 7 / 4 | 2 / 1 / 1 | 2 / 1 / 1 | 1 / 1 / 0 | 1 / 0 / 1 | 15 / 10 / 7 |
| `CLOSED_ENUM_DISCIPLINE` | 10 / 5 / 4 | 2 / 1 / 2 | 1 / 1 / 1 | 2 / 1 / 0 | 1 / 0 / 1 | 16 / 8 / 8 |

No split is single-language. Both hard-boundary categories contain multilingual QUALIFICATION, HOLDOUT, and ADVERSARIAL cases.

## 5. Deterministic language method

1. Apply largest-remainder allocation to each category's GCC-4U approximate profile.
2. Use the fixed language tie order mixed, EN, IT when fractional remainders are equal; this preserves scarce mixed-language coverage.
3. Because GCC-4U gives no numeric role ratio, derive the role profile from the record-weighted mean of the three explicitly quantified category profiles: 47.96875% EN, 30.78125% IT, 21.25% mixed. Largest remainder over 32 role records yields 15/10/7.
4. Distribute each category language marginal across its frozen split cells proportionally, preserve the category and split-cell marginals, and use the same fixed language tie order.
5. Resolve equal-cost split placements in fixed order QUALIFICATION, HOLDOUT, ADVERSARIAL, VALIDATION, TRAIN so evaluation retains multilingual coverage.

This method is deterministic and changes no semantic category, category total, split total, or qualification gate.

## 6. Automated consistency validation

The integer matrices were checked programmatically.

| Check | Result |
|---|---|
| Category row totals equal 44/52/32/32 | PASS |
| Split columns equal 96/24/16/12/12 | PASS |
| Grand total = 160 | PASS |
| TRAIN = 96 | PASS |
| Global languages = 76/49/35 | PASS |
| Category language marginals reconcile | PASS |
| Split language marginals reconcile | PASS |
| Every category has non-TRAIN coverage | PASS |
| Protected has QUAL/HOLD/ADV coverage | PASS |
| Execution has QUAL/HOLD/ADV coverage | PASS |
| Role has independent evaluation coverage | PASS |
| Closed enum has independent evaluation coverage | PASS |
| Negative counts | PASS — 0 |
| Fractional counts | PASS — 0 |
| Change to GCC-4U category totals | PASS — none |
| Change to GCC-4U split totals | PASS — none |

## 7. Scope preservation

This addendum only freezes allocation. It does not alter the four repair categories, precedence, family/renderer isolation, leakage controls, size bounds, future TRAIN composition, qualification gates, base model, model size, or exclusions frozen by GCC-4U. It creates no corpus records and authorizes no training by itself.

## 8. Final status

`GCC4U_V06_ALLOCATION_ADDENDUM_FROZEN`

`GCC4V_ALLOCATION_BLOCKER_CLEARED`
