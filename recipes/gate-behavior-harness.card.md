---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "logs/RUN_LOG.md#gate-behavior-harness"
attestation: "reports/gate-behavior-harness-attestation.md"
recipe_version: 1.0.0
type: card
---

# gate-behavior-harness.card.md — Human Card

## 1. Purpose

Proves that the Bayesian Role Scorer's `liveness` and `timeline` fields
behave as hard gates (can zero the composite regardless of votes) rather
than as soft votes (can only nudge the score) — and closes a real gap
found while proving it: missing gate data was silently treated as a fully
open gate.

## 2. What it can verify / what it cannot verify on its own

**Can verify:** that the scorer, run for real on constructed fixtures,
produces the correct recommendation for six specific, checkable scenarios
covering explicit-zero, boundary, healthy, and missing-field cases.

**Cannot verify on its own:** whether the *upstream* scripts that are
supposed to populate `liveness`/`timeline` in production actually ever
omit those fields in practice — this harness proves the scorer's behavior
*if* they do, not how often they do. That's a separate, unaddressed
question a maintainer should track (e.g. via logging how often the
`missing` source label appears in real runs).

## 3. Dependencies

- Reads/calls: `scripts/score/role-scorer.mjs` (the component under test).
- Reads: `data/examples/ch11-roles.json` (for the regression check only).
- Writes: `reports/generated/gate-behavior-harness-results.json`,
  temp files under the OS temp directory (cleaned up after each run).
- Assumes no other recipe ran first — this harness is self-contained and
  builds its own fixtures.

## 4. How to run — annotated

```
node scripts/test/gate-behavior-harness.mjs
```
Notice: the console prints one PASS/FAIL line per scenario with the
expected behavior and the actual scorer output side by side. A `0` exit
code and "6/6 scenarios passed" means the gate is currently behaving
correctly. Anything less is a real defect, not a test artifact.

```
node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/regression-check
```
Notice: compare the resulting `role-scores.json` against the checked-in
`data/examples/role-scores.json` — only the `generated` date should
differ. Any other difference means the fix changed behavior beyond its
intended scope.

```
node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
```
Notice: prints any command that appears in the recipe but not this card,
or vice versa. Empty output means no drift.

## 5. What it produces

- `reports/generated/gate-behavior-harness-results.json` — machine log of
  every scenario, real recommendation, real composite, real reason string.
- Console output showing 6/6 PASS against the current scorer.
- A `logs/RUN_LOG.md` entry recording the before/after run and the fix.
- A good run's audit: every scenario's `actual_reason` string names
  exactly which gate closed and why (explicit value vs. missing data) —
  if a reason string is vague ("gated: unknown"), that itself is a sign
  the harness or scorer regressed.

## 6. How it fails — named failure modes

1. **Harness passes against a reimplementation, not the real script.**
   Cause: if `SCORER` path resolution breaks (e.g. run from the wrong
   working directory) and `execFileSync` silently falls back or errors in
   a way that gets swallowed. Specific to this setup: the harness resolves
   `scripts/score/role-scorer.mjs` relative to `process.cwd()` — running
   it from a subdirectory instead of the repo root will fail loudly (file
   not found), not silently pass.
2. **Fixture cleanup race.** Cause: the harness writes to an OS temp
   directory and removes it at the end; if the process is killed mid-run
   (Ctrl-C), stale fixture directories accumulate under `/tmp/gate-harness-*`
   and are harmless but should be manually cleared if disk space matters.
3. **Drift — this card describes commands the recipe no longer runs.**
   Cause: if `scripts/test/gate-behavior-harness.mjs` is renamed, moved,
   or its CLI arguments change, and only the recipe is updated (or only
   this card is updated) in a later commit. Specific detection: run
   `node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md
   recipes/gate-behavior-harness.card.md` — any mismatch printed means
   this card has drifted from the recipe it documents and must be
   corrected to match the recipe (the executable recipe is ground truth,
   never edit the recipe to match a stale card).
4. **Contract violation — the harness produces no real output and a model
   fills the gap.** Cause: if `execFileSync` throws and the catch block's
   `{error, stdout, stderr}` object gets passed to `s.assert()` instead of
   a real scored role, the assertion function will throw (accessing
   `.machine_recommendation` on an object that doesn't have it), which the
   harness currently catches and marks as a FAIL — this is correct
   behavior (fail loudly), but if that catch-and-fail logic were ever
   "simplified" to catch-and-skip, a broken scorer invocation could
   silently vanish from the results instead of counting as a failure.
   Detection: the harness's `fail_count` should equal the actual number of
   `pass: false` entries in the written JSON log — verify these match, not
   just that the console said "PASS."
