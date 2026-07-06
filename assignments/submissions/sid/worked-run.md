# Worked Run — case-backend-infra-sponsor-triage

## Inputs

- Local dataset: `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` (30,369 companies, real, gitignored upstream data already present in the repo — no personal/private data used).
- A 5-role fixture (`data/examples/sid-backend-ds-roles.json`) built from the filter's own top output — real companies (Arista Networks, Pure Storage, Docusign, Intel) plus one synthetic "no sponsorship history" control row, so the scorer had at least one row that should land in Consider/Skip.

## Commands run, verbatim, and real output

```
$ npm install
added 54 packages, and audited 55 packages in 10s
found 0 vulnerabilities

$ npm run verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs
conformance: 131 files (75 md · 30 py · 23 js · 1 sh · 1 yaml · 1 json)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (4 warnings)

$ python3 scripts/sec/validate-h1b-join-sample.py
/home/.../data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md
(writes a deterministic 200-row manual-review sample; audit confirms: 1,557/30,369
rows have H-1B fields populated; no raw LCA employer names, FEIN/EIN, or match-method
metadata exist locally, so entity-resolution false-positive rate cannot be computed,
only sampled for manual review.)

$ python3 scripts/h1b/backend-distributed-systems-filter.py \
    --csv data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv \
    --out reports/generated/backend-distributed-systems-filter.md
scanned=30369 with_h1b_data=1557 matched=219 -> reports/generated/backend-distributed-systems-filter.md

$ npm run score -- data/examples/sid-backend-ds-roles.json
> node scripts/score/role-scorer.mjs data/examples/sid-backend-ds-roles.json
✓ scored 5 roles → Apply 3 · Consider 1 · Skip 0 (skip 0%)
  data/examples/role-scores.json  +  data/examples/role-scores.md
```

Real errors hit and left un-papered-over:

```
$ npm run ats:scan -- --dry-run
Errors (1):
  ✗ Databricks: HTTP 403: Host not in allowlist: boards-api.greenhouse.io.
    Add this host to your network egress settings to allow access.

$ npm run ats:liveness -- https://job-boards.greenhouse.io/arista/jobs/1234567
Fatal: browserType.launch: Executable doesn't exist at
  /opt/pw-browsers/chromium_headless_shell-1228/...
Please run: npx playwright install
```

## Verified vs. inferred

| Claim | Status | Source |
|---|---|---|
| 30,369 companies in mapped CSV; 1,557 with H-1B fields | Verified | direct script output |
| 219 rows match target industry + Series A-C + role-keyword filter | Verified | new filter script, ran clean |
| Intel Corp row tagged `Series B`, $35M Form D, 2025-03-18 | Verified | confirmed present via `grep` on raw CSV, not a script artifact |
| Intel is not actually an early-stage company | Inferred (general knowledge, not from this dataset) — the dataset cannot confirm or deny public-company status at all |
| Arista/Pure Storage/Docusign roles score Apply (0.44-0.48) | Verified arithmetic given the inputs; the *inputs themselves* (`fit`, `liveness`) are `model-judgment`/`assumed-not-verified`, not verified facts |
| These roles have live postings right now | **Not verified** — liveness gate never cleared in this environment |
| 0% skip rate reflects a working pipeline on real, unfiltered data | **Not established** — the fixture was hand-built from the filter's own top rows, so it's structurally biased toward Apply |

## Attestation

- Recipe: case-backend-infra-sponsor-triage v0.1.0
- By: Sid · 2026-07-06

### Tested

| Ran | Saw | Expected |
|---|---|---|
| `npm run verify` | conformance + manifest check both pass | pass |
| `python3 scripts/sec/validate-h1b-join-sample.py` | real audit file, 1,557/30,369 rows with H-1B data | some non-trivial subset with data |
| `python3 scripts/h1b/backend-distributed-systems-filter.py` | 219 matched rows, ranked table | a shortlist smaller than 1,557 |
| `npm run score -- data/examples/sid-backend-ds-roles.json` | Apply 3 · Consider 1 · Skip 0 | expected some Apply, wasn't sure skip would be 0 |
| **Deliberate break attempt:** grepped the raw CSV for the Intel row the filter surfaced, to see if `Series B` was a script bug or real data | Confirmed real — Intel's actual row in the source CSV, not introduced by the filter | expected a script bug; found a data bug instead, which is more useful to know |

### Did not test

- `npm run ats:scan` / `npm run ats:liveness` against a real, unrestricted network — blocked in this build environment (network allowlist + missing Playwright browser). This is the single largest gap: nothing in this run should be treated as "these are live postings."
- The BLS/O*NET role-quality feed — not wired into the composite yet (`role_quality` weight is 0, per Ch.11's own unpinned default).
- The filter and scorer against a large, unfiltered, non-curated batch — the 0% skip rate above is not evidence the pipeline discriminates well; it only proves the arithmetic runs.

### Broke during testing, fixed

- Nothing broke in the scripts themselves. What "broke" was an assumption: the funding-stage field, which the filter treats as a straightforward proxy for company maturity, produced a Series-B tag for Intel Corp. Fix applied: the mode file now names a public-company cross-check as a required proposed addition ([TODO: DEV]) rather than silently trusting the field, and the fixture includes the Intel row with a documented `override` showing how a human should flag it rather than let the scorer's composite (0.457, above the Apply threshold) stand unexamined.

## Reflection

**What went well:** every step that touches only local, already-shipped data
ran cleanly on the first or second try, and the new filter script surfaced a
real, checkable data-quality defect rather than a hypothetical one — which
is a stronger result than a clean run would have been. The scorer's own
skip-rate warning ("below the ~50% a healthy run skips") caught the fixture
bias without me having to notice it myself, which is exactly the kind of
machine-conformance check SNICKERDOODLE.md describes.

**What the mode got wrong or missed:** the live half of the pipeline
(ATS scan + liveness) never actually ran, so this mode, as exercised today,
cannot back a real "Apply" decision — only a "worth checking manually"
shortlist. I also built the 5-role fixture from the filter's own top
matches, which inflates the apply rate; a real test needs a batch the mode
did not help select.

**Next steps:** run `ats:scan`/`ats:liveness` on a machine with normal
network access and `npx playwright install`; build the public-company
cross-check so Intel-style rows stop entering the funding-stage filter at
all; and replace the hand-typed `timeline.factor` with an actual STEM-OPT
date calculation before trusting this for a real application decision.
