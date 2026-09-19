# Review — interior-routing-core-3n

Generated for the course owner. Decision first: what this run produced, then what deserves a look, then the text itself.

## Decision

- Outcome: qualified
- Cost, interface-equivalent: 0.52
- Wall clock: 26 min
- Models: sonnet
- Run: `a0919uk0`
- Qualification: passed, receipt `interior-routing-core-3n-2026-09-19-a0a89a1c3f5c`

## What it teaches

The learner can bring a set of directly connected routers into one link-state routing area, confirm from the routing table that the protocol itself installed the routes, and confirm that the two ends of the path can reach each other loopback to loopback.

- Objectives: `BP-LINK-STATE-AREA`, `BP-LOOPBACK-REACHABILITY`
- Topics: `Interior routing`, `Link-state protocol`, `Loopback reachability`

## Stages

### Stage 1 — Bring up the routing area

- Identifier: `s1`
- Checks: `s1-r1-link23` (route-exists), `s1-r3-link12` (route-exists)
- Reference solution touches: r1, r2, r3

### Stage 2 — Prove end-to-end reachability

- Identifier: `s2`
- Checks: `s2-r1-lo2` (route-exists), `s2-r1-lo3` (route-exists), `s2-r3-lo1` (route-exists), `s2-r1-ping` (ping), `s2-r3-ping` (ping)
- Reference solution touches: r1, r2, r3

## Flags

- `wide-stage-solution` — 2 stage(s) change more than 2 nodes at once.

## Files

- Workbook: `../workbook.md`
- Answers: `../solutions.md`
- Metadata and receipts: `../lab.yaml`
- Exercise of record: `exercise.json`
- Run record: `run-record.json`
