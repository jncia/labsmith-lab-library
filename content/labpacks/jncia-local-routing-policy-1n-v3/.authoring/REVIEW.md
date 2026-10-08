# Review — jncia-local-routing-policy-1n-v3

Generated for the course owner. Decision first: what this run produced, then what deserves a look, then the text itself.

## Decision

- Outcome: qualified
- Cost, interface-equivalent: 0.80
- Wall clock: 26 min
- Models: claude-sonnet-5-5
- Run: `a1008o12`
- Qualification: passed, receipt `jncia-local-routing-policy-1n-v3-2026-10-08-b7f4bbac9fba`

## What it teaches

Verify exact 192.0.2.2/24 on ge-0/0/0.0 directly from operational interface state and its measured Direct subnet route, distinguish static discard and reject actions, and use routing policy to activate an approved aggregate while retaining an unwanted aggregate as hidden rather than installed.

- Objectives: `OBJ-1-5`, `OBJ-5-1`, `OBJ-5-4`, `OBJ-6-2`, `OBJ-6-6`, `OBJ-7-3`, `OBJ-7-4`, `OBJ-7-5`, `OBJ-7-6`
- Topics: `interface and loopback addressing`, `static discard and reject routes`, `routing policy terms`, `aggregate contributor policy`, `active and hidden route views`, `operational verification`

## Stages

### Stage 1 — Establish the exact local service endpoint

- Identifier: `s1`
- Checks: `s1-if` (state-match), `s1-rt` (route-exists), `s1-ping` (ping)
- Reference solution touches: r1

### Stage 2 — Represent the two planned networks

- Identifier: `s2`
- Checks: `s2-d-rt` (state-match), `s2-r-rt` (state-match), `s2-d-fw` (forwarding-table-entry), `s2-r-fw` (forwarding-table-entry)
- Reference solution touches: r1

### Stage 3 — Distinguish rejected contribution from route deletion

- Identifier: `s3`
- Checks: `s3-agg` (state-match), `s3-hid` (state-match), `s3-ord` (state-match)
- Reference solution touches: r1

## Notes

- Discrimination: the checks did not notice the removal of 1 of 8 statements of the reference solution.
- Unnoticed: `s3` r1 statement 5.
- Some statements are legitimately unnoticed -- a description, a redundant line, a defensive one -- so this is something to look at, not something to fix.
- Also: 0 statement(s) the device would not remove on their own, 1 line(s) that are not plain set statements, 0 left out by the statement cap.

## Flags

- `repaired` — 1 repair session(s) were needed before the rehearsal held.

## Files

- Workbook: `../workbook.md`
- Answers: `../solutions.md`
- Metadata and receipts: `../lab.yaml`
- Exercise of record: `exercise.json`
- Run record: `run-record.json`
