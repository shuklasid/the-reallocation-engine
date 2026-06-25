# search/gaps.md

Delta between attested `resume.json` and the target role in `profile.yml`
(Backend / distributed-systems engineer, SOC 15-1252).

Every gap below cites a checkable source: a posting, an O*NET requirement, or a
pattern across postings. A gap with no evidence is a feeling, not a finding —
those go in `private-notes.md`.

| # | Gap | Evidence the target demands it | What I have | Plan to close it (verifiable condition) |
|---|-----|-------------------------------|-------------|------------------------------------------|
| 1 | **Go (Golang)** | Glassdoor Go/distributed-systems postings require "strong proficiency in Golang, concurrency models," 3–7+ yrs; Wellfound listing "Backend Engineer \| Go / Java / Python \| Kafka \| gRPC"; golangprojects distributed-systems board is Go-dominated. | Java, Python, C#, JavaScript, SQL. **No Go.** | Port one MedSignal service component to Go with a goroutine-based concurrent pipeline; open-source it with README + benchmarks. **Closes when:** public repo exists and a new `resume.json` entry is added. |
| 2 | **gRPC / typed inter-service RPC** | devsdata hiring guide lists gRPC for inter-service communication; Glassdoor postings: "Knowledge of RESTful APIs, gRPC, or other communication protocols." | REST API contracts, Kafka async messaging. **No gRPC / protobuf.** | Convert one service boundary in an existing project to gRPC with protobuf contracts; document a latency comparison vs the REST version. **Closes when:** committed, benchmarked, written up. |
| 3 | **Distributed consensus / consistency (Raft, CAP, partitions)** | devsdata: roles require "distributed consensus (Raft/Paxos)"; system-design interviews probe "partitions, network reliability, data consistency (CAP theorem)." | Kafka decoupling, microservices. **No consensus/replication artifact; no demonstrated CAP-tradeoff reasoning.** | Implement a minimal Raft (leader election + log replication) or make a reviewed contribution to an existing one; publish a writeup. **Closes when:** working implementation + writeup are public. |
| 4 | **Seniority / years-of-experience signal** | O*NET 15-1252 is Job Zone 4 ("several years of work-related experience" typical); 4dayweek.io notes senior+ dominate distributed-systems listings; Go postings cite 3–7 yrs. | I'm ~2.5 years in (IDFC) plus a 6-month Teradyne co-op, with an MS finishing Aug 2026 — early-career, not senior. | I'm not going to pretend to senior depth I don't have. Instead I'll target early-career / new-grad+ backend bands at established companies where the experience bar is realistic, and let two shipped distributed-systems projects (a Go service and a gRPC migration) carry the weight the years don't yet. **Closes when:** profile target band is corrected AND both artifacts are public. |

---

## Edits made to this draft

**Row killed — Row 5 (Demonstrated system design at scale).**
Reason: The agent missed evidence I already hold. MedSignal's 16M-record Spark
Structured Streaming pipeline in `resume.json` already demonstrates scale design
and tradeoff reasoning, so this isn't a gap — it's evidence the extraction
failed to credit as evidence. Removing it.

**Row rewritten in my own words — Row 4 (seniority).**
The original was the agent's generic "time-based, partly closeable" framing.
Rewritten above to reflect my actual positioning decision: target early-career
bands rather than overclaim seniority, and let shipped artifacts compensate.

<!-- KILLED ROW (preserved for the record):
| 5 | Demonstrated system design at scale | devsdata: system-design interviews on "a geo-replicated key-value store," "a global chat service" | Built microservices; MedSignal processed 16M+ records via Spark | Publish an architecture deep-dive on the MedSignal pipeline |
Reason killed: MedSignal's 16M-record pipeline in resume.json already IS this evidence — false gap.
-->
