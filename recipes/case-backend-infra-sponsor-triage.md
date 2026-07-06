---
status: RUNNABLE-SAMPLE
todos_open: 2
last_gate: "sample-run, 2026-07-06, logs/RUN_LOG.md#2026-07-06"
attestation: null
recipe_version: 0.1.0
---

# Backend / Distributed-Systems Sponsor Triage — Manufacturing, Fintech, Enterprise IT

## Purpose

Triages backend/distributed-systems engineering roles for an international MS
student (STEM OPT eligible, current employer sponsorship not guaranteed
long-term) targeting three sectors — manufacturing/semiconductor,
fintech/financial services, and enterprise IT/data infrastructure — at
Series A-C private companies or established/public companies. It combines
local H-1B/Form D evidence, ATS liveness, and the Ch.11 Bayesian role scorer
to cut a long company list down to a short one worth spending OPT-clock time
on, and it exposes a real defect in the underlying data (below) that a triage
mode must not silently paper over.

**Use it when:** you have 10-100 candidate companies/roles and want to know,
before writing a single application, which are (a) plausible H-1B sponsors,
(b) still hiring for a live posting, and (c) worth the fit-vs-timeline
trade-off — and which should be skipped outright.

## Source Inventory

| Source | Path / Command | Status |
|---|---|---|
| SEC Form D × DOL/H-1B mapped companies | `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` | Real, local, verified — 30,369 companies, 1,557 with H-1B fields populated |
| H-1B join validation audit | `python3 scripts/sec/validate-h1b-join-sample.py` | Real script, ran successfully (see Worked Run) |
| Domain role/industry/stage filter | `python3 scripts/h1b/backend-distributed-systems-filter.py --csv <csv> --out <md>` | **New script, written for this mode, ran successfully** (see Worked Run) |
| Bayesian role scorer | `npm run score -- <roles.json>` | Real script, ran successfully against a domain-specific fixture (see Worked Run) |
| ATS provider scan | `npm run ats:scan -- --dry-run` (with `data/ats/portals.yml` configured to target list) | Real script, ran live against Pure Storage + Databricks (Greenhouse). First run against literal-substring location filter had a 100% false-negative rate on US roles; root-caused and fixed with a US-state allow-list. Validated: 73 US-based backend/infra postings surfaced, zero non-US leakage after fix. Not yet tested against Lever/Ashby location formats. |
| ATS posting liveness | `npm run ats:liveness -- <job-url>` | Real script, ran live. One URL (Pure Storage, Linux Kernel Development role) manually verified as active. Not yet run at batch scale via `scan.mjs --verify` — see gate 4. |
| BLS/O*NET role-quality data | `data/bls/`, `python3 scripts/bls/extract-soc-occupation-table.py` | Present in repo; not exercised in this run — currently `role_quality` weight is `0` (`[VERIFY]`, unpinned by Ch.11), so it does not affect the composite yet. |

## Proposed Additions

1. **Public-company cross-check** — `[TODO: DEV]` `scripts/sec/public-company-flag.py`. The mapped CSV is sourced entirely from **SEC Form D**, which by definition covers *private* securities offerings. It has **no field that identifies a publicly traded company**, so today this mode cannot address Sid's "public/established company" target segment at all, and worse, it can actively mislabel one (see the Intel finding in the Worked Run). Proposed: join against a small local ticker/CIK list (SEC EDGAR company_tickers.json, cached once, no per-run network call) and add a `is_public: bool` field so public companies are excluded from private-funding-stage filtering rather than mis-tagged.
2. **STEM OPT / H-1B timeline gate** — `[TODO: DEFINE]` exact input schema. Today `timeline.factor` in the scorer is a manual `your-input` float (0-1) with no connection to a real calendar. Proposed: a small script that takes graduation date + STEM OPT extension rules and outputs a `timeline.factor` and a hard `stop_after` date, so the "visa timeline is a gate, not a vote" principle (DOMAIN.md) is actually enforced by a script instead of a hand-typed number.

## Phase Gates

1. **Environment gate.** `npm run verify && npm run doctor` exit 0. *(Cleared 2026-07-06.)*
2. **Data-shape gate.** Filter and scorer outputs parse as valid JSON/Markdown and match the schema documented below. *(Cleared — see Worked Run.)*
3. **Sponsorship-evidence gate.** A role only proceeds to scoring if it has a non-null `Total Approvals` row in the mapped CSV *or* is explicitly logged as `sponsorship.p: 0` with `source: record`. Roles with no H-1B row at all are `Consider`, never `Apply`, until a human checks manually.
4. **Liveness gate (hard stop, not a vote).** A role cannot be marked `Apply` on the strength of this mode's output alone until `ats:liveness` has actually been run against its posting URL on a machine with real network access. In this run, every "Apply" recommendation carries `liveness.source: assumed-not-verified` — **that is a flag, not a pass.**
5. **Public-company sanity gate.** Before trusting any `latest_funding_stage` value for a company you recognize as large/public, cross-check manually. This gate exists *because* of the Intel finding below, not hypothetically.
6. **Report gate.** Agent log (`logs/case-backend-infra-sponsor-triage-2026-07-06.json`) and human report (`reports/generated/backend-distributed-systems-filter.md` + `data/examples/role-scores.md`) both exist and were read by a human before any application decision.

## What This Mode Can Verify

- Whether a company has *any* recorded H-1B approval history in the local mapped CSV, and roughly how much (approvals, approval rate, median salary).
- Whether a company's mapped industry and (private) funding stage match Sid's target sectors/stages.
- Whether a set of role titles, scored through the Ch.11 combiner with declared sponsorship/fit/liveness/timeline inputs, composite to Apply/Consider/Skip, with every term labeled by source.
- That the underlying CSV join has known, quantified gaps (94.9% of mapped companies have no H-1B fields at all).

## What This Mode Cannot Verify (yet)

- **Whether a company is currently, actually hiring for a live posting** — that requires the ATS scan/liveness scripts to run with real network access, which this build environment does not have. Every score in this run is provisional on that gate.
- **Whether a company is publicly traded** — the data source structurally cannot say this (Form D only). Confirmed by the Intel Corp finding.
- **Whether "Manufacturing"/"Computers"/"Other Technology" in this CSV actually means semiconductor** — the dataset has no semiconductor-specific industry tag; "Manufacturing" is the closest proxy and will include non-semiconductor manufacturers.
- **STEM OPT/H-1B timeline compatibility** — currently a manually typed number, not derived from an actual date. See Proposed Addition #2.
- **Match correctness between the DOL/LCA source and the SEC side of the join** — the repo has no raw LCA employer names or match-method metadata locally (confirmed by running `validate-h1b-join-sample.py`), so entity-resolution false positives cannot be measured, only sampled for manual review.

## Output Contract

### Agent log
File: `logs/case-backend-infra-sponsor-triage-[DATE].json`
Fields: `run_id`, `mode` (`sample`|`live`), `csv_source`, `rows_scanned`, `rows_with_h1b`, `rows_matched`, `filter_params`, `scorer_input_path`, `scorer_summary` (apply/consider/skip counts, skip_rate), `flags` (e.g. `intel_funding_stage_suspect`), `gates_cleared`, `gates_pending`, `generated_at`.

### Human report
File: `reports/generated/backend-distributed-systems-filter.md` (candidate table) + `data/examples/role-scores.md` (scored shortlist)
Reader: Sid, before deciding where to actually spend application effort.
Sections: filter parameters used, candidate table (company/industry/stage/approvals/titles), scored shortlist with per-term audit trace, flagged data-quality issues, what still needs a manual/live check before acting.

## Stop Conditions

- Stop before marking anything `Apply` in a human-facing way if `liveness.source` is not `record` — i.e., if the actual `ats:liveness` gate hasn't been cleared on a real network.
- Stop if `latest_funding_stage` is being used to reason about a company's size/maturity without a public-company cross-check (see Proposed Addition #1) — the Intel row proves this field can be wrong for exactly the companies a triage is most likely to weight heavily.
- Stop if the skip rate on a real (non-curated) batch is near 0% — per DOMAIN.md, "a healthy run skips at least half of evaluated roles"; a 0% skip rate on the sample run below is a known artifact of an already-pre-filtered fixture, not evidence the pipeline works on unfiltered input.
- Stop and mark `Consider`, never `Apply`, for any company with zero rows in the H-1B-mapped subset — absence of a sponsorship record is not evidence of no sponsorship, only evidence of no data.

## RUN_LOG Template

```
## [DATE] -- case-backend-infra-sponsor-triage sample run

- **Recipe:** case-backend-infra-sponsor-triage v0.1.0, mode: sample
- **Command(s):** <verbatim commands>
- **Inputs:** <csv path / roles.json path>
- **Gates:** 1 Env ✓ · 2 Data-shape ✓ · 3 Sponsorship-evidence ✓ · 4 Liveness [pending/cleared] · 5 Public-company sanity [pending/cleared] · 6 Report ✓
- **Result:** <apply/consider/skip counts, skip rate>
- **Flags:** <e.g. suspect funding_stage rows>
- **Open:** <what's still unverified>
```
