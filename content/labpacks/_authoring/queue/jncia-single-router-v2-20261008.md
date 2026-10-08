# Queue jncia-single-router-v2-20261008

0 of 1 briefs are waiting for a decision.

Planned from JNCIA-Junos (JN0-106), source official-blueprint.json
Planned at 2026-10-08T21:35:30.232866+00:00 by owner-seed
Planned with this note: Additive reauthoring after original run a1008ccn passed complete native qualification and clean teardown, with remaining learner-review coverage/wording findings. The original packet, receipt and branch stay unchanged. Root approves this precise corrected brief within the owner's single-router task, using the same Sonnet5.5 loop and existing check vocabulary. No packet hand repair.

## Counts

By decision: approved 1
By lab type: build 1
By objective: OBJ-1-5 1, OBJ-5-1 1, OBJ-5-4 1, OBJ-6-2 1, OBJ-6-6 1, OBJ-7-3 1, OBJ-7-4 1, OBJ-7-5 1, OBJ-7-6 1

## Briefs

### jncia-local-routing-policy-1n-v2 · build · 1 nodes · 3 stages · OBJ-1-5, OBJ-5-1, OBJ-5-4, OBJ-6-2, OBJ-6-6, OBJ-7-3, OBJ-7-4, OBJ-7-5, OBJ-7-6

Status: approved, priority 10
First model pinned to claude-sonnet-5-5
Note: Approved within the existing single-router task after original complete qualification and review; new packet identity preserves the original evidence, same native loop, no hand repair.
Outcome: Verify the exact address and mask on lo0.0 directly from interface state, distinguish static discard and reject actions, and use routing policy to activate an approved aggregate while retaining an unwanted aggregate as hidden rather than installed.
Why: This practices exact interface addressing, static forwarding actions and contributor policy on one ordinary appliance. Reading both ordinary and hidden route views distinguishes policy exclusion from deletion, while preserving component routes and service reachability. Existing interface-state and route-state readers must prove each declared outcome directly from captured device answers, with all stage targets failing at original start/reset and cumulatively passing at final handover.

    python -m labsmith.learner_labpack.authoring approve --queue content/labpacks/_authoring/queue/jncia-single-router-v2-20261008.yaml --approve jncia-local-routing-policy-1n-v2
