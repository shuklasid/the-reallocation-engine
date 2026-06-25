# AI Use Disclosure

**Assignment:** Setup Exercise — Your Search's Personal Layer (INFO 7375)
**Date:** 2026-06-25

## What AI was used for
An AI agent (Claude) was used to:
- Extract my resume PDF into structured `resume.json` with typed fields.
- Draft `profile.yml` from my intake answers (target role, geography, visa, sponsorship, industry).
- Research and draft the `gaps.md` evidence table, sourcing each gap to real job postings and O*NET 15-1252 requirements.
- Format the RUN_LOG.md entry and this disclosure from facts I supplied.

## What I did (not the AI)
- Ran the attestation pass: identified and corrected the three real errors in `resume.json` based on knowledge of my own work the agent did not have.
- Decided which gap row to kill and wrote the reason.
- Rewrote the seniority gap row in my own framing.
- Supplied the factual inputs the agent could not know: that my Teradyne work was UI + API (not backend), that MedSignal and PE Org-AI-R were team projects, which metrics were unverifiable, my industry targets, and my DSO-confirmed STEM status.

## What the AI could not do (specific instance)
The agent extracted my Teradyne role as "event-driven **backend** system components in C#." That was confident and fluent — and wrong. My actual work there was a **mix of WPF UI components and API integration**, not backend. The agent had no way to know this; the resume text alone read as backend, and it smoothed it into the cleaner backend-engineer narrative. Only my direct knowledge of what I built caught it. This is the exact failure mode the course targets: fluent output that is wrong about a situation the model cannot see into. The same applied to its assumption that MedSignal was solo work — it was a team project, and only I could correct the implied ownership.
