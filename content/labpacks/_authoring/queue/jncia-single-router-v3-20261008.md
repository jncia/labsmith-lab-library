# Queue jncia-single-router-v3-20261008

0 of 1 briefs are waiting for a decision.

Planned from JNCIA-Junos (JN0-106), source official-blueprint.json
Planned at 2026-10-08T22:03:07.802727+00:00 by owner-seed
Planned with this note: Additive fresh brief after a1008zoh completed native qualification and clean teardown. Original and v2 packets, receipts and branches remain unchanged; learner review found misleading proof wording. Exact physical /24 observation and isolated alternative trials use the same native loop, Sonnet model and check vocabulary. No packet hand repair.

## Counts

By decision: approved 1
By lab type: build 1
By objective: OBJ-1-5 1, OBJ-5-1 1, OBJ-5-4 1, OBJ-6-2 1, OBJ-6-6 1, OBJ-7-3 1, OBJ-7-4 1, OBJ-7-5 1, OBJ-7-6 1

## Briefs

### jncia-local-routing-policy-1n-v3 · build · 1 nodes · 3 stages · OBJ-1-5, OBJ-5-1, OBJ-5-4, OBJ-6-2, OBJ-6-6, OBJ-7-3, OBJ-7-4, OBJ-7-5, OBJ-7-6

Status: approved, priority 10
First model pinned to claude-sonnet-5-5
Note: Approved within the existing first-packet task after a1008zoh completed qualification and clean teardown. Fresh physical /24 brief fixes misleading proof wording through native authoring; same model, prompts, check vocabulary and qualifier, no hand packet repair.
Outcome: Verify exact 192.0.2.2/24 on ge-0/0/0.0 directly from operational interface state and its measured Direct subnet route, distinguish static discard and reject actions, and use routing policy to activate an approved aggregate while retaining an unwanted aggregate as hidden rather than installed.
Why: Use the physical-interface address/prefix readback and connected route to distinguish mask and placement. Before submission, measure two isolated alternatives with existing tools: service 192.0.2.2/32 on ge-0/0/0.0, and 192.0.2.2/24 on ge-0/0/1.0. Restore the intended state after each trial. Explain which interface and route fields changed; do not claim route or ping alone identifies the interface. Ordinary and hidden route views distinguish policy exclusion from deletion.

    python -m labsmith.learner_labpack.authoring approve --queue content/labpacks/_authoring/queue/jncia-single-router-v3-20261008.yaml --approve jncia-local-routing-policy-1n-v3
