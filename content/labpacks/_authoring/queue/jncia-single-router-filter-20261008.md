# Queue jncia-single-router-filter-20261008

0 of 1 briefs are waiting for a decision.

Planned from JNCIA-Junos (JN0-106), source official-blueprint.json
Planned at 2026-10-08T22:32:26.422091+00:00 by owner-seed
Planned with this note: Different-family attempt after first packet jncia-local-routing-policy-1n-v3 passed complete native qualification and meaning review. Receipt b7f4bbac9fba, source a455, approved published prose-only review preserves behavioral content and raw outputs. Same native loop, Sonnet model, prompts, check vocabulary and qualifier; no packet configuration/check edits.

## Counts

By decision: approved 1
By lab type: build 1
By objective: OBJ-5-1 1, OBJ-5-4 1, OBJ-7-10 1, OBJ-7-7 1, OBJ-7-8 1, OBJ-7-9 1

## Briefs

### jncia-loopback-filter-1n · build · 1 nodes · 2 stages · OBJ-5-1, OBJ-5-4, OBJ-7-7, OBJ-7-8, OBJ-7-9, OBJ-7-10

Status: approved, priority 10
First model pinned to claude-sonnet-5-5
Note: Approved after jncia-local-routing-policy-1n-v3 receipt b7f4bbac9fba passed all native runs and clean teardown; reviewed prose preserves configs/checks/captured blocks and hash. Different family, same source/model/prompts/tools/qualifier. Engineer must demonstrate self-ping filter traversal or park; no hand configuration/check repair.
Outcome: Use ordered firewall-filter terms and precise ICMP destination matches to permit all three probes to two local services and receive no replies from a third, while preserving every local address, its route and diagnostics.
Why: This exercise teaches local ICMP filter matches, ordered terms and packet effects, with no filter-counter goal because current stable checks cannot assert it. The engineer must measure actual self-originated lo0 filter traversal; if bypassed, park. Existing ping checks use count 3 and rate 1 for allowed/diagnostic outcomes. Zero replies require count 3, negate true and a small positive min_success_rate such as 0.01, so partial loss cannot satisfy denial. Keep all address/route, port and diagnostic checks in baseline.

    python -m labsmith.learner_labpack.authoring approve --queue content/labpacks/_authoring/queue/jncia-single-router-filter-20261008.yaml --approve jncia-loopback-filter-1n
