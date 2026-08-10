# Verified-Data Attestation — gate-behavior-harness

## Verified-vs-inferred boundary table

Every field this contribution emits, labeled per the book's "Give to AI /
Keep for yourself" split:

| Field | Label | Source |
|---|---|---|
| `scenarios[].actual_recommendation` | script-output | real return value from `role-scorer.mjs`, invoked as a real subprocess |
| `scenarios[].actual_composite` | script-output | same — the scorer's own computed number |
| `scenarios[].actual_reason` | script-output | the scorer's own generated reason string |
| `scenarios[].pass` | script-output | the harness's own assertion result, computed against real output, not asserted by a model |
| `fail_count`, `total` | script-output | counted by the harness script |
| The identification of the missing-field bug itself | local-evidence | found by reading the real, checked-in `role-scorer.mjs` source (`?? 1` defaults), not inferred or guessed |
| The claim "no other recipe currently calls role-scorer.mjs" | local-evidence | `grep -rl "role-scorer" recipes/` returned zero matches, checked directly |
| The claim "DATA_CONTRACT.md doesn't require liveness/timeline fields" | local-evidence | grepped the real file directly; no schema requirement found |
| The recipe's risk assessment ("Risk: low") | model-judgment | my own assessment, not a script output — labeled as such, not printed as fact |
| The choice of fail-closed over some other remediation (e.g. warn-and-continue) | your-input | a design judgment I made, consistent with the book's stated intent but not literally mandated by any single line of the book — see honest-run report |

## Ethics gate

**(a) Privacy.** No `data/ats/` or private file is staged. Confirmed via
`npm run doctor` (see honest-run report for pasted output) and via direct
`git status` inspection before commit.

**(b) Honesty.** Nothing this contribution generates misrepresents status
or invents a metric:
- The harness's PASS/FAIL counts are computed from real subprocess output,
  never asserted without running the code.
- The "before" (failing) run against the unpatched scorer is real,
  captured, and reported even though it made the initial submission look
  worse — per the honest-run report, the break-attempt / failing evidence
  is treated as more valuable than a clean run, not hidden.
- No number in this attestation or the honest-run report is a placeholder
  or an estimate presented as measured.

Both gate conditions pass — see the honest-run report for the actual
pasted terminal evidence this attestation refers to.
