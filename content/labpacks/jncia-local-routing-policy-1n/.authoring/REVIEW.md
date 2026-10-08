# Review — jncia-local-routing-policy-1n

Generated for the course owner. Decision first: what this run produced, then what deserves a look, then the text itself.

## Decision

- Outcome: qualified
- Cost, interface-equivalent: 0.49
- Wall clock: 22 min
- Models: claude-sonnet-5-5
- Run: `a1008ccn`
- Qualification: passed, receipt `jncia-local-routing-policy-1n-2026-10-08-d1b4a9732ab9`

## What it teaches

Configure and verify a router-local endpoint, distinguish static discard and reject next hops in the routing table, and demonstrate how ordered routing-policy terms admit one contributor and exclude another without removing the component routes.

- Objectives: `OBJ-1-5`, `OBJ-5-1`, `OBJ-5-4`, `OBJ-6-2`, `OBJ-6-6`, `OBJ-7-3`, `OBJ-7-4`, `OBJ-7-5`, `OBJ-7-6`
- Topics: `loopback addressing`, `static discard and reject routes`, `routing policy terms`, `aggregate contributor policy`, `operational verification`

## Stages

### Stage 1 — Establish the local service endpoint

- Identifier: `s1`
- Checks: `s1-route` (route-exists), `s1-ping` (ping)
- Reference solution touches: r1

### Stage 2 — Represent the two planned networks

- Identifier: `s2`
- Checks: `s2-disc` (forwarding-table-entry), `s2-rej` (forwarding-table-entry), `s2-r1` (route-exists), `s2-r2` (route-exists)
- Reference solution touches: r1

### Stage 3 — Admit only the approved contributor

- Identifier: `s3`
- Checks: `s3-agg` (route-exists), `s3-noagg` (route-exists)
- Reference solution touches: r1

## Notes

- Discrimination: the checks did not notice the removal of 1 of 8 statements of the reference solution.
- Unnoticed: `s3` r1 statement 5.
- Some statements are legitimately unnoticed -- a description, a redundant line, a defensive one -- so this is something to look at, not something to fix.
- Also: 0 statement(s) the device would not remove on their own, 1 line(s) that are not plain set statements, 0 left out by the statement cap.

## Flags

None.

## Files

- Workbook: `../workbook.md`
- Answers: `../solutions.md`
- Metadata and receipts: `../lab.yaml`
- Exercise of record: `exercise.json`
- Run record: `run-record.json`
