---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "logs/RUN_LOG.md#gate-behavior-harness"
attestation: "reports/gate-behavior-harness-attestation.md"
recipe_version: 1.1.0
type: card
---

# gate-behavior-harness.card.md — Human Card

## 1. Purpose

Proves that the Bayesian Role Scorer's `liveness`/`timeline` fields behave
as hard gates rather than soft votes, using both fixed scenarios and a
property-based fuzz test — and closes two real gaps found while proving
it: missing gate data was treated as fully open, and out-of-range gate
values weren't clamped.

## 2. What it can verify / what it cannot verify on its own

**Can verify:** the scorer's behavior on both hand-picked and hundreds of
randomly generated adversarial inputs, deterministically reproducible via
`--seed`.

**Cannot verify on its own:** how often real upstream feeds actually
produce missing or out-of-range gate values in production — this proves
the *consequence* if they do, not the *frequency* that they do.

## 3. Dependencies

- Reads/calls: `scripts/score/role-scorer.mjs`.
- Reads: `data/examples/ch11-roles.json` (regression check only).
- Writes: `reports/generated/gate-behavior-harness-results.json`,
  `reports/generated/fuzz-invariants-results.json`, temp files (cleaned up
  after each run).
- Assumes no other recipe ran first — both suites are self-contained.

## 4. How to run — annotated

```
node scripts/test/gate-behavior-harness.mjs
```
Notice: one PASS/FAIL line per fixed scenario. 7/7 and exit 0 means the
gate is currently correct.

```
node scripts/test/fuzz-invariants.mjs --n 300 --seed 42
```
Notice: prints a violation with the exact failing JSON input if any of the
3 invariants break. A clean run prints one summary line and exits 0. Using
the same `--seed` always regenerates the identical sequence of test cases
— a violation is always reproducible, never a one-off flake.

```
node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/regression-check
```
Notice: compare the result against the checked-in
`data/examples/role-scores.json` — only `generated` should differ.

```
node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
```
Notice: prints any command mismatch between this card and its recipe.

## 5. What it produces

- `reports/generated/gate-behavior-harness-results.json` — machine log,
  7 fixed scenarios, real recommendation/composite/reason each.
- `reports/generated/fuzz-invariants-results.json` — machine log, N random
  cases, violation count, the exact seed used.
- Console output: 7/7 fixed PASS, 0 fuzz violations, against the current
  scorer.
- A `logs/RUN_LOG.md` entry.
- A good run's audit: every fixed scenario's `actual_reason` string names
  which gate closed and why (explicit-zero vs. missing vs. clamped
  out-of-range) — a vague reason string ("gated: unknown") signals a
  regression even if the PASS/FAIL count still looks fine.

## 6. How it fails — named failure modes

1. **Harness/fuzz test passes against a reimplementation, not the real
   script.** Cause: `SCORER` path resolution breaks if run from the wrong
   working directory — fails loudly (file not found), does not silently
   pass, but a maintainer should confirm the path in the console header
   line matches the real repo path before trusting a PASS.
2. **Fuzz test flakiness masquerading as a real bug, or vice versa.**
   Cause: this risk is specifically why the fuzz test uses a seeded PRNG
   (mulberry32) instead of `Math.random()` — the same `--seed` always
   regenerates the identical sequence, so "it failed once and I can't
   reproduce it" should never happen. If it does, that itself is a bug in
   the fuzz harness's determinism, not in the scorer, and should be
   reported as such.
3. **Drift — this card describes commands the recipe no longer runs.**
   Cause: if any of the four stored scripts are renamed or their CLI
   arguments change and only one of the recipe/card is updated. Detection:
   `node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md
   recipes/gate-behavior-harness.card.md` — any mismatch means this card
   has drifted and must be corrected to match the recipe (recipe is
   ground truth, never edit the recipe to match a stale card).
4. **Contract violation — a suite produces no real output and a model
   fills the gap.** Cause: if `execFileSync` throws and the resulting
   error object gets passed into an assertion instead of a real scored
   role, both suites' assertion logic will throw and get caught as a
   FAIL, not silently skipped — this is correct behavior. Detection: the
   written JSON logs' `fail_count`/`violations` fields should always match
   the actual count of failing entries; verify these match, not just that
   the console said "PASS" or printed a clean summary line.
