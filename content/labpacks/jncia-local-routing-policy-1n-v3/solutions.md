# Solutions — Interface Addressing, Static Routes, and Contributor Policy

All three stages are configured on r1 alone. Apply each stage in configuration mode and commit, then run the captured checks. The reference configuration for each stage is shown with the stage.

## Stage 1 — Establish the exact local service endpoint

### Configuration

Apply this on r1 under ge-0/0/0 unit 0, then commit. It adds only the inet address and leaves ge-0/0/1 and lo0.0 alone.

On `r1`:

```
set interfaces ge-0/0/0 unit 0 family inet address 192.0.2.2/24
```

### Verification

On `r1` — ge-0/0/0.0 carries 192.0.2.2/24

```
show interfaces ge-0/0/0.0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0.0              up    up   inet     192.0.2.2/24
                                   multiservice
```

ge-0/0/0.0 is up/up with inet 192.0.2.2/24. The unit, address and /24 mask must all match.

On `r1` — Direct route 192.0.2.0/24

```
show route table inet.0 192.0.2.0/24 exact

inet.0: 4 destinations, 4 routes (4 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.0/24       *[Direct/0] <age>
                    >  via ge-0/0/0.0
```

inet.0 lists 192.0.2.0/24 as Direct, active (the asterisk), via ge-0/0/0.0. That route exists only because the address carries a /24.

On `r1` — r1 pings 192.0.2.2

```
ping 192.0.2.2 count 3

PING 192.0.2.2 (192.0.2.2): 56 data bytes
<counter> bytes from 192.0.2.2: icmp_seq=0 ttl=64 time=0.042 ms
<counter> bytes from 192.0.2.2: icmp_seq=1 ttl=64 time=0.036 ms
<counter> bytes from 192.0.2.2: icmp_seq=2 ttl=64 time=0.108 ms

--- 192.0.2.2 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.036/0.062/0.108/0.033 ms
```

All three echoes are answered and loss is 0%. r1 reaches its own new address.

### Why it works

The readback shows 192.0.2.2/24 on ge-0/0/0.0, and the Direct route in inet.0 points out that same unit. The route is derived from the interface mask, so the /24 produces the 192.0.2.0/24 subnet. The ping to 192.0.2.2 succeeds locally. The loopback holds 192.0.2.1/32, which is a host route and gives no subnet route of its own.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Using a /32 mask or putting the address on the wrong port | ge-0/0/0.0 does not report exactly 192.0.2.2/24. | Check show interfaces ge-0/0/0.0 terse for the exact address and prefix length; a subnet route or ping alone does not establish the port. |

## Stage 2 — Represent the two planned networks

### Configuration

Apply this on r1 in the routing-options static section, then commit. One route uses the discard next hop and the other uses reject.

On `r1`:

```
set routing-options static route 172.16.10.0/24 discard
set routing-options static route 172.17.10.0/24 reject
```

### Verification

On `r1` — 172.16.10.0/24 active static discard

```
show route 172.16.10.0/24 exact

inet.0: 6 destinations, 6 routes (6 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.10.0/24     *[Static/5] <age>
                       Discard
```

172.16.10.0/24 is Static, active, with next hop Discard.

On `r1` — 172.17.10.0/24 active static reject

```
show route 172.17.10.0/24 exact

inet.0: 6 destinations, 6 routes (6 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.17.10.0/24     *[Static/5] <age>
                       Reject
```

172.17.10.0/24 is Static, active, with next hop Reject.

On `r1` — discard forwarding entry

```
show route forwarding-table destination 172.16.10.0/24 table default

Routing table: default.inet
Internet:
Destination        Type RtRef Next hop           Type Index    NhRef Netif
172.16.10.0/24     user     0                    dscd       34     2
```

The forwarding entry for 172.16.10.0/24 has next-hop type dscd, so the forwarding plane drops silently.

On `r1` — reject forwarding entry

```
show route forwarding-table destination 172.17.10.0/24 table default

Routing table: default.inet
Internet:
Destination        Type RtRef Next hop           Type Index    NhRef Netif
172.17.10.0/24     user     0                    rjct       36     3
```

The forwarding entry for 172.17.10.0/24 has next-hop type rjct, so the forwarding plane drops and signals unreachable.

### Why it works

Each prefix shows the intended next-hop type in the route view (Discard, Reject) and the matching type in the forwarding table (dscd, rjct). The routes are Static with the asterisk, so they are active. The two checks together show the choice reached forwarding and not only the route table.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Swapping discard and reject | Traffic to each network is dropped the opposite way from the plan. | dscd appears against 172.17.10.0/24, or rjct against 172.16.10.0/24, in the forwarding table. |

## Stage 3 — Distinguish rejected contribution from route deletion

### Configuration

Apply this on r1, then commit. Add an aggregate policy that accepts only 172.16.10.0/24 as contributor and rejects everything else, and attach it to the aggregate routes. Remove the passive setting from 172.17.0.0/16 and keep the route defined.

On `r1`:

```
delete routing-options aggregate route 172.17.0.0/16 passive
set policy-options policy-statement AGG-CONTRIB term approved from route-filter 172.16.10.0/24 exact
set policy-options policy-statement AGG-CONTRIB term approved then accept
set policy-options policy-statement AGG-CONTRIB term rest then reject
set routing-options aggregate route 172.16.0.0/16 policy AGG-CONTRIB
set routing-options aggregate route 172.17.0.0/16 policy AGG-CONTRIB
```

### Verification

On `r1` — 172.16.0.0/16 active Aggregate

```
show route 172.16.0.0/16 exact

inet.0: 7 destinations, 7 routes (6 active, 0 holddown, 1 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.0.0/16      *[Aggregate/130] <age>
                       Reject
```

172.16.0.0/16 is Aggregate, active, with a Reject next hop. The accepted contributor 172.16.10.0/24 builds it.

On `r1` — 172.17.0.0/16 Aggregate retained in hidden view

```
show route hidden 172.17.0.0/16 exact

inet.0: 7 destinations, 7 routes (6 active, 0 holddown, 1 hidden)
+ = Active Route, - = Last Active, * = Both

172.17.0.0/16       [Aggregate] <age>
                       Reject
```

In the hidden view, 172.17.0.0/16 is still listed as Aggregate, with no asterisk. The route exists but is inactive.

On `r1` — 172.17.0.0/16 absent from the ordinary view

```
show route 172.17.0.0/16 exact

inet.0: 7 destinations, 7 routes (6 active, 0 holddown, 1 hidden)
```

The ordinary view shows only the table summary and no 172.17.0.0/16 entry. The route no longer takes part in forwarding.

### Why it works

The route summary counts one hidden route, and the hidden view holds the 172.17.0.0/16 aggregate. That is the difference between rejecting a contribution and deleting a route. The definition stays, but with no accepted contributor the aggregate is not active. 172.16.0.0/16 has an accepted contributor, so it is active. The passive setting would have forced 172.17.0.0/16 active regardless of contributors, which is why it has to be removed.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Leaving the passive setting on 172.17.0.0/16 | 172.17.0.0/16 stays active in the ordinary view. | show route 172.17.0.0/16 exact still lists the Aggregate, and the hidden view is empty for it. |
| Deleting the 172.17.0.0/16 aggregate instead of leaving it hidden | The prefix is gone from the hidden view too. | show route hidden 172.17.0.0/16 exact returns nothing. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `r1` — lo0.0 holds 192.0.2.1

```
show interfaces lo0.0 terse

Interface               Admin Link Proto    Local                 Remote
lo0.0                   up    up   inet     192.0.2.1           --> 0/0
```

On `r1` — r1 pings 192.0.2.1

```
ping 192.0.2.1 count 3

PING 192.0.2.1 (192.0.2.1): 56 data bytes
<counter> bytes from 192.0.2.1: icmp_seq=0 ttl=64 time=0.126 ms
<counter> bytes from 192.0.2.1: icmp_seq=1 ttl=64 time=0.063 ms
<counter> bytes from 192.0.2.1: icmp_seq=2 ttl=64 time=0.109 ms

--- 192.0.2.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.063/0.099/0.126/0.027 ms
```

On `r1` — ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     192.0.2.2/24
                                   multiservice
```

On `r1` — ge-0/0/1 is up

```
show interfaces ge-0/0/1 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/1                up    up
ge-0/0/1.16386          up    up
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Some values that vary between runs, such as ages and counters, use placeholders. Timings and assigned identifiers may also differ in your own run.

- Authoring run: `a1008o12`
- Rehearsal receipt: `jncia-local-routing-policy-1n-v3-2026-10-08-28b7a041e5ba`
