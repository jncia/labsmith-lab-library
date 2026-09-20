# Review — ospf-multi-area-abr-3n

Generated for the course owner. Decision first: what this run produced, then what deserves a look, then the text itself.

## Decision

- Outcome: qualified
- Cost, interface-equivalent: 0.46
- Wall clock: 25 min
- Models: sonnet
- Run: `a09193q1`
- Qualification: passed, receipt `ospf-multi-area-abr-3n-2026-09-19-6ebbe6bf8920`

## What it teaches

Configure a multi-area OSPF network with an area border router and confirm inter-area routes in the routing tables.

- Objectives: `C04-C04V01`, `C04-C04V04`
- Topics: `OSPF areas`, `ABR`, `inter-area routes`

## Stages

### Stage 1 — Join the access router in area 1

- Identifier: `stage1`
- Checks: `s1-access-core-lo` (route-exists), `s1-access-core-link` (route-exists), `s1-ping` (ping)
- Reference solution touches: abr, access

### Stage 2 — Advertise the access loopback across the border

- Identifier: `stage2`
- Checks: `s2-abr-access-lo` (route-exists), `s2-core-access-lo` (route-exists), `s2-ping` (ping)
- Reference solution touches: access

## Flags

None.

## Files

- Workbook: `../workbook.md`
- Answers: `../solutions.md`
- Metadata and receipts: `../lab.yaml`
- Exercise of record: `exercise.json`
- Run record: `run-record.json`
