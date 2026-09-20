# Solutions — Summarise a branch's routes with static, aggregate and generated routes

Stage 1 and stage 3 go on branch. Stage 2 goes on hq. Each stage builds on the one before, and stage 3 depends directly on the routes from stage 1. In each case load the reference configuration in configuration mode and commit, then run the checks shown. The captures were taken after each stage was applied, so each one shows the state that stage should leave you in.

## Stage 1 — Reach the remote subnets

### Configuration

This goes on branch only. Load it in configuration mode and commit. hq needs no change, because it already has both subnets as connected routes on its loopback and the shared link as a connected route.

On `branch`:

```
set routing-options static route 172.16.0.0/24 next-hop 10.0.12.2
set routing-options static route 172.16.1.0/24 next-hop 10.0.12.2
```

### Verification

On `branch` — branch has a static route to 172.16.0.0/24 via hq

```
show route table inet.0 172.16.0.0/24 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.0.0/24      *[Static/5] <age>
                    >  to 10.0.12.2 via ge-0/0/0.0
```

Look at the protocol and the next hop on the 172.16.0.0/24 entry. It is Static, active, with next hop 10.0.12.2 out of ge-0/0/0.0. That is the hq address on the shared link, which is what the design calls for.

On `branch` — branch has a static route to 172.16.1.0/24 via hq

```
show route table inet.0 172.16.1.0/24 exact

inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.1.0/24      *[Static/5] <age>
                    >  to 10.0.12.2 via ge-0/0/0.0
```

Same check for 172.16.1.0/24. It must also show Static with next hop 10.0.12.2. Both prefixes have to be there. One alone would give you half a result.

On `branch` — branch pings 172.16.0.1

```
ping 172.16.0.1 count 5

PING 172.16.0.1 (172.16.0.1): 56 data bytes
<counter> bytes from 172.16.0.1: icmp_seq=0 ttl=64 time=1.802 ms
<counter> bytes from 172.16.0.1: icmp_seq=1 ttl=64 time=1.713 ms
<counter> bytes from 172.16.0.1: icmp_seq=2 ttl=64 time=1.638 ms
<counter> bytes from 172.16.0.1: icmp_seq=3 ttl=64 time=2.091 ms
<counter> bytes from 172.16.0.1: icmp_seq=4 ttl=64 time=1.962 ms

--- 172.16.0.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 1.638/1.841/2.091/0.165 ms
```

Five probes sent, none lost. The reply from 172.16.0.1 proves both directions work. The packet went out through the static route, and hq answered using its connected link back to branch.

On `branch` — branch pings 172.16.1.1

```
ping 172.16.1.1 count 5

PING 172.16.1.1 (172.16.1.1): 56 data bytes
<counter> bytes from 172.16.1.1: icmp_seq=0 ttl=64 time=1.610 ms
<counter> bytes from 172.16.1.1: icmp_seq=1 ttl=64 time=2.116 ms
<counter> bytes from 172.16.1.1: icmp_seq=2 ttl=64 time=1.715 ms
<counter> bytes from 172.16.1.1: icmp_seq=3 ttl=64 time=1.972 ms
<counter> bytes from 172.16.1.1: icmp_seq=4 ttl=64 time=1.635 ms

--- 172.16.1.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 1.610/1.810/2.116/0.200 ms
```

The same for 172.16.1.1, with no loss. Together with the previous ping this shows that each of the two prefixes is reachable independently.

### Why it works

A static route needs only a prefix and a next hop that is directly reachable. Here the next hop is 10.0.12.2, hq's address on the shared /30, and branch already has that link as a connected route. The route table output shows the routes as Static with preference 5, next hop 10.0.12.2. The pings succeed because the return path needs nothing new. hq has the /30 connected, so replies to branch's 10.0.12.1 go straight back. The static routes on branch are also the raw material for stage 3.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Using the wrong next hop, such as branch's own address or the hq loopback | Pings fail with no route to host or time out. | The route is missing from the branch route table, or it shows a next hop other than 10.0.12.2. Compare it with the design values. |
| Configuring only one of the two subnets | One ping works and the other fails. | Only one of the two prefixes is listed as Static on branch. Query both exact prefixes. |

## Stage 2 — Summarise for the upstream router

### Configuration

This goes on hq. There are two parts: the aggregate route itself, and an export policy applied to the BGP group towards upstream. Load both and commit. upstream needs no configuration, because it already accepts what its eBGP peer sends.

On `hq`:

```
set policy-options policy-statement export-summary term agg from protocol aggregate
set policy-options policy-statement export-summary term agg from route-filter 172.16.0.0/23 exact
set policy-options policy-statement export-summary term agg then accept
set policy-options policy-statement export-summary term rest then reject
set routing-options aggregate route 172.16.0.0/23
set protocols bgp group upstream export export-summary
```

### Verification

On `hq` — hq has the aggregate route 172.16.0.0/23

```
show route table inet.0 172.16.0.0/23 exact

inet.0: 10 destinations, 10 routes (10 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.0.0/23      *[Aggregate/130] <age>
                       Reject
```

On hq the 172.16.0.0/23 entry is Aggregate with a Reject next hop. That is normal for an aggregate. It is active because the two connected /24s on the loopback contribute to it, and traffic that matches only the summary and no more specific route is discarded.

On `upstream` — upstream has 172.16.0.0/23 from BGP via hq

```
show route table inet.0 172.16.0.0/23 exact

inet.0: 4 destinations, 4 routes (4 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

172.16.0.0/23      *[BGP/170] <age>, localpref 100
                      AS path: 65002 I, validation-state: unverified
                    >  to 10.0.23.1 via ge-0/0/0.0
```

On upstream the 172.16.0.0/23 entry is BGP with AS path 65002 and next hop 10.0.23.1. That shows the summary crossed the session from hq. To confirm nothing else came across, repeat the two exact-prefix queries for the /24s on upstream. As at baseline, they must return nothing.

### Why it works

An aggregate route is active while at least one more specific route contributes to it. Here the two connected /24s do, and the hq output shows it active with preference 130. The summary is not sent by default, though. eBGP does not advertise routes from other protocols unless an export policy allows them. The policy therefore accepts routes whose protocol is aggregate. A final reject keeps the connected /24s from leaving hq. The upstream output shows the result, one BGP route for the /23 with next hop 10.0.23.1 and no specifics, so upstream sees the summary and nothing more.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Creating the aggregate but no export policy | upstream has no 172.16.0.0/23. | hq shows the Aggregate route but upstream does not. The BGP session is still Established, which makes it look healthy. |
| Exporting direct routes as well as the aggregate | upstream shows the specifics next to the summary. | upstream lists 172.16.0.0/24 and 172.16.1.0/24 and the baseline no-specifics checks now fail. Tighten the policy so only the aggregate is accepted and everything else is rejected. |

## Stage 3 — Make a conditional default

### Configuration

This goes on branch. There are two parts: a policy that accepts static routes, and a generated route for 0.0.0.0/0 that uses that policy to pick its contributors. Load both and commit.

On `branch`:

```
set policy-options policy-statement default-contributor term hq-nets from protocol static
set policy-options policy-statement default-contributor term hq-nets from route-filter 172.16.0.0/23 longer
set policy-options policy-statement default-contributor term hq-nets then accept
set policy-options policy-statement default-contributor term rest then reject
set routing-options generate route 0.0.0.0/0 policy default-contributor
```

### Verification

On `branch` — branch has a generated default route via hq

```
show route table inet.0 0.0.0.0/0 exact

inet.0: 6 destinations, 6 routes (6 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

0.0.0.0/0          *[Aggregate/130] <age>
                    >  to 10.0.12.2 via ge-0/0/0.0
```

The 0.0.0.0/0 entry is protocol Aggregate, not Static, with next hop 10.0.12.2 out of ge-0/0/0.0. The protocol column is the point. It shows the route was generated from contributors and was not typed in.

### Why it works

A generated route is installed only while a contributing route accepted by its policy is active. The contributors here are the static routes to 172.16.0.0/24 and 172.16.1.0/24 from stage 1. The default takes the next hop of the contributor it selects, which is 10.0.12.2, and appears as Aggregate with preference 130. If the contributors go away, the default goes with them. That is the conditional behaviour a static default cannot give you.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Configuring a static default route instead of a generated route | The default stays when the contributors disappear. | The route table shows protocol Static for 0.0.0.0/0. |
| Writing a policy that matches no route | No 0.0.0.0/0 route appears. | The configuration commits but the route table has no default, because no contributing route is accepted and the generated route stays inactive. Check that the stage 1 static routes are present and that the policy accepts the Static protocol. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `upstream` — upstream has no 172.16.0.0/24

```
show route table inet.0 172.16.0.0/24 exact
```

On `upstream` — upstream has no 172.16.1.0/24

```
show route table inet.0 172.16.1.0/24 exact
```

On `hq` — hq BGP session to upstream is established

```
show bgp summary

Threading mode: BGP I/O
Default eBGP mode: advertise - accept, receive - accept
Groups: 1 Peers: 1 Down peers: 0
Table          Tot Paths  Act Paths Suppressed    History Damp State    Pending
inet.0
                       0          0          0          0          0          0
Peer                     AS      InPkt     OutPkt    OutQ   Flaps Last Up/Dwn State|#Active/Received/Accepted/Damped...
10.0.23.2             65003         22         22       0       0        <age> Establ
  inet.0: 0/0/0/0
```

On `branch` — branch reaches hq on the shared link

```
ping 10.0.12.2 count 5

PING 10.0.12.2 (10.0.12.2): 56 data bytes
<counter> bytes from 10.0.12.2: icmp_seq=0 ttl=64 time=1.766 ms
<counter> bytes from 10.0.12.2: icmp_seq=1 ttl=64 time=2.124 ms
<counter> bytes from 10.0.12.2: icmp_seq=2 ttl=64 time=1.671 ms
<counter> bytes from 10.0.12.2: icmp_seq=3 ttl=64 time=1.838 ms
<counter> bytes from 10.0.12.2: icmp_seq=4 ttl=64 time=1.810 ms

--- 10.0.12.2 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 1.671/1.842/2.124/0.152 ms
```

On `branch` — branch ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.12.1/30
                                   multiservice
```

On `upstream` — upstream ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.23.2/30
                                   multiservice
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Values that differ from one run to the next, such as ages, counters and assigned identifiers, are shown masked, so your own output will differ in those places and nowhere else.

- Authoring run: `a0919ux7`
- Rehearsal receipt: `static-aggregate-generated-routes-3n-2026-09-19-06806b9a63ca`
