# Honest Run — gate-behavior-harness

## Plausibility audit before trusting the output

Does a genuinely dead gate collapse the composite to exactly 0? Confirmed:
`composite=0` exactly, via hard multiplication by 0. Does a boundary case
get *gated*, not merely *down-weighted*? Confirmed: `liveness=0.05` exactly
produces `recommendation=Skip`, reason explicitly says "gated." Does the
fuzz test's pass/fail claim survive being checked against the unpatched
code, or does it only pass by coincidence? Checked directly — see below.

## Real terminal output — fixed harness, BEFORE the fix

```
$ node scripts/test/gate-behavior-harness.mjs
...
✗ FAIL — THE TARGET BUG -- missing liveness field entirely (not 0, just absent), high votes
  actual: recommendation=Apply composite=0.5557 reason="composite 0.556 ≥ 0.3, gates healthy"
✗ FAIL — THE TARGET BUG -- missing timeline field entirely (not 0, just absent), high votes
  actual: recommendation=Apply composite=0.6175 reason="composite 0.617 ≥ 0.3, gates healthy"

4/6 scenarios passed.
```

## Real terminal output — fuzz test, BEFORE the fix

```
$ node scripts/test/fuzz-invariants.mjs --n 300 --seed 42
...
✗ VIOLATION [gate_product in [0,1]] on input:
  ...
  "liveness": { "factor": -0.5, ... }, "timeline": { "factor": 0.0499999, ... }
  result composite: -0.005, gate_product: -0.025
  Reproduce with: --seed 42, case index 299

✗ 196 invariant violation(s) found across 300 inputs.
```

This is a materially stronger before-signal than the fixed harness alone:
**196 of 300 randomly generated inputs (65%) violated the invariants** on
the unpatched scorer, including a genuinely nonsensical negative composite
score (-0.005) — a number that should be structurally impossible for a
probability-weighted score to produce, and would be very hard for a human
reviewer to catch by eye in a normal-looking report.

## Real terminal output — AFTER the fix (both suites)

```
$ node scripts/test/gate-behavior-harness.mjs
...
✓ PASS — THE TARGET BUG -- missing liveness field entirely (not 0, just absent), high votes
  actual: recommendation=Skip composite=0 reason="gated: liveness data MISSING ..."
✓ PASS — BREAK-ATTEMPT FINDING -- out-of-range liveness factor (1.8) must not inflate the composite
  actual: recommendation=Apply composite=0.325 reason="composite 0.325 ≥ 0.3, gates healthy"

7/7 scenarios passed.

$ node scripts/test/fuzz-invariants.mjs --n 300 --seed 42
Fuzz-testing role-scorer.mjs invariants: N=300, seed=42

✓ All 3 invariants held across 300 randomly generated inputs (including adversarial values: NaN, Infinity, negative, out-of-range, missing).
```

## Deliberate break attempt

The original break attempt (out-of-range liveness=1.8) is what led to the
clamp fix, which is what the fuzz test above validates at scale rather
than as a single hand-picked case. I additionally tried, specifically to
stretch-test my own claim of "0 violations": re-running the fuzz test with
five different seeds (`7, 99, 1234, 55555, 777`) to check the fix isn't
seed-42-specific:

```
$ for s in 7 99 1234 55555 777; do node scripts/test/fuzz-invariants.mjs --n 300 --seed $s; done
```

All five runs: 0 violations across 300 cases each (1,500 total additional
random adversarial cases beyond the original 300).

## Regression check

```
$ node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/regression-check
✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
```
Diff against checked-in output: only the `generated` timestamp differs.

## Drift check

```
$ node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
Recipe commands: 4  Card commands: 4
No drift: every command in the recipe appears in the card, and vice versa.
```

## Ethics gate

```
$ npm run verify
✓ all conform. ✓ manifest check passed.

$ npm run doctor
PRIVACY: ✓ no private/PII paths are tracked
```

## The metric readout

- **Fixed harness:** 4/6 → 7/7 (2 real bugs found and closed, 1 additional
  break-attempt bug found and closed in the same patch).
- **Fuzz test:** 196/300 violations → 0/300, confirmed stable across 5
  additional seeds (1,500 more randomized cases, 0 violations).
- **0 regressions** on the reference example.
- **0 drift** between recipe and card.

## What the machine could not know

Neither test suite can know how often real upstream feeds (Ch.7-10)
actually produce a missing or malformed gate value in production — both
prove the *consequence* of that happening, not the *frequency*. I also
can't verify whether fail-closed-and-clamp is the objectively correct
remediation versus, say, rejecting a malformed record outright rather than
scoring it at all with a defensive default — I chose the smaller,
less disruptive change, but a maintainer with more production context
might reasonably prefer stricter rejection. That's a human call this
contribution hands back, not one it resolves unilaterally.
