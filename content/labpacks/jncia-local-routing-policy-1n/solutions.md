# Solutions — Local Addressing, Static Routes, and Contributor Policy

All work is on r1. Apply each stage's configuration in configuration mode and commit. The stages build on each other, so keep the earlier configuration in place.

## Stage 1 — Establish the local service endpoint

### Configuration

Add the address under lo0 unit 0 on r1, next to 192.0.2.1/32, then commit.

On `r1`:

```
set interfaces lo0 unit 0 family inet address 192.0.2.2/32
```

### Verification

On `r1` — inet.0 has a route for 192.0.2.2/32

```
show route table inet.0 192.0.2.2/32 exact

inet.0: 3 destinations, 3 routes (3 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.2/32       *[Direct/0] <age>
                    >  via lo0.0
```

The route for 192.0.2.2/32 is Direct, via lo0.0. This shows the address is configured on the loopback and installed in inet.0.

On `r1` — r1 pings 192.0.2.2

```
ping 192.0.2.2 count 3

PING 192.0.2.2 (192.0.2.2): 56 data bytes
<counter> bytes from 192.0.2.2: icmp_seq=0 ttl=64 time=0.050 ms
<counter> bytes from 192.0.2.2: icmp_seq=1 ttl=64 time=0.076 ms
<counter> bytes from 192.0.2.2: icmp_seq=2 ttl=64 time=0.089 ms

--- 192.0.2.2 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.050/0.072/0.089/0.016 ms
```

Three replies and 0% packet loss. The router answers for its own address locally.

### Why it works

A /32 on lo0.0 gives inet.0 a Direct route via lo0.0, as the route output shows. The ping succeeds because the destination is local to r1.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Wrong mask or wrong unit | There is no 192.0.2.2/32 route in inet.0 | show route for 192.0.2.2 returns nothing and the ping fails. |

## Stage 2 — Represent the two planned networks

### Configuration

Under routing-options on r1, define the two static routes and commit. 172.16.10.0/24 gets discard and 172.17.10.0/24 gets reject.

On `r1`:

```
set routing-options static route 172.16.10.0/24 discard
set routing-options static route 172.17.10.0/24 reject
```

### Verification

On `r1` — 172.16.10.0/24 forwards to discard

```
show route forwarding-table destination 172.16.10.0/24 table default

Routing table: default.inet
Internet:
Destination        Type RtRef Next hop           Type Index    NhRef Netif
172.16.10.0/24     user     0                    dscd       34     2
```

The forwarding entry for 172.16.10.0/24 has next hop type dscd, so matching traffic is silently dropped.

On `r1` — 172.17.10.0/24 forwards to reject

```
show route forwarding-table destination 172.17.10.0/24 table default

Routing table: default.inet
Internet:
Destination        Type RtRef Next hop           Type Index    NhRef Netif
172.17.10.0/24     user     0                    rjct       36     3
```

The forwarding entry for 172.17.10.0/24 has next hop type rjct, so matching traffic is dropped and the sender is told.

On `r1` — Static route 172.16.10.0/24 in inet.0

```
show route table inet.0 172.16.10.0/24 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.10.0/24     *[Static/5] <age>
                       Discard
```

172.16.10.0/24 is an active Static route with Discard as its next hop.

On `r1` — Static route 172.17.10.0/24 in inet.0

```
show route table inet.0 172.17.10.0/24 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.17.10.0/24     *[Static/5] <age>
                       Reject
```

172.17.10.0/24 is an active Static route with Reject as its next hop.

### Why it works

The routing table shows both prefixes as Static, one with Discard and one with Reject. The forwarding table carries the same actions as dscd and rjct, so the control plane and forwarding plane agree.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Swapping discard and reject | The next hop types are reversed | show route shows Discard on 172.17.10.0/24. |

## Stage 3 — Admit only the approved contributor

### Configuration

Configure an aggregate for 172.16.0.0/16 and a policy for its contributors, then remove the passive property from the 172.17.0.0/16 aggregate. Commit on r1.

On `r1`:

```
delete routing-options aggregate route 172.17.0.0/16 passive
set policy-options policy-statement agg-contrib term approved from route-filter 172.16.10.0/24 exact
set policy-options policy-statement agg-contrib term approved then accept
set policy-options policy-statement agg-contrib term rest then reject
set routing-options aggregate route 172.16.0.0/16 policy agg-contrib
set routing-options aggregate route 172.17.0.0/16 policy agg-contrib
```

### Verification

On `r1` — Aggregate 172.16.0.0/16 in inet.0

```
show route table inet.0 172.16.0.0/16 exact

inet.0: 6 destinations, 6 routes (5 active, 0 holddown, 1 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.0.0/16      *[Aggregate/130] <age>
                       Reject
```

172.16.0.0/16 is an active Aggregate route with a Reject next hop. This shows the approved contributor feeds it.

On `r1` — No route for 172.17.0.0/16

```
show route table inet.0 172.17.0.0/16 exact

inet.0: 6 destinations, 6 routes (5 active, 0 holddown, 1 hidden)
```

The output contains only the table header and no route. 172.17.0.0/16 is gone from inet.0.

### Why it works

The policy accepts only 172.16.10.0/24 into the 172.16.0.0/16 aggregate and rejects every other route, so that aggregate has a contributor and becomes active. 172.17.0.0/16 has no contributor, and without the passive property it is no longer installed. The 172.17.10.0/24 static route is still present, as the stage 2 checks show.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Reject term placed before the accept term | 172.16.0.0/16 never becomes active | show route protocol aggregate lacks 172.16.0.0/16. |
| Leaving passive on 172.17.0.0/16 | 172.17.0.0/16 is still present | show route 172.17.0.0/16 shows Aggregate with Reject. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `r1` — ge-0/0/0 up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.16386          up    up
```

On `r1` — ge-0/0/1 up

```
show interfaces ge-0/0/1 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/1                up    up
ge-0/0/1.16386          up    up
```

On `r1` — Diagnostic endpoint answers

```
ping 192.0.2.1 count 3

PING 192.0.2.1 (192.0.2.1): 56 data bytes
<counter> bytes from 192.0.2.1: icmp_seq=0 ttl=64 time=0.043 ms
<counter> bytes from 192.0.2.1: icmp_seq=1 ttl=64 time=0.035 ms
<counter> bytes from 192.0.2.1: icmp_seq=2 ttl=64 time=0.164 ms

--- 192.0.2.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.035/0.081/0.164/0.059 ms
```

On `r1` — Diagnostic route present

```
show route table inet.0 192.0.2.1/32 exact

inet.0: 6 destinations, 6 routes (5 active, 0 holddown, 1 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.1/32       *[Direct/0] <age>
                    >  via lo0.0
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Values that differ from one run to the next, such as ages, counters and assigned identifiers, are shown masked, so your own output will differ in those places and nowhere else.

- Authoring run: `a1008ccn`
- Rehearsal receipt: `jncia-local-routing-policy-1n-2026-10-08-783c9bea78e3`
