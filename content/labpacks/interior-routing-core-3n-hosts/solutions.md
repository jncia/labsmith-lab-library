# Solutions — Bring a Three-Router Core onto a Single Link-State Area

Both stages are configured on all three routers, in configuration mode, then committed. Stage 1 puts the link interfaces into the area, and stage 2 adds the loopbacks to the same area. Nothing else changes: the addressing stays as it was, and the design is one area, 0.0.0.0, everywhere. The captured checks come from r1 and r3, the two ends, because they are the routers that learn everything through r2.

## Stage 1 — Bring up the routing area

### Configuration

Apply this on each of the three routers, then commit. Each router puts its link interfaces into area 0.0.0.0: r1 ge-0/0/0, r2 ge-0/0/0 and ge-0/0/1, r3 ge-0/0/0. Leave the loopbacks out for now. r2 has two interfaces in the area, and r1 and r3 have one each.

On `r1`:

```
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0 interface-type p2p
```

On `r2`:

```
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0 interface-type p2p
set protocols ospf area 0.0.0.0 interface ge-0/0/1.0 interface-type p2p
```

On `r3`:

```
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0 interface-type p2p
```

### Verification

On `r1` — r1 has the r2-r3 link subnet learned by OSPF

```
show route table inet.0 10.0.23.0/30 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.0.23.0/30       *[OSPF/10] <age>, metric 2
                    >  to 10.0.12.2 via ge-0/0/0.0
```

Read the entry for 10.0.23.0/30 on r1. The protocol shown is OSPF, and the next hop is 10.0.12.2 out of ge-0/0/0.0. That address is r2 on the r1-r2 link. r1 has no interface on the r2-r3 link, so the only way it can hold this route is that r2 announced it. That also proves the r1-r2 adjacency is up.

On `r3` — r3 has the r1-r2 link subnet learned by OSPF

```
show route table inet.0 10.0.12.0/30 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.0.12.0/30       *[OSPF/10] <age>, metric 2
                    >  to 10.0.23.1 via ge-0/0/0.0
```

Read the entry for 10.0.12.0/30 on r3. The protocol is OSPF and the next hop is 10.0.23.1 out of ge-0/0/0.0, which is r2 on the r2-r3 link. This is the mirror of the r1 check, and it proves the r2-r3 adjacency is up as well. Both entries carry a metric of 2, one link to r2 plus the link beyond it.

### Why it works

OSPF forms an adjacency on each link where both ends put the interface in the same area. With ge-0/0/0 on r1, both r2 interfaces and ge-0/0/0 on r3 all in 0.0.0.0, r2 has an adjacency with each end router, and each router floods its link subnets into a shared database. The captured routes show the result. r1 holds the r2-r3 subnet with r2 as next hop, and r3 holds the r1-r2 subnet the same way. Neither router is directly attached to the far subnet, so the entries can only come from the protocol. The route table marks them OSPF, and the point of the first stage is that the routes come from the protocol and not from anything typed in by hand.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Putting a router or an interface in a different area number | The adjacency never forms, so the far link subnet does not appear on the end routers. | The OSPF neighbour list is empty on the router with the odd area, and the OSPF section of the route table lacks the far link subnet. |
| Leaving one of r2's two interfaces out of the area | One end router has an adjacency and the other has nothing. The end that is cut off learns no OSPF routes at all. | r2 shows only one neighbour. One of r1 or r3 has an empty neighbour list, and the check for that router fails. |

## Stage 2 — Prove end-to-end reachability

### Configuration

Apply this on each of the three routers, then commit. Each router adds its own loopback, lo0.0, to area 0.0.0.0, the same area as its links. The loopback addresses are 10.255.0.1/32 on r1, 10.255.0.2/32 on r2 and 10.255.0.3/32 on r3. Do it on all three: a loopback left out is not announced, and the other routers cannot learn it.

On `r1`:

```
set protocols ospf area 0.0.0.0 interface lo0.0 passive
```

On `r2`:

```
set protocols ospf area 0.0.0.0 interface lo0.0 passive
```

On `r3`:

```
set protocols ospf area 0.0.0.0 interface lo0.0 passive
```

### Verification

On `r1` — r1 learns r2's loopback by OSPF

```
show route table inet.0 10.255.0.2/32 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.2/32      *[OSPF/10] <age>, metric 1
                    >  to 10.0.12.2 via ge-0/0/0.0
```

On r1, the route to 10.255.0.2/32 is learned from OSPF with next hop 10.0.12.2 via ge-0/0/0.0. The metric is 1. r2's loopback is directly behind the next hop, so this is the shortest path.

On `r1` — r1 learns r3's loopback by OSPF

```
show route table inet.0 10.255.0.3/32 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.3/32      *[OSPF/10] <age>, metric 2
                    >  to 10.0.12.2 via ge-0/0/0.0
```

On r1, the route to 10.255.0.3/32 is learned from OSPF, still through 10.0.12.2 via ge-0/0/0.0. The metric is 2, one more than r2's loopback, which fits r3 being one router further along the line. The next hop is r2, not r3, because r1 has no link to r3.

On `r3` — r3 learns r1's loopback by OSPF

```
show route table inet.0 10.255.0.1/32 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.1/32      *[OSPF/10] <age>, metric 2
                    >  to 10.0.23.1 via ge-0/0/0.0
```

On r3, the route to 10.255.0.1/32 is learned from OSPF, with next hop 10.0.23.1 via ge-0/0/0.0 and a metric of 2. It is the same path as on r1, seen from the other end, and shows r1's loopback made it across r2.

On `r1` — r1 reaches r3's loopback

```
ping 10.255.0.3 count 3

PING 10.255.0.3 (10.255.0.3): 56 data bytes
<counter> bytes from 10.255.0.3: icmp_seq=0 ttl=63 time=13.747 ms
<counter> bytes from 10.255.0.3: icmp_seq=1 ttl=63 time=4.916 ms
<counter> bytes from 10.255.0.3: icmp_seq=2 ttl=63 time=3.133 ms

--- 10.255.0.3 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 3.133/7.265/13.747/4.641 ms
```

All three probes from r1 to 10.255.0.3 are answered, with 0% loss in the statistics. The TTL is 63: the reply left r3 with 64 and lost one at r2, so the path crossed exactly one router. That is what an end-to-end path over r2 should look like.

On `r3` — r3 reaches r1's loopback

```
ping 10.255.0.1 count 3

PING 10.255.0.1 (10.255.0.1): 56 data bytes
<counter> bytes from 10.255.0.1: icmp_seq=0 ttl=63 time=4.231 ms
<counter> bytes from 10.255.0.1: icmp_seq=1 ttl=63 time=2.566 ms
<counter> bytes from 10.255.0.1: icmp_seq=2 ttl=63 time=2.371 ms

--- 10.255.0.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 2.371/3.056/4.231/0.835 ms
```

All three probes from r3 to 10.255.0.1 are answered with 0% loss, and again the TTL is 63, showing one router in the middle. Running the ping in both directions matters, because each direction depends on the other end having a route back.

### Why it works

Adding the loopbacks to the area makes each router announce its /32 in the same database that already carries the link subnets. The routes captured on r1 and r3 show that: r1 has both far loopbacks, r3 has r1's, and every next hop is r2. The metrics grow with the number of links along the way, 1 to r2's loopback and 2 to the loopback beyond it. The pings work in both directions because each side has a route to the other's loopback and a route back to the link it came in on. The link subnets from stage 1 are what let the replies find their way back. The TTL of 63 confirms the packets crossed r2 as a router and were not switched around it.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Loopback left out of the area on one router | That router's /32 is missing everywhere else, and a ping to it fails with no route. | The OSPF routes on the other routers lack that /32, and the ping reports no route to host. The other loopbacks are still present, so only one address is missing. |
| Putting the loopback in a different area from the links | The router's link adjacencies stay up, but its loopback is announced as part of another area. The design calls for one area, 0.0.0.0, everywhere, and this breaks it. | Check the area shown for lo0.0 against the area of the link interfaces on the same router. Any difference is the fault. |
| Adding loopbacks on r1 and r3 only and forgetting r2 | r1 and r3 can reach each other's loopbacks, but nobody can reach 10.255.0.2. The end-to-end ping passes, so it hides the fault. | The check for r1's route to 10.255.0.2/32 fails, because r1 has no OSPF route for it. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `r1` — r1 ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.12.1/30
                                   multiservice
```

On `r2` — r2 ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.12.2/30
                                   multiservice
```

On `r2` — r2 ge-0/0/1 is up

```
show interfaces ge-0/0/1 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/1                up    up
ge-0/0/1.0              up    up   inet     10.0.23.1/30
                                   multiservice
```

On `r3` — r3 ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.23.2/30
                                   multiservice
```

On `r1` — r1 reaches r2 on the r1-r2 link

```
ping 10.0.12.2 count 3

PING 10.0.12.2 (10.0.12.2): 56 data bytes
<counter> bytes from 10.0.12.2: icmp_seq=0 ttl=64 time=1.597 ms
<counter> bytes from 10.0.12.2: icmp_seq=1 ttl=64 time=1.745 ms
<counter> bytes from 10.0.12.2: icmp_seq=2 ttl=64 time=1.766 ms

--- 10.0.12.2 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 1.597/1.703/1.766/0.075 ms
```

On `r3` — r3 reaches r2 on the r2-r3 link

```
ping 10.0.23.1 count 3

PING 10.0.23.1 (10.0.23.1): 56 data bytes
<counter> bytes from 10.0.23.1: icmp_seq=0 ttl=64 time=2.215 ms
<counter> bytes from 10.0.23.1: icmp_seq=1 ttl=64 time=2.172 ms
<counter> bytes from 10.0.23.1: icmp_seq=2 ttl=64 time=2.668 ms

--- 10.0.23.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 2.172/2.352/2.668/0.224 ms
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Values that differ from one run to the next, such as ages, counters and assigned identifiers, are shown masked, so your own output will differ in those places and nowhere else.

- Authoring run: `a0919uk0`
- Rehearsal receipt: `interior-routing-core-3n-2026-09-19-30edfd3164d2`
