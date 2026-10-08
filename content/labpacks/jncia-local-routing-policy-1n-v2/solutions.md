# Solutions — Local Addressing, Static Routes, and Contributor Policy

All three stages are configured on r1 only. Apply each stage's configuration in configuration mode and commit before running the checks. Each stage adds to the previous one.

## Stage 1 — Establish the exact local service endpoint

### Configuration

Add the address under lo0 unit 0 on r1, next to 192.0.2.1/32, then commit.

On `r1`:

```
set interfaces lo0 unit 0 family inet address 192.0.2.2/32
```

### Verification

On `r1` — lo0.0 reports 192.0.2.2

```
show interfaces lo0.0 terse

Interface               Admin Link Proto    Local                 Remote
lo0.0                   up    up   inet     192.0.2.1           --> 0/0
                                            192.0.2.2           --> 0/0
```

lo0.0 lists both 192.0.2.1 and 192.0.2.2 under inet. This shows the new address sits on the loopback beside the old one.

On `r1` — Direct host route 192.0.2.2/32 in inet.0

```
show route table inet.0 192.0.2.2/32 exact

inet.0: 3 destinations, 3 routes (3 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.2/32       *[Direct/0] <age>
                    >  via lo0.0
```

The route for 192.0.2.2/32 is active, with protocol Direct, via lo0.0. The host mask produced a /32 prefix.

On `r1` — r1 pings 192.0.2.2

```
ping 192.0.2.2 count 3

PING 192.0.2.2 (192.0.2.2): 56 data bytes
<counter> bytes from 192.0.2.2: icmp_seq=0 ttl=64 time=0.043 ms
<counter> bytes from 192.0.2.2: icmp_seq=1 ttl=64 time=0.046 ms
<counter> bytes from 192.0.2.2: icmp_seq=2 ttl=64 time=0.223 ms

--- 192.0.2.2 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.043/0.104/0.223/0.084 ms
```

Three replies and 0% packet loss show that r1 answers for its own new address.

### Why it works

A /32 on lo0.0 makes the router install a Direct route for exactly 192.0.2.2/32 pointing at lo0.0. The interface output and the route output agree on that. The ping succeeds because the address is local to r1.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Using a mask other than /32, or putting the address on another interface | No Direct 192.0.2.2/32 route in inet.0. A different prefix appears instead, or none. | The route lookup for 192.0.2.2/32 with the exact keyword returns nothing, and the interface view of lo0.0 shows a different mask or no new address. |

## Stage 2 — Represent the two planned networks

### Configuration

Add the two static routes under routing-options on r1 and commit. One uses the discard action and the other uses reject.

On `r1`:

```
set routing-options static route 172.16.10.0/24 discard
set routing-options static route 172.17.10.0/24 reject
```

### Verification

On `r1` — 172.16.10.0/24 Static in inet.0

```
show route table inet.0 172.16.10.0/24 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.10.0/24     *[Static/5] <age>
                       Discard
```

172.16.10.0/24 is active with protocol Static, and the next hop is shown as Discard.

On `r1` — 172.16.10.0/24 forwards as discard

```
show route forwarding-table destination 172.16.10.0/24 table default

Routing table: default.inet
Internet:
Destination        Type RtRef Next hop           Type Index    NhRef Netif
172.16.10.0/24     user     0                    dscd       34     2
```

The forwarding entry for 172.16.10.0/24 has next-hop type dscd. The packet is dropped without any reply.

On `r1` — 172.17.10.0/24 Static in inet.0

```
show route table inet.0 172.17.10.0/24 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.17.10.0/24     *[Static/5] <age>
                       Reject
```

172.17.10.0/24 is active with protocol Static, and the next hop is shown as Reject.

On `r1` — 172.17.10.0/24 forwards as reject

```
show route forwarding-table destination 172.17.10.0/24 table default

Routing table: default.inet
Internet:
Destination        Type RtRef Next hop           Type Index    NhRef Netif
172.17.10.0/24     user     0                    rjct       36     3
```

The forwarding entry for 172.17.10.0/24 has next-hop type rjct. The sender gets an error response.

### Why it works

Both prefixes are Static routes with no real next hop. The action keyword sets the forwarding behaviour. Discard installs a dscd entry and reject installs an rjct entry. The routing table shows the same difference in the words Discard and Reject.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Swapping discard and reject | 172.16.10.0/24 forwards as rjct, or 172.17.10.0/24 forwards as dscd. | Check the forwarding-table entry of each prefix and compare the type column with the design: dscd for 172.16.10.0/24, rjct for 172.17.10.0/24. |

## Stage 3 — Distinguish rejected contribution from route deletion

### Configuration

Under routing-options on r1, define aggregate 172.16.0.0/16. Keep aggregate 172.17.0.0/16 defined but remove its passive property. Attach a policy that accepts only 172.16.10.0/24 and rejects everything else. Commit.

On `r1`:

```
delete routing-options aggregate route 172.17.0.0/16 passive
set policy-options policy-statement AGG-CONTRIB term approved from route-filter 172.16.10.0/24 exact
set policy-options policy-statement AGG-CONTRIB term approved then accept
set policy-options policy-statement AGG-CONTRIB term other then reject
set routing-options aggregate route 172.16.0.0/16 policy AGG-CONTRIB
set routing-options aggregate route 172.17.0.0/16 policy AGG-CONTRIB
```

### Verification

On `r1` — 172.16.0.0/16 active Aggregate

```
show route table inet.0 172.16.0.0/16 exact

inet.0: 6 destinations, 6 routes (5 active, 0 holddown, 1 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.0.0/16      *[Aggregate/130] <age>
                       Reject
```

172.16.0.0/16 is active with protocol Aggregate, because 172.16.10.0/24 contributes to it.

On `r1` — 172.17.0.0/16 absent from inet.0

```
show route table inet.0 172.17.0.0/16 exact

inet.0: 6 destinations, 6 routes (5 active, 0 holddown, 1 hidden)
```

The lookup returns no route for 172.17.0.0/16. It is not in the ordinary view.

On `r1` — 172.17.0.0/16 Aggregate in hidden view

```
show route hidden

inet.0: 6 destinations, 6 routes (5 active, 0 holddown, 1 hidden)
+ = Active Route, - = Last Active, * = Both

172.17.0.0/16       [Aggregate] <age>
                       Reject

mgmt_junos.inet.0: 3 destinations, 3 routes (3 active, 0 holddown, 0 hidden)

mgmt_junos.inet6.0: 4 destinations, 4 routes (4 active, 0 holddown, 0 hidden)
```

The hidden view lists 172.17.0.0/16 as an Aggregate with a Reject next hop. The definition still exists, but the route has no contributor and is inactive.

### Why it works

The policy accepts 172.16.10.0/24, so 172.16.0.0/16 has a contributor and goes active. It rejects 172.17.10.0/24, so 172.17.0.0/16 has none. Without the passive property nothing else keeps it active, so it moves to the hidden view. The inet.0 summary line counts one hidden route, which is that aggregate. Hiding the route is different from deleting it, because a deleted definition would also be missing from the hidden view.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Leaving the passive property on 172.17.0.0/16 | The aggregate stays active in the ordinary view. | A lookup for 172.17.0.0/16 shows an active Aggregate, and the hidden view is empty. |
| Deleting the 172.17.0.0/16 aggregate definition | The prefix is missing from the ordinary view and from the hidden view. | The hidden view lists no 172.17.0.0/16. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `r1` — ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.16386          up    up
```

On `r1` — ge-0/0/1 is up

```
show interfaces ge-0/0/1 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/1                up    up
ge-0/0/1.16386          up    up
```

On `r1` — Diagnostic 192.0.2.1 answers ping

```
ping 192.0.2.1 count 3

PING 192.0.2.1 (192.0.2.1): 56 data bytes
<counter> bytes from 192.0.2.1: icmp_seq=0 ttl=64 time=0.105 ms
<counter> bytes from 192.0.2.1: icmp_seq=1 ttl=64 time=1.375 ms
<counter> bytes from 192.0.2.1: icmp_seq=2 ttl=64 time=0.579 ms

--- 192.0.2.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.105/0.686/1.375/0.524 ms
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Values that differ from one run to the next, such as ages, counters and assigned identifiers, are shown masked, so your own output will differ in those places and nowhere else.

- Authoring run: `a1008zoh`
- Rehearsal receipt: `jncia-local-routing-policy-1n-v2-2026-10-08-058d4d6a4a5c`
