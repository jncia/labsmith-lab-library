# Queue jncia-single-router-filter-v2-20261008

0 of 1 briefs are waiting for a decision.

Planned from JNCIA-Junos (JN0-106), source official-blueprint.json
Planned at 2026-10-09T00:21:24.215977+00:00 by owner-seed
Planned with this note: Additive native re-authoring after a10087ur passed four runs and discrimination with all cleanup clean. Preserve its packet, receipt, raw captures and branch. Learner review withheld acceptance because endpoint guards did not prove lo0.0 placement. Same source a455, model, prompts, qualifier and objective family; only the authoring brief clarifies the missing observable constraint.

## Counts

By decision: approved 1
By lab type: build 1
By objective: OBJ-5-1 1, OBJ-5-4 1, OBJ-7-10 1, OBJ-7-7 1, OBJ-7-8 1, OBJ-7-9 1

## Briefs

### jncia-loopback-filter-1n-v2 · build · 1 nodes · 2 stages · OBJ-5-1, OBJ-5-4, OBJ-7-7, OBJ-7-8, OBJ-7-9, OBJ-7-10

Status: approved, priority 10
First model pinned to claude-sonnet-5-5
Note: Approved within the existing two-topic task. Prior run qualified and was not parked; retain its immutable evidence. Engineer must capture all native lo0.0 inet rows and define independent generic state-match guards using observed fields. No hand-written packet checks/configurations, no new check type. Park rather than bypass unsupported observations or filter traversal.
Outcome: Use ordered ICMP filter terms to allow all three probes to two local services and give zero replies from a third, while independently proving each of the four addresses remains on lo0.0, its Direct host route remains, and diagnostics stay reachable.
Why: This teaches local ICMP matches, term order and packet effects. Measure genuine self-originated lo0 traversal or park. Capture all four live lo0.0 inet address rows, then use generic state-match with its existing interface-address record to select each independently; use observed fields, not assumed prefix suffixes or destination values. Baseline also retains four Direct /32 routes, both ports and diagnostic ping. Allows use count 3, rate 1; denial uses count 3, negate true and rate 0.01. All guards persist through both stages; no new check type or counter goal.

    python -m labsmith.learner_labpack.authoring approve --queue content/labpacks/_authoring/queue/jncia-single-router-filter-v2-20261008.yaml --approve jncia-loopback-filter-1n-v2
