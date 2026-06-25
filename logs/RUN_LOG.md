# RUN_LOG.md

## Setup Exercise — Your Search's Personal Layer (2026-06-25)

### What was built
Three files in `search/`:
- `resume.json` — structured, typed records extracted from my resume, then attested.
- `profile.yml` — target role, F-1/STEM-OPT visa constraints, sponsorship gate, geography, industry.
- `gaps.md` — evidence-grounded delta between my attested record and a backend/distributed-systems target (SOC 15-1252).

### The three attestation errors caught in resume.json
1. **Teradyne work mislabeled as "backend."** The import described it as "event-driven backend system components in C#." My actual work was a mix of UI components (WPF) and API integration — the extraction dropped the UI half to fit a cleaner backend-engineer narrative. Corrected.
2. **Invented metric "fault tolerance by 35%."** Fault tolerance is not a measurable percentage; the figure was fabricated to sound concrete. Removed and re-stated qualitatively.
3. **Solo ownership implied on team projects.** MedSignal (and PE Org-AI-R) read as solo work ("Built," "Owned"). Both were team projects; corrected role to "team — contributor" and softened ownership language.

### Top gap from gaps.md
**Go (Golang).** Backend/distributed-systems postings consistently require strong Golang/concurrency proficiency (Glassdoor, golangprojects, Wellfound); my stack is Java/Python/C# with no Go. Plan: ship an open-source Go service with benchmarks, then add it to resume.json.

### Row killed and why
**Row 5 — Demonstrated system design at scale.** Killed because the agent missed evidence I already hold: MedSignal's 16M-record Spark Structured Streaming pipeline in resume.json already demonstrates scale design. It's a false gap — evidence the extraction failed to credit, not a real delta.

### profile.yml field corrected from the agent's first draft
The agent left `industry.sectors` empty (no filter). Corrected to my actual targets: manufacturing/semiconductor, fintech/financial services, enterprise IT/data infrastructure. Also confirmed the sponsorship gate (`required: true`) and that STEM eligibility is DSO-confirmed, not assumed.

---

## Verification check (Step 4)

**resume.json — is every entry traceable to something verifiable?**
Mostly yes after correction, but not fully. Several percentage metrics (e.g. throughput/latency improvements) I retained because I can plausibly reconstruct them from profiling/benchmarks, but they are not externally attested — I have flagged the file's `verifiable` fields as "unverified" where that is true rather than asserting confidence I don't have. The one metric I could not defend at all ("fault tolerance 35%") was removed, not kept.

**profile.yml — does the visa section reflect actual documents?**
STEM eligibility is marked `true` because my DSO confirmed it — not a hope. `authorization_end_date` is left `null` because my OPT EAD has not been issued yet; I did not invent a date. Unemployment days used = 0 (OPT not started). This reflects documents/known status, not a hoped-for timeline.

**gaps.md — does every gap cite something real?**
Yes. Each surviving gap cites a job posting or O*NET requirement (Glassdoor Go postings, devsdata distributed-systems hiring guide, O*NET 15-1252 Job Zone 4), not the agent's training-data inference. The one row sourced weakly to my own already-existing evidence was killed rather than kept as an invented demand signal.
