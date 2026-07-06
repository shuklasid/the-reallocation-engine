# Domain Justification — Backend/Distributed-Systems Sponsor Triage

**Who uses this, exactly:** an international student finishing an MS with a
backend/distributed-systems target, who needs employer-sponsored work
authorization (STEM OPT now, H-1B eventually) and is deciding which of a
long company list — across manufacturing/semiconductor, fintech, and
enterprise IT/data-infrastructure — is actually worth application time,
versus which look promising but are Series A ghost postings, non-sponsors,
or mislabeled by the underlying data.

## Information asymmetry addressed

A student in this position cannot easily see: whether a given company has
*ever* sponsored an H-1B for a role like theirs; whether a "Series B
startup" is actually an early-stage company or a large public one that a
messy join mis-tagged; or whether a job posting that looks live is actually
still being reviewed. Application effort is finite and OPT time is a clock,
not a queue — spending it on companies that will never sponsor, or on dead
postings, is the exact cost this mode is built to cut.

## Connection to engine layers

- **80 Days to Stay:** the mode's core filter runs directly against
  `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv` — H-1B approval
  history joined to SEC Form D funding data.
- **Job-Ops:** the mode is wired to `ats:scan`/`ats:liveness` as the hard
  gate that must clear before any "Apply" recommendation is trusted, per
  the engine's "liveness is a gate, not a vote" principle.
- **Cognitive Pivot:** BLS/O*NET role-quality data exists in the repo but is
  not yet wired into this mode's composite (the scorer's `role_quality`
  weight is currently `0`, unpinned by Ch.11) — named as an explicit gap
  rather than silently ignored.

## Failure modes specific to this domain

1. **Funding-stage mislabeling of large/public companies.** Running the
   mode's own filter surfaced `INTEL CORP` tagged `latest_funding_stage:
   Series B` on a $35M Form D dated 2025-03-18 — verified present in the
   raw CSV, not a script bug. For a student unfamiliar with a specific
   company's actual history (which is common — international students
   often know the big semiconductor/fintech names by reputation, not by
   funding history), this is the hardest version of the error to catch:
   the record *looks* like clean, structured evidence, and the field is
   exactly the one a naive "prioritize early-stage companies" heuristic
   would key off of. Someone who *does* know Intel's history catches it
   instantly; someone newer to the U.S. market may not, and may waste time
   chasing it as a startup, or worse, deprioritize a company that actually
   does sponsor at scale because the tool implied it's tiny and risky.
2. **Absence of data read as absence of sponsorship.** 94.9% of the mapped
   CSV's rows have no H-1B fields populated at all. A student under time
   pressure is likely to read "no data" as "doesn't sponsor" and skip a
   company that may sponsor but simply isn't in this particular join. This
   is hardest to catch for anyone treating the tool's output as a verdict
   rather than a starting point — which is precisely the failure mode a
   sponsorship-triage tool, by its framing, invites.
