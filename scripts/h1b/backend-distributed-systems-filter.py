#!/usr/bin/env python3
"""Filter the local SEC/H-1B mapped CSV for backend / distributed-systems roles
at companies in target industries and target funding stages.

Domain: international MS grad (STEM OPT), backend/distributed-systems engineer,
targeting manufacturing/semiconductor, fintech, and enterprise IT/data-infra
employers at Series A-C funding stage (this dataset cannot identify public
companies -- see README note below).

Usage:
    python3 scripts/h1b/backend-distributed-systems-filter.py \
        --csv data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv \
        --out reports/generated/backend-distributed-systems-filter.md
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

TARGET_INDUSTRIES = {
    "Manufacturing",
    "Computers",
    "Other Technology",
    "Other Banking and Financial Services",
}

TARGET_STAGES = {"Series A", "Series B", "Series C"}

ROLE_KEYWORDS = [
    "backend", "back-end", "back end",
    "distributed", "platform", "infrastructure",
    "site reliability", "sre", "systems engineer",
    "software engineer", "data engineer",
]


def matches_role(title_field: str) -> bool:
    t = (title_field or "").lower()
    return any(k in t for k in ROLE_KEYWORDS)


def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--min-approvals", type=float, default=2.0)
    args = ap.parse_args()

    rows_seen = 0
    rows_with_h1b = 0
    matched = []

    with open(args.csv, encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows_seen += 1
            approvals = to_float(row.get("Total Approvals"))
            if approvals is None:
                continue
            rows_with_h1b += 1

            if row.get("industry") not in TARGET_INDUSTRIES:
                continue
            if row.get("latest_funding_stage") not in TARGET_STAGES:
                continue
            if approvals < args.min_approvals:
                continue
            if not matches_role(row.get("top_job_titles_sponsored", "")):
                continue

            matched.append(row)

    matched.sort(key=lambda r: to_float(r.get("Total Approvals")) or 0, reverse=True)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# Backend / Distributed-Systems H-1B Sponsor Filter\n\n")
        f.write("**Source (verified, local):** `%s`\n\n" % args.csv)
        f.write(
            "**Filter (verified, deterministic):** industry in %s; "
            "funding stage in %s; Total Approvals >= %s; "
            "top_job_titles_sponsored contains one of %s\n\n"
            % (sorted(TARGET_INDUSTRIES), sorted(TARGET_STAGES), args.min_approvals, ROLE_KEYWORDS)
        )
        f.write("**Known dataset limitation (verified by inspection):** this CSV is "
                "sourced from SEC Form D, which covers private securities offerings only. "
                "It contains no field that identifies publicly traded companies, so this "
                "filter cannot include Sid's \"public/established company\" target segment -- "
                "that requires a separate data source (e.g. an equities/EDGAR 10-K feed), "
                "logged as a [TODO: DATA SOURCE] in the mode file.\n\n")
        f.write(f"Rows scanned: {rows_seen} | Rows with any H-1B data: {rows_with_h1b} | "
                f"Rows matching all filters: {len(matched)}\n\n")
        f.write("| Company | Industry | Funding Stage | Approvals | Approval Rate | Median Salary | Sponsored Titles (raw) |\n")
        f.write("|---|---|---|---|---|---|---|\n")
        for r in matched[:40]:
            f.write(
                "| {company_name} | {industry} | {latest_funding_stage} | {approvals} | {rate} | {salary} | {titles} |\n".format(
                    company_name=r.get("company_name", ""),
                    industry=r.get("industry", ""),
                    latest_funding_stage=r.get("latest_funding_stage", ""),
                    approvals=r.get("Total Approvals", ""),
                    rate=r.get("Approval_Rate", ""),
                    salary=r.get("median_salary_offered", ""),
                    titles=(r.get("top_job_titles_sponsored", "") or "").replace("|", "/")[:120],
                )
            )

    print(f"scanned={rows_seen} with_h1b_data={rows_with_h1b} matched={len(matched)} -> {out_path}")


if __name__ == "__main__":
    main()
