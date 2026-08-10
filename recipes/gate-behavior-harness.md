---
status: RUNNABLE-LIVE
todos_open: 0
last_gate: "logs/RUN_LOG.md#gate-behavior-harness"
attestation: "reports/gate-behavior-harness-attestation.md"
recipe_version: 1.0.0
type: harness
---

# gate-behavior-harness — Prove Liveness/Timeline Are Gates, Not Votes

## 1. Executive Summary

The Bayesian Role Scorer (`scripts/score/role-scorer.mjs`, Ch.11) is
supposed to treat `liveness` and `timeline` as **gates** — multipliers that
zero the composite score regardless of how strong the votes are — not as
**votes** that only nudge the score. This recipe runs an automated harness
that proves that behavior against the real scorer script, on real
constructed evidence records, and reports PASS/FAIL per scenario. It found
and closed a real gap: a role whose `liveness` or `timeline` field is
missing entirely (not 0, just absent) was previously scored as if the gate
were fully open, letting a never-verified role reach "Apply." Risk: low —
this only tightens the scorer's behavior toward its own documented intent;
no other recipe currently calls the scorer, so no other workflow depends
on the old default. Expected outcome: 6/6 scenarios pass against the
current (patched) scorer.

## 2. Required Reads

- `scripts/score/role-scorer.mjs` — the component under test, read in full
  before touching anything; the CONFIG block and `scoreRole` function are
  the parts this harness exercises.
- `chapters/11-the-bayesian-role-scorer.md` — states liveness/timeline are
  multipliers, not addends, and that a closed gate must zero the composite
  "no matter how strong the votes."
- `DATA_CONTRACT.md` — governs what counts as verified vs. missing data;
  this recipe's fix (fail-closed on missing gate data) is a direct
  application of that contract to a case the contract doesn't name
  explicitly.
- `data/examples/ch11-roles.json` — the reference fixture; used for the
  regression check (this recipe's output on it must not change).

## 3. Phase Gates

1. **Problem gate:** the thing being evaluated is named — does
   `role-scorer.mjs` actually enforce "gate, not vote" on all valid
   inputs, including inputs upstream steps might realistically produce?
   Failure path: if the target behavior can't be stated as a testable
   assertion, stop and clarify before writing fixtures.
2. **Local evidence gate:** confirm no existing test suite already covers
   this (`find . -iname "*test*"` outside `node_modules`, excluding the
   unrelated Python ATS tests). Failure path: if a test suite already
   exists, extend it, don't duplicate it.
3. **Stored script gate:** confirm the harness spawns the *real* stored
   script (`scripts/score/role-scorer.mjs`) rather than re-implementing
   scoring logic. Failure path: if the harness can't invoke the real CLI
   (e.g. a packaging issue), stop — a harness that tests a reimplementation
   isn't testing the shipped behavior.
4. **Small-run gate:** run one scenario manually before running the full
   battery. Failure path: if a single fixture doesn't produce parseable
   JSON output, stop and fix the fixture format before scaling up.
5. **Verification gate:** run the full harness against the **unpatched**
   scorer first — it must fail on the target-bug scenarios, or the
   harness isn't actually testing anything. Failure path: if the harness
   passes against known-buggy code, the assertions are wrong; fix them
   before touching the scorer.
6. **Review gate:** a human reviews the diff to `role-scorer.mjs` before
   it's treated as authoritative — this recipe does not self-certify.
   Failure path: no PR merges without this review.
7. **Logging gate:** every real run against real data appends to
   `logs/RUN_LOG.md`. Failure path: an unlogged run is not attested.

## 4. Primary Stored Tools

- `node scripts/score/role-scorer.mjs <roles.json> --out-dir <dir>` — the
  component under test (existing, stored).
- `node scripts/test/gate-behavior-harness.mjs` — this recipe's new stored
  script; spawns the scorer on constructed fixtures and asserts.
- `node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md
  recipes/gate-behavior-harness.card.md` — this recipe's new stored
  script; compares the command lists in this recipe and its paired card.

No step in this recipe requires an unstored script.

## 5. Workflow

1. Run the harness. It builds six fixtures in a temp directory (healthy,
   dead-liveness, dead-timeline, boundary-at-gate_zero, missing-liveness,
   missing-timeline), spawns the real scorer CLI on each, and asserts on
   the real JSON output.

```
node scripts/test/gate-behavior-harness.mjs
```

2. Read the console PASS/FAIL lines and the written
   `reports/generated/gate-behavior-harness-results.json`.
3. If any scenario fails, that is real evidence of a gate-as-vote defect —
   do not silently patch the scorer; document the failure in
   `reports/gate-behavior-harness-attestation.md` first, exactly as
   observed, before making any code change (verification gate above).
4. Run the regression check against the reference example — only the
   `generated` date field should differ from the checked-in output.

```
node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir /tmp/regression-check
```

5. Confirm the recipe and its card list the same commands.

```
node scripts/test/drift-check.mjs recipes/gate-behavior-harness.md recipes/gate-behavior-harness.card.md
```

6. Append a `logs/RUN_LOG.md` entry recording what ran, what passed/failed,
   and what changed.

## 6. Output Contract

### Agent output
File: `reports/generated/gate-behavior-harness-results.json`
Fields: `ran_at`, `scenarios` (array of `{name, pass, expectation,
actual_recommendation, actual_reason, actual_composite}`), `fail_count`,
`total`.

### Human report
File: `reports/gate-behavior-harness-attestation.md` +
`reports/gate-behavior-harness-honest-run.md`
Reader: a maintainer deciding whether to merge the PR, or a hiring manager
reviewing the portfolio piece.
Decision enabled: merge / request changes / reject.
Sections: verified-vs-inferred boundary table, ethics gate results,
real pasted terminal output (before and after the fix), the deliberate
break attempt, the metric readout, and the "what the machine could not
know" account.

## 7. Verification Checks

- `node scripts/test/gate-behavior-harness.mjs` exits 0 (6/6 pass) against
  the current scorer.
- The regression diff against `data/examples/ch11-roles.json` shows only
  the `generated` timestamp differing.
- `node scripts/test/drift-check.mjs` reports no command mismatch between
  this recipe and its card.
- `npm run verify && npm run doctor` both pass clean, with no `data/ats/`
  or private paths staged.

## 8. Logging Rules

Log to `logs/RUN_LOG.md` on: the initial (failing) run against the
unpatched scorer, the fix commit, the passing re-run, and the regression
check. Do not log fixture contents verbatim if they were ever built from
real candidate data (they are not, here — all fixtures are synthetic
`TestCo` records built by the harness itself).

## 9. Stop Conditions

- Stop if the harness cannot spawn the real scorer CLI (packaging/path
  issue) — a harness testing a reimplementation is not gradeable evidence.
- Stop if the harness passes against the unpatched scorer — the
  assertions are wrong, not the code.
- Stop if the regression check shows any output difference beyond the
  `generated` timestamp — the fix has side effects beyond its stated scope
  and needs review before proceeding.
- Stop if `npm run doctor` reports any private/PII path staged — do not
  commit until clean.
- Stop before claiming "fixed" if fewer than 6/6 scenarios pass after the
  patch — a partial fix is not a fix.
