# Review — jncia-loopback-filter-1n

Generated for the course owner. Decision first: what this run produced, then what deserves a look, then the text itself.

## Decision

- Outcome: qualified
- Cost, interface-equivalent: 0.32
- Wall clock: 20 min
- Models: claude-sonnet-5-5
- Run: `a10087ur`
- Qualification: passed, receipt `jncia-loopback-filter-1n-2026-10-09-d7b372f7d14e`

## What it teaches

Use ordered firewall-filter terms and precise ICMP destination matches to permit all three probes to two local services and receive no replies from a third, while preserving every local address, its route and diagnostics.

- Objectives: `OBJ-5-1`, `OBJ-5-4`, `OBJ-7-7`, `OBJ-7-8`, `OBJ-7-9`, `OBJ-7-10`
- Topics: `loopback firewall filtering`, `filter term order`, `ICMP match criteria`, `accept and discard actions`, `operational verification`

## Stages

### Stage 1 — Restore the first service

- Identifier: `s1`
- Checks: `s1-10` (ping)
- Reference solution touches: r1

### Stage 2 — Complete the service access policy

- Identifier: `s2`
- Checks: `s2-20` (ping), `s2-30` (ping)
- Reference solution touches: r1

## Notes

- Discrimination: the checks noticed the removal of every one of the 1 statements measured.
- Also: 0 statement(s) the device would not remove on their own, 2 line(s) that are not plain set statements, 0 left out by the statement cap.

## Flags

None.

## Files

- Workbook: `../workbook.md`
- Answers: `../solutions.md`
- Metadata and receipts: `../lab.yaml`
- Exercise of record: `exercise.json`
- Run record: `run-record.json`
