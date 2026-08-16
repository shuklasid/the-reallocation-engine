---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "logs/RUN_LOG.md#gate-behavior-harness"
attestation: "reports/gate-behavior-harness-attestation.md"
recipe_version: 1.1.0
type: harness
---

# gate-behavior-harness — Prove Liveness/Timeline Are Gates, Not Votes

## 1. Executive Summary

The Bayesian Role Scorer (`scripts/score/role-scorer.mjs`, Ch.11) is
supposed to treat `liveness` and `timeline` as **gates** — multipliers that
zero the composite score regardless of votes — not as **votes** that only
nudge the score. This recipe runs two complementary test suites against
the real scorer: a fixed-scenario harness (6 hand-picked cases plus 1
break-attempt finding) and a property-based fuzz test (hundreds of
randomly generated adversarial inputs, proving the gate invariants hold
across the input space, not just the cases I thought to write by hand).
Found and closed two real bugs: missing gate data defaulted to fully-open
(fail-open instead of fail-closed), and out-of-range gate values (e.g.
negative numbers, values above 1) weren't clamped and could invert or
inflate the composite. Risk: low — no other recipe currently calls the
scorer. Expected outcome: 7/7 fixed scenarios pass; 0/N fuzz violations
across hundreds of randomized adversarial inputs.

## 2. Required Reads

- `scripts/score/role-scorer.mjs` — the component under test.
- `chapters/11-the-bayesian-role-scorer.md` — states liveness/timeline are
  multipliers, not addends.
- `DATA_CONTRACT.md` — governs verified vs. missing data.
- `data/examples/ch11-roles.json` — the reference fixture for the
  regression check.

## 3. Phase Gates

1. **Problem gate:** does `role-scorer.mjs` enforce "gate, not vote" on
   all valid inputs, including malformed ones a real upstream feed could
   plausibly produce? Failure path: if untestable, stop and clarify first.
2. **Local evidence gate:** confirm no existing test suite covers this.
   Failure path: extend, don't duplicate, if one exists.
3. **Stored script gate:** confirm both test suites spawn the *real*
   scorer CLI, not a reimplementation. Failure path: stop if the real CLI
   can't be invoked — testing a reimplementation proves nothing about
   shipped behavior.
4. **Small-run gate:** run one fixed scenario manually before scaling to
   the full battery or the fuzz run. Failure path: fix the fixture format
   before scaling up if a single case doesn't produce parseable output.
5. **Verification gate:** run both suites against the **unpatched** scorer
   first — they must fail (fixed harness: on the 2 target-bug scenarios;
   fuzz: with a high violation rate), or the tests aren't testing anything
   real. Failure path: if either suite passes against known-buggy code,
   the assertions/invariants are wrong, not the target code.
6. **Review gate:** a human reviews the diff before it's authoritative —
   this recipe never self-certifies. Failure path: no PR merges without
   human review of both the fix and the honest-run report.
7. **Logging gate:** every real run against real code appends to
   `logs/RUN_LOG.md`. Failure path: an unlogged run is not attested.

## 4. Primary Stored Tools

- `node scripts/score/role-scorer.mjs <roles.json> --out-dir <dir>` — the
  component under test (existing, stored).
- `node scripts/test/gate-behavior-harness.mjs` — fixed-scenario harness
  (this recipe's contribution).
- `node scripts/test/fuzz-invariants.mjs [--n N] [--seed S]` — property-based
  fuzz test (this recipe's contribution).
- `node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md`
  — recipe/card drift checker (this recipe's contribution).

No step in this recipe requires an unstored script.

## 5. Workflow

1. Run the fixed-scenario harness.

```
node scripts/test/gate-behavior-harness.mjs
```

2. Run the fuzz test, at least 300 cases, with an explicit seed for
   reproducibility.

```
node scripts/test/fuzz-invariants.mjs --n 300 --seed 42
```

3. Read the console PASS/FAIL output and the written result files
   (`reports/generated/gate-behavior-harness-results.json`,
   `reports/generated/fuzz-invariants-results.json`).
4. If either suite fails, document the failure exactly as observed in
   `reports/gate-behavior-harness-attestation.md` before making any code
   change (verification gate above).
5. Run the regression check against the reference example.

```
node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/regression-check
```

6. Confirm the recipe and its card list the same commands.

```
node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
```

7. Append a `logs/RUN_LOG.md` entry recording what ran and what changed.

## 6. Output Contract

### Agent output
Files: `reports/generated/gate-behavior-harness-results.json`,
`reports/generated/fuzz-invariants-results.json`.
Fields (harness): `ran_at`, `scenarios[]`, `fail_count`, `total`.
Fields (fuzz): `ran_at`, `n`, `seed`, `violations`.

### Human report
Files: `reports/gate-behavior-harness-attestation.md` +
`reports/gate-behavior-harness-honest-run.md`.
Reader: a maintainer deciding merge/reject, or a hiring manager.
Decision enabled: merge / request changes / reject.
Sections: verified-vs-inferred boundary table, ethics gate results, real
pasted terminal output (fixed harness AND fuzz test, before and after the
fix), the deliberate break attempt, the metric readout, "what the machine
could not know."

## 7. Verification Checks

- `node scripts/test/gate-behavior-harness.mjs` exits 0 (7/7 pass).
- `node scripts/test/fuzz-invariants.mjs --n 300 --seed 42` exits 0 (0
  violations) against the current scorer, and is confirmed to produce
  violations against the unpatched scorer (reproducibility check).
- The regression diff against `data/examples/ch11-roles.json` shows only
  the `generated` timestamp differing.
- `node scripts/test/drift-check.mjs` reports no command mismatch.
- `npm run verify && npm run doctor` both pass clean, no `data/ats/` or
  private paths staged.

## 8. Logging Rules

Log to `logs/RUN_LOG.md` on: the initial failing runs (both suites,
against the unpatched scorer), the fix commit, the passing re-runs, and
the regression check. No fixture contents are ever real candidate data —
all fixtures (fixed and fuzzed) are synthetic, generated by the test
scripts themselves.

## 9. Stop Conditions

- Stop if either suite cannot spawn the real scorer CLI.
- Stop if either suite passes against the unpatched scorer — the tests
  are wrong, not the code.
- Stop if the regression check shows any difference beyond the
  `generated` timestamp.
- Stop if `npm run doctor` reports any private/PII path staged.
- Stop before claiming "fixed" if fewer than 7/7 fixed scenarios pass, or
  if the fuzz test reports any violation, after the patch.
