# Verified-Data Attestation — gate-behavior-harness

## Verified-vs-inferred boundary table

| Field | Label | Source |
|---|---|---|
| `scenarios[].actual_recommendation`, `.actual_composite`, `.actual_reason`, `.pass` | script-output | real return value from `role-scorer.mjs`, invoked as a real subprocess |
| `fail_count`, `total` (fixed harness) | script-output | counted by the harness script |
| `violations`, `n`, `seed` (fuzz test) | script-output | counted by `fuzz-invariants.mjs`; the seed is recorded so any violation is exactly reproducible |
| The identification of the missing-field bug | local-evidence | found by reading the real, checked-in `role-scorer.mjs` source (`?? 1` defaults) |
| The identification of the out-of-range/negative-clamp bug | local-evidence | found via the deliberate break attempt (out-of-range factor test), confirmed by the fuzz test's 196/300 violation rate on unpatched code |
| The claim "no other recipe currently calls role-scorer.mjs" | local-evidence | `grep -rl "role-scorer" recipes/` returned zero matches |
| The claim "DATA_CONTRACT.md doesn't require liveness/timeline fields" | local-evidence | grepped the real file directly; no schema requirement found |
| The recipe's risk assessment ("Risk: low") | model-judgment | my own assessment, not a script output |
| The choice of fail-closed + clamp over some other remediation (e.g. reject the record outright) | your-input | a design judgment I made, consistent with the book's stated intent but not literally mandated by any single line of the book |
| The choice of 300 as the fuzz test's default N | your-input | a practical judgment (large enough to be meaningful, fast enough to run in CI) — not a value derived from any statistical requirement in the book |

## Ethics gate

**(a) Privacy.** No `data/ats/` or private file staged. Confirmed via
`npm run doctor` (see honest-run report for pasted output).

**(b) Honesty.** Nothing this contribution generates misrepresents status
or invents a metric:
- Both the fixed-scenario and fuzz-test PASS/FAIL counts are computed from
  real subprocess output, never asserted without running the code.
- The "before" (failing) runs against the unpatched scorer — for both
  suites — are real, captured, and reported even though they made the
  initial submission look worse.
- The fuzz test's seed is fixed and disclosed specifically so its results
  are independently reproducible by a reviewer, not just asserted.
- No number in this attestation or the honest-run report is a placeholder
  or an estimate presented as measured.

Both gate conditions pass — see the honest-run report for the actual
pasted terminal evidence this attestation refers to.

## Attestation

I have read this document and the honest-run report in full. I confirm
the terminal output shown is real — I reproduced the harness and fuzz
test results myself on my own machine, using the exact commands listed,
before pushing — and that the verified/inferred labels above are accurate
to my own understanding of what each field actually is, not just accepted
as written.

Siddharth Shukla — 2026-08-16
