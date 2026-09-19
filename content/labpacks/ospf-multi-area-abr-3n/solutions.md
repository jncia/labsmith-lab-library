# Solutions — Split a growing OSPF network into a backbone and a second area

Both stages are small changes on two routers: abr and access. Stage 1 forms the adjacency and creates the border. Stage 2 adds the access loopback so the backbone learns it. In both, the captured output shows the effect on the routing tables. The metric and next hop on each route tell you which router originated it and which way it came.

## Stage 1 — Join the access router in area 1

### Configuration

Apply the reference configuration in configuration mode on two routers. On abr, add ge-0/0/1.0 to area 0.0.0.1 as a point-to-point interface. On access, add ge-0/0/0.0 to area 0.0.0.1 the same way. Commit on both. The core-abr side is already in place and needs no change. When abr has interfaces in both area 0.0.0.0 and area 0.0.0.1, it acts as the ABR without any further statement.

On `abr`:

```
set protocols ospf area 0.0.0.1 interface ge-0/0/1.0 interface-type p2p
```

On `access`:

```
set protocols ospf area 0.0.0.1 interface ge-0/0/0.0 interface-type p2p
```

### Verification

On `access` — Access has an OSPF route to the core loopback

```
show route table inet.0 10.255.0.1/32 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.1/32      *[OSPF/10] <age>, metric 2
                    >  to 10.0.23.1 via ge-0/0/0.0
```

Access now holds 10.255.0.1/32 as an OSPF route with metric 2 and next hop 10.0.23.1 out ge-0/0/0.0. That next hop is abr's address on the access link. The core loopback lives in area 0, so access can only have learned it through abr's inter-area advertisement. The metric of 2 is the access-abr link plus the abr-core hop.

On `access` — Access has an OSPF route to the core-abr link

```
show route table inet.0 10.0.12.0/30 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.0.12.0/30       *[OSPF/10] <age>, metric 2
                    >  to 10.0.23.1 via ge-0/0/0.0
```

10.0.12.0/30, the core-abr link, is present on access as an OSPF route with metric 2 through the same next hop 10.0.23.1. Access does not touch that link. It is another area 0 prefix that abr passes into area 1.

On `access` — Access pings the core loopback

```
ping 10.255.0.1 count 3

PING 10.255.0.1 (10.255.0.1): 56 data bytes
<counter> bytes from 10.255.0.1: icmp_seq=0 ttl=63 time=2.652 ms
<counter> bytes from 10.255.0.1: icmp_seq=1 ttl=63 time=3.292 ms
<counter> bytes from 10.255.0.1: icmp_seq=2 ttl=63 time=3.025 ms

--- 10.255.0.1 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 2.652/2.990/3.292/0.262 ms
```

Three packets sent, three received, 0% packet loss. Access reaches 10.255.0.1, so the forward path works. The reply also came back, so core has a route back to the access-facing subnet. That is the other half of what this stage proves.

### Why it works

With ge-0/0/1 on abr and ge-0/0/0 on access both in area 0.0.0.1, the two ends agree on the area and the adjacency forms. abr now has one interface in area 0 and one in area 1, which is what makes it an area border router. It floods the area 0 prefixes into area 1 as inter-area routes, and that is what the captured routes on access show. Both 10.255.0.1/32 and 10.0.12.0/30 point at 10.0.23.1 and both carry metric 2. That metric is the cost to abr plus abr's cost to the prefix. In the other direction abr advertises the 10.0.23.0/30 link into area 0, so core has a return route. That is why the ping from access succeeds even though core was never touched.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Putting the access uplink in area 0 instead of area 1, or using different areas on the two ends | No OSPF neighbour forms on the abr-access link, and access has no OSPF routes. | show ospf neighbor is empty on access. If the areas differ, the hellos are dropped because of an area mismatch. Compare the area shown in show ospf interface on both ends. |
| Configuring only access and forgetting the abr side of the link | Access has no neighbour and no OSPF routes, and abr is not a border router. | show ospf interface on abr does not list ge-0/0/1.0, and show ospf neighbor on abr shows only core. |

## Stage 2 — Advertise the access loopback across the border

### Configuration

Apply on access only. Add lo0.0 to area 0.0.0.1 and mark it passive, as the design table says. Commit. abr and core need no change, because abr already translates area 1 prefixes into area 0.

On `access`:

```
set protocols ospf area 0.0.0.1 interface lo0.0 passive
```

### Verification

On `abr` — abr has an OSPF route to the access loopback

```
show route table inet.0 10.255.0.3/32 exact

inet.0: 8 destinations, 8 routes (8 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.3/32      *[OSPF/10] <age>, metric 1
                    >  to 10.0.23.2 via ge-0/0/1.0
```

abr has 10.255.0.3/32 as an OSPF route with metric 1 and next hop 10.0.23.2 out ge-0/0/1.0. That is access's own address on the shared link. abr learned the loopback directly from access inside area 1.

On `core` — Core has an OSPF route to the access loopback

```
show route table inet.0 10.255.0.3/32 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.3/32      *[OSPF/10] <age>, metric 2
                    >  to 10.0.12.2 via ge-0/0/0.0
```

core has the same prefix as an OSPF route with metric 2 and next hop 10.0.12.2 out ge-0/0/0.0, which is abr. The metric is one higher than on abr because of the core-abr link. The route reached core because abr re-advertised it into area 0.

On `core` — Core pings the access loopback

```
ping 10.255.0.3 count 3

PING 10.255.0.3 (10.255.0.3): 56 data bytes
<counter> bytes from 10.255.0.3: icmp_seq=0 ttl=63 time=2.333 ms
<counter> bytes from 10.255.0.3: icmp_seq=1 ttl=63 time=2.985 ms
<counter> bytes from 10.255.0.3: icmp_seq=2 ttl=63 time=4.523 ms

--- 10.255.0.3 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 2.333/3.280/4.523/0.918 ms
```

Three of three replies, 0% packet loss, from 10.255.0.3. Core reaches the access loopback across the border. This closes the loop. Access already reached core in stage 1, and now core reaches access.

### Why it works

When lo0.0 is placed in area 0.0.0.1 on access, 10.255.0.3/32 is included in access's area 1 advertisement. Because the interface is passive, the prefix is advertised but no adjacency is attempted on the loopback. abr sees it as an intra-area route in area 1 (metric 1, next hop 10.0.23.2), then advertises it into area 0 as an inter-area route. Core installs it with metric 2 via 10.0.12.2. Nothing had to be done on abr or core, which is the point of an ABR. The return path for the ping was already there from stage 1.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Leaving the access loopback out of OSPF | Core and abr have no route to 10.255.0.3, and the ping from core fails. | show route 10.255.0.3 on core and abr returns nothing. On access, show ospf interface does not list lo0.0. |
| Placing the access loopback in area 0 on access | Access now has an area 0 interface but no backbone adjacency, so the loopback is not carried across the border and core still has no route for 10.255.0.3. | show ospf interface on access lists lo0.0 in area 0.0.0.0, while the uplink is in area 0.0.0.1, and core has no route for 10.255.0.3. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `core` — core ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.12.1/30
                                   multiservice
```

On `abr` — abr ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.12.2/30
                                   multiservice
```

On `abr` — abr ge-0/0/1 is up

```
show interfaces ge-0/0/1 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/1                up    up
ge-0/0/1.0              up    up   inet     10.0.23.1/30
                                   multiservice
```

On `access` — access ge-0/0/0 is up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.23.2/30
                                   multiservice
```

On `core` — core has an OSPF route to the abr loopback

```
show route table inet.0 10.255.0.2/32 exact

inet.0: 7 destinations, 7 routes (7 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.2/32      *[OSPF/10] <age>, metric 1
                    >  to 10.0.12.2 via ge-0/0/0.0
```

On `abr` — abr has an OSPF route to the core loopback

```
show route table inet.0 10.255.0.1/32 exact

inet.0: 8 destinations, 8 routes (8 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

10.255.0.1/32      *[OSPF/10] <age>, metric 1
                    >  to 10.0.12.1 via ge-0/0/0.0
```

On `core` — core pings the abr loopback

```
ping 10.255.0.2 count 3

PING 10.255.0.2 (10.255.0.2): 56 data bytes
<counter> bytes from 10.255.0.2: icmp_seq=0 ttl=64 time=2.063 ms
<counter> bytes from 10.255.0.2: icmp_seq=1 ttl=64 time=2.117 ms
<counter> bytes from 10.255.0.2: icmp_seq=2 ttl=64 time=1.907 ms

--- 10.255.0.2 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 1.907/2.029/2.117/0.089 ms
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Values that differ from one run to the next, such as ages, counters and assigned identifiers, are shown masked, so your own output will differ in those places and nowhere else.

- Authoring run: `a09193q1`
- Rehearsal receipt: `ospf-multi-area-abr-3n-2026-09-19-fb1c03f8281c`
