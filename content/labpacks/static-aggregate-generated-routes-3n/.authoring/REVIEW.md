# Review — static-aggregate-generated-routes-3n

Generated for the course owner. Decision first: what this run produced, then what deserves a look, then the text itself.

## Decision

- Outcome: qualified
- Cost, interface-equivalent: 0.75
- Wall clock: 29 min
- Models: sonnet
- Run: `a0919ux7`
- Qualification: passed, receipt `static-aggregate-generated-routes-3n-2026-09-19-5ad1b382e0c9`

## What it teaches

Choose between static, aggregate and generated routes for a given need, and confirm each one in the route table with the right protocol and next hop.

- Objectives: `C03-C03V01`, `C03-C03V06`
- Topics: `static routes`, `aggregate routes`, `generated routes`, `route table`

## Stages

### Stage 1 — Reach the remote subnets

- Identifier: `s1`
- Checks: `s1-r1` (route-exists), `s1-r2` (route-exists), `s1-p1` (ping), `s1-p2` (ping)
- Reference solution touches: branch

### Stage 2 — Summarise for the upstream router

- Identifier: `s2`
- Checks: `s2-hq` (route-exists), `s2-up` (route-exists)
- Reference solution touches: hq

### Stage 3 — Make a conditional default

- Identifier: `s3`
- Checks: `s3-def` (route-exists)
- Reference solution touches: branch

## Flags

None.

## Files

- Workbook: `../workbook.md`
- Answers: `../solutions.md`
- Metadata and receipts: `../lab.yaml`
- Exercise of record: `exercise.json`
- Run record: `run-record.json`
