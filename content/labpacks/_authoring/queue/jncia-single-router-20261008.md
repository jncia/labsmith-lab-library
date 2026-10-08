# Queue jncia-single-router-20261008

0 of 2 briefs are waiting for a decision.

Planned from JNCIA-Junos (JN0-106), source official-blueprint.json
Planned at 2026-10-08T20:56:00.744284+00:00 by owner-seed
Planned with this note: Human-seeded strict JNCIA-Junos briefs, no catalog provider call. Parent selected the measured SELF-LINK topology: one ordinary vJunos-router with one wire joining its own distinct ports, no other node or logical systems. First packet is approved for the existing Sonnet 5.5 authoring loop; second remains held until the first qualifies cleanly. The engineer proves topic behavior through native tools, snapshots, rehearsals, and qualification. No separate topic probe is required before the first model call.

## Counts

By decision: approved 1, hold 1
By lab type: build 2
By objective: OBJ-1-5 1, OBJ-5-1 2, OBJ-5-4 2, OBJ-6-2 1, OBJ-6-6 1, OBJ-7-10 1, OBJ-7-3 1, OBJ-7-4 1, OBJ-7-5 1, OBJ-7-6 1, OBJ-7-7 1, OBJ-7-8 1, OBJ-7-9 1

## Briefs

### jncia-local-routing-policy-1n · build · 1 nodes · 3 stages · OBJ-1-5, OBJ-5-1, OBJ-5-4, OBJ-6-2, OBJ-6-6, OBJ-7-3, OBJ-7-4, OBJ-7-5, OBJ-7-6

Status: approved, priority 10
First model pinned to claude-sonnet-5-5
Note: First packet approved on the measured single-router self-link topology. Preserve the wired-port and diagnostic baseline, prove the passive-summary scaffold and policy effects before accepted submission, and retain any parked attempt without hand-patching packet configs/checks.
Outcome: Configure and verify a router-local endpoint, distinguish static discard and reject next hops in the routing table, and demonstrate how ordered routing-policy terms admit one contributor and exclude another without removing the component routes.
Why: This practices addressing, static routing, and policy on one appliance. A same-router wire provides measured ordinary appliance readiness while local operational state carries the taught outcomes. Aggregate contribution supplies a real local policy effect, without route advertisement or transit claims. Every stage check fails at original start/reset and stays true at final handover. The engineer must establish the passive-summary scaffold and accepted/rejected policy effects with native tools and snapshots before an accepted submission.

    python -m labsmith.learner_labpack.authoring approve --queue content/labpacks/_authoring/queue/jncia-single-router-20261008.yaml --approve jncia-local-routing-policy-1n

### jncia-loopback-filter-1n · build · 1 nodes · 2 stages · OBJ-5-1, OBJ-5-4, OBJ-7-7, OBJ-7-8, OBJ-7-9, OBJ-7-10

Status: hold, priority 20
First model pinned to claude-sonnet-5-5
Note: Hold until the first packet qualifies cleanly. A later explicit release is required before invocation; the engineer must then prove self-ping filter effects before submission. Never invoke run-one for this held entry before releasing that gate.
Outcome: Use ordered firewall-filter terms and precise ICMP destination matches to permit two local services and block a third, then verify those effects with router-originated ping observations.
Why: This different objective family uses existing ping outcomes. Start only after the first packet qualifies cleanly. The engineer must prove that router-originated ping traverses the chosen lo0 filter on this one-router image. Counter tasks are omitted because existing checks reject changing counters. If filter effects cannot be observed, park the second packet and preserve the failure. Do not add another node, logical systems, a new check type, or configuration-text checks.

    python -m labsmith.learner_labpack.authoring approve --queue content/labpacks/_authoring/queue/jncia-single-router-20261008.yaml --approve jncia-loopback-filter-1n
