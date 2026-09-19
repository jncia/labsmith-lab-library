# Queue owner-outline-ent-202609

9 of 11 briefs are waiting for a decision.

Planned from JNCIS-ENT (OWNER-OUTLINE-ENT), source owner-outline-ent.json
Planned at 2026-09-19T19:40:31+00:00 by claude-sonnet-5
Planned with this note: Note written by the integrator from the course owner. This blueprint is a mechanical transcription of the course owner course outline, not a certification blueprint: an objective group is one chapter of that outline and an anchor is one section of it, with the section own description as its boundary. The platform document is the whole truth about what the lab host can build and observe today. Where a section of the outline needs a node kind, a lab type, a feature or an observation the platform does not offer, leave it out and say so plainly rather than approximating it; the course owner would rather see an honest gap than a lab that teaches the wrong thing.

## Counts

By decision: approved 2, proposed 9
By lab type: build 11
By objective: C03-C03V01 1, C03-C03V03 1, C03-C03V04 1, C03-C03V06 1, C04-C04V01 1, C04-C04V04 1, C04-C04V05 1, C05-C04V04 1, C05-C04V05 1, C06-C06V01 1, C06-C06V02 1, C06-C06V04 1, C06-C06V05 1, C06-C06V06 1, C07-C07V02 1, C08-C08V01 1

## Objectives left out

- C01-C01V01: An introduction to the learning path. It has no skill to practise or observe.
- C01-C01V02: Switched versus shared LAN and bridging concepts need an Ethernet switching node. The platform offers only routers, and no check reads bridging state.
- C01-C01V03: MAC learning and forwarding are observed in the MAC table. No check type reads it, and the platform has no switch node.
- C01-C01V04: Flooding, filtering and aging are bridging behaviours. There is no switch node and no check can show them.
- C01-C01V05: Three-tier design and collapsed core is a design topic, and the platform cannot build or observe switch layers.
- C01-C01V06: EX series platform differences are about hardware and cannot be built or observed.
- C01-C01V07: Frame processing for unknown and known MAC destinations needs a switch node and MAC table observation. The platform offers neither.
- C01-C01V08: Layer 2 forwarding troubleshooting needs bridging tables and frame counters. No check reads them.
- C01-C01V09: VLANs and access ports need Ethernet switching. The router node kind and checks cannot show VLAN membership.
- C01-C01V10: 802.1Q trunking, voice VLAN and native VLAN need switch ports. No check reads tags or port modes.
- C01-C01V11: Inter-VLAN routing depends on VLANs on a switch with IRB interfaces. Without a switch node and VLAN observation it would be bent into something else.
- C01-C01V12: The VLAN lab depends on the VLAN, trunk and IRB objectives above, none of which the platform can build or observe.
- C02-C02V01: Network storms and loop formation need a switched, looped topology and cannot be observed with the platform's checks.
- C02-C02V02: STP port types, states and timers need a switch node. No check reads spanning-tree state, and timer values are also refused as configuration.
- C02-C02V03: RSTP port roles and states cannot be built on router nodes or read by any check.
- C02-C02V04: Configuring and troubleshooting STP/RSTP needs a switch node and spanning-tree state observation.
- C02-C02V05: BPDU, loop and root guard and storm control depend on spanning tree on switch ports, and none is observable.
- C02-C02V06: Ethernet ring protection needs a ring of switches and ring state observation, which the platform lacks.
- C02-C02V07: MAC limiting and persistent MAC learning need switch ports and a MAC table. No check can show them.
- C02-C02V08: DHCP snooping, DAI and IP source guard need switch ports, DHCP clients and binding table observation. The platform has none of these.
- C02-C02V09: Layer 2 firewall filters and storm control act on bridged frames. The platform has no switch node, and the checks cannot see filter matches or drops.
- C02-C02V10: The layer 2 security lab depends on the switching-only features above, and none can be built or observed.
- C03-C03V02: Martian routes are observable in principle as an absent route, but were left out of this batch in favour of objectives with more hands-on work. They could be added as a stage to the static route brief.
- C03-C03V05: Filter-based forwarding needs a check that shows which path a matched packet takes. Ping only reports success rate, and the forwarding-table check does not show filter matches.
- C04-C04V02: OSPF packet types, adjacency states and DR/BDR election are not observable, because the platform has no OSPF neighbour or DR check. Only their effect on routes can be seen.
- C04-C04V03: LSA types and the LSDB contents cannot be read by any check type.
- C05-C04V01: IS-IS overview of adjacencies and levels is theory. Its practical part is covered by the multi-level brief.
- C05-C04V02: IS-IS adjacency formation and DIS election are not observable, because no check reads IS-IS neighbours or the DIS.
- C05-C04V03: PDU formats and TLVs are packet-level content, and no check can observe them.
- C06-C06V03: BGP message types and the state machine cannot be observed beyond the neighbour state check. Message exchange per state has no check.
- C07-C07V01: Purely theory on tunnel use cases. There is no device outcome to observe.
- C08-C08V02: Virtual Chassis needs switch nodes, and graceful restart and GRES need dual routing engines and chassis and system configuration the platform cannot reset.
- C08-C08V03: Nonstop routing and bridging need dual routing engines, which the single-node kind does not have, plus chassis configuration. No check observes their state.
- C08-C08V04: VRRP needs a shared segment and BFD needs session state observation. Links are point to point only, and no check reads VRRP mastership or BFD sessions.
- C08-C08V05: ISSU needs dual routing engines, a software image and a chassis state that the platform cannot provide or observe.

## Briefs

### static-aggregate-generated-routes-3n · build · 3 nodes · 3 stages · C03-C03V01, C03-C03V06

Status: approved, priority 100
Note: Approved by the integrator for the two-brief proof of the authoring loop, not by the course owner. Two briefs from different objective groups, each of three nodes, chosen to prove the queue runner unattended and to show that nothing topic-specific changes between two labs. Every other brief in this queue is still waiting for the course owner's own decision.
Outcome: Choose between static, aggregate and generated routes for a given need, and confirm each one in the route table with the right protocol and next hop.
Why: This is the foundation of the Protocol Independent Routing chapter and its lab section. All three route types can be seen with route-exists, so it is fully observable. The set runs from simple to conditional.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve static-aggregate-generated-routes-3n

### ecmp-load-balancing-static-2n · build · 2 nodes · 3 stages · C03-C03V04

Status: proposed, priority 100
Outcome: Get a route with two next hops into the forwarding table as a load-shared entry, and show what happens when one path fails.
Why: Covers the ECMP part of load balancing with two nodes. The route table and forwarding table are both observable. How flows are hashed (per-flow versus per-packet) cannot be observed with the platform's checks, so the brief stays on how the forwarding entry is built.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve ecmp-load-balancing-static-2n

### routing-instance-rib-group-3n · build · 3 nodes · 3 stages · C03-C03V03

Status: proposed, priority 100
Outcome: Isolate an interface in a virtual-router instance and use a RIB group to copy only the needed routes between it and the main table.
Why: Routing instances and RIB groups are the least visible parts of the PIR chapter. The named-table route check and ping inside an instance make them observable. Three nodes are the fewest that give a separate customer and a shared service.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve routing-instance-rib-group-3n

### gre-tunnel-over-transit-3n · build · 3 nodes · 3 stages · C07-C07V02

Status: proposed, priority 100
Outcome: Build a working GRE tunnel across a transit router, route inner subnets over it and check both the tunnel and the underlay.
Why: GRE is the hands-on part of the tunnels chapter. The tunnel interface, the routes over it and the absence of routes on the transit router can all be seen. It assumes the lab host's virtual router supports tunnel interfaces once tunnel services are set in the start state, which should be confirmed before building. IP-IP would be a variation on this and is left for a later batch.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve gre-tunnel-over-transit-3n

### ospf-multi-area-abr-3n · build · 3 nodes · 3 stages · C04-C04V01, C04-C04V04

Status: approved, priority 100
Note: Approved by the integrator for the two-brief proof of the authoring loop, not by the course owner. Two briefs from different objective groups, each of three nodes, chosen to prove the queue runner unattended and to show that nothing topic-specific changes between two labs. Every other brief in this queue is still waiting for the course owner's own decision.
Outcome: Configure a multi-area OSPF network with an area border router and confirm inter-area routes in the routing tables.
Why: This is the multi-area lab from the OSPF chapter. The existing lab is a single-area build, so this one practises area borders and inter-area routing instead. Three nodes are the smallest layout with a border router.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve ospf-multi-area-abr-3n

### ospf-nssa-policy-default-3n · build · 3 nodes · 3 stages · C04-C04V05

Status: proposed, priority 100
Outcome: Configure an NSSA, originate a default into it and export an external route with a policy that tags it.
Why: Covers the policy and additional options lab in the OSPF chapter. It follows the multi-area brief and builds on that same shape. The tag on the route is not a separate check type, so the outcome is observed through the route entry, which the build should confirm can show it.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve ospf-nssa-policy-default-3n

### isis-multi-level-3n · build · 3 nodes · 3 stages · C05-C04V04

Status: proposed, priority 100
Outcome: Configure IS-IS levels and areas so that an L1-only router reaches the backbone through an L1/L2 router.
Why: Multi-level IS-IS is the main hands-on skill of the IS-IS chapter. The results appear in routing tables, so route-exists and ping observe them. Adjacency internals such as DIS election and PDU contents cannot be observed with the platform's checks.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve isis-multi-level-3n

### isis-policy-leaking-3n · build · 3 nodes · 3 stages · C05-C04V05

Status: proposed, priority 100
Outcome: Use IS-IS routing policy to leak a chosen level 2 route into level 1 and to advertise an external route, and show the effect on the route tables.
Why: Follows the multi-level brief and practises a different skill, IS-IS policy. The presence and absence of routes on each router shows what the policy does.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve isis-policy-leaking-3n

### bgp-ibgp-ebgp-next-hop-3n · build · 3 nodes · 3 stages · C06-C06V04, C06-C06V01

Status: proposed, priority 100
Outcome: Explain and fix the next-hop problem when EBGP routes are passed to IBGP peers, and confirm the session states and routes.
Why: A candidate should be able to diagnose and fix this common BGP problem. Session state and route entries can be seen with the platform's checks. The five BGP message types and the state machine cannot be observed, so they are not covered.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve bgp-ibgp-ebgp-next-hop-3n

### bgp-dual-homed-policy-3n · build · 3 nodes · 3 stages · C06-C06V02, C06-C06V05, C06-C06V06

Status: proposed, priority 100
Outcome: Change BGP path selection with an import policy, limit what is advertised with an export policy, and prove both in the route tables.
Why: This is the policy lab that closes the BGP chapter. The choice of next hop and the presence or absence of routes on each router show the effect. Troubleshooting with traceroute and logs is not covered because the platform cannot observe it.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve bgp-dual-homed-policy-3n

### lag-two-links-2n · build · 2 nodes · 3 stages · C08-C08V01

Status: proposed, priority 100
Outcome: Build a link aggregation group over two member links, address it and show that it stays up when a member is lost.
Why: Link aggregation is the one high-availability topic that a router-only platform can build and check with interface and ping checks. Whether traffic is spread over the members is not observable, so the brief stays with bundle state and survival of a member failure. Redundant trunk groups need switching and are skipped.

    python -m labsmith.learner_labpack.authoring approve --queue /Users/bjacobson/juniper_lessons/.worktrees/lab-library-labpack-v0/content/labpacks/_authoring/queue/owner-outline-ent-202609.yaml --approve lag-two-links-2n
