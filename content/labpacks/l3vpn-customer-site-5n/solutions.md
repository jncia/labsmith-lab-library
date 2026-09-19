# Solutions — Bring a Customer Site Back onto the L3VPN and the Layer 2 Circuit

Reference answers for both stages, with the verification output that proves them.

Captured output marked **live-verified** is reproduced verbatim from a LabSmith live run of the
same topology and the same finished configuration (run `live-sp-vpn-wrong-rt-variant-20260707`, captured
2026-07-07T23:16:28+00:00, Junos 26.2R1.7, containerlab 0.77.0). Volatile fields —
route ages, timestamps, counters and MPLS label values — are masked as `<age>`, `<timestamp>`,
`<counter>` and `<label>`, so your own output will differ in exactly those places and nowhere
else. All output below was captured from the live lab during qualification.

---

## Stage 1 — Restore the customer routing instance on pe1

### Configuration

On `pe1`:

```text
set routing-instances CUST-A instance-type vrf
set routing-instances CUST-A routing-options autonomous-system 65000
set routing-instances CUST-A protocols bgp group CE type external
set routing-instances CUST-A protocols bgp group CE neighbor 172.16.11.2 peer-as 65100
set routing-instances CUST-A protocols bgp group CE neighbor 172.16.11.2 as-override
set routing-instances CUST-A interface ge-0/0/0.0
set routing-instances CUST-A route-distinguisher 65000:101
set routing-instances CUST-A vrf-target target:65000:100
```

Commit as one change. These eight statements are the whole delta; nothing else on `pe1` and
nothing on any other node needs to change.

### Verification

`pe1` — the remote site prefix in the customer table (**live-verified**):

```text
show route table CUST-A.inet.0 198.51.100.1/32 exact
```

```text
CUST-A.inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

198.51.100.1/32    *[BGP/170] <age>, localpref 100, from 10.255.0.2
                      AS path: 65100 I, validation-state: unverified
                    >  to 10.0.12.1 via ge-0/0/1.0, Push <label>, Push <label>(top)
```

`ce1` — the customer's own view, that the site reached through `pe1` has the other site's prefix
and can reach it (**live-verified**):

```text
show route table SITE1.inet.0 198.51.100.1/32 exact
ping routing-instance SITE1 198.51.100.1 count 3
```

```text
ce1> show route table SITE1.inet.0 198.51.100.1/32 exact
SITE1.inet.0: 5 destinations, 5 routes (5 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

198.51.100.1/32    *[BGP/170] 00:00:31, localpref 100
                      AS path: 65000 65000 I, validation-state: unverified
                    >  to 172.16.11.1 via ge-0/0/0.0

ce1> ping routing-instance SITE1 198.51.100.1 count 3
PING 198.51.100.1 (198.51.100.1): 56 data bytes
64 bytes from 198.51.100.1: icmp_seq=0 ttl=61 time=3.889 ms
64 bytes from 198.51.100.1: icmp_seq=1 ttl=61 time=3.800 ms
64 bytes from 198.51.100.1: icmp_seq=2 ttl=61 time=4.782 ms

--- 198.51.100.1 ping statistics ---
3 packets transmitted, 3 packets received, 0% packet loss
round-trip min/avg/max/stddev = 3.800/4.157/4.782/0.443 ms
```

`p1` — the core state you were required not to disturb (**live-verified**):

```text
show bgp summary
show ldp session
```

```text
p1> show bgp summary
Threading mode: BGP I/O
Default eBGP mode: advertise - accept, receive - accept
Groups: 1 Peers: 2 Down peers: 0
Table          Tot Paths  Act Paths Suppressed    History Damp State    Pending
bgp.l3vpn.0
                       4          4          0          0          0          0
Peer                     AS      InPkt     OutPkt    OutQ   Flaps Last Up/Dwn State|#Active/Received/Accepted/Damped...
10.255.0.1            65000         10          9       0       0        1:38 Establ
  bgp.l3vpn.0: 2/2/2/0
10.255.0.3            65000          7          5       0       0        1:09 Establ
  bgp.l3vpn.0: 2/2/2/0

p1> show ldp session
  Address                           State       Connection  Hold time  Adv. Mode
10.255.0.1                          Operational Open          29         DU
10.255.0.3                          Operational Open          29         DU
```

### Why it works

Read the verified output backwards and every statement earns its place.

- `instance-type vrf` is what creates `CUST-A.inet.0` at all. Without it the customer's routes
  would land in the provider's own `inet.0`, which is the thing an L3VPN exists to avoid.
- `route-distinguisher 65000:101` makes `pe1`'s advertisement of a customer prefix globally
  unique. The same customer uses the same address space at both sites, so the route distinguisher
  is what stops site 1's and site 2's advertisements from colliding in the provider's VPN table.
  It is per-instance-per-router; `pe2` uses `65000:102` for its own instance.
- `vrf-target target:65000:100` is the membership statement, and it does two jobs in one line: it
  attaches that route target to every route `pe1` exports out of `CUST-A`, and it imports every VPN
  route that arrives carrying it. `pe2` uses the same value, which is the entire reason the two
  instances are one VPN. This is the agreement that is independent of BGP session state — which is
  why a wrong value here leaves every session up and the table empty.
- `interface ge-0/0/0.0` moves the customer access link out of the provider's table and into the
  instance. Until it is there, the external session to `172.16.11.2` cannot come up inside
  `CUST-A`.
- `protocols bgp group CE type external` with `neighbor 172.16.11.2 peer-as 65100` is the session
  to the customer, configured inside the instance rather than under the router's main BGP.
- `as-override` matters because both customer sites are autonomous system 65100. Without it, the
  prefix `pe1` advertises toward `ce1` still carries 65100 in its AS path, `ce1` sees its own
  autonomous system and discards the route as a loop. `pe1`'s own table would look perfectly
  correct while the customer remained unable to reach anything — which is why this stage's
  "done when" includes the customer's view and not only `CUST-A.inet.0`.
- `routing-options autonomous-system 65000` inside the instance pins the local autonomous system
  the instance's BGP uses toward the customer.

The verified output shows the rest. The route is learned `from 10.255.0.2`, the route reflector,
which carries VPN routes without holding a customer instance of its own. Its next hop is
`to 10.0.12.1 via ge-0/0/1.0, Push <label>, Push <label>(top)` — two labels: the inner one is the
VPN label `pe2` advertised with the route, the outer one is the LDP transport label to
`10.255.0.3`. That transport already existed before you started, which is why this stage needed no
change in the core.

### Common mistakes

- **Wrong route target.** Any value other than `target:65000:100` — including `pe2`'s route
  distinguisher `65000:102`, or `65000:101` copied from the route-distinguisher line — leaves both
  BGP sessions established and `CUST-A.inet.0` without the remote prefix. This is the single most
  common L3VPN failure, and the symptom is deliberately quiet.
- **Reusing pe2's route distinguisher.** `65000:102` commits without complaint. The design pins
  `65000:101` for `pe1` because a route distinguisher identifies *this* site's advertisement; two
  sites sharing one stops the provider's VPN table from telling them apart.
- **Forgetting `interface ge-0/0/0.0`.** The instance exists, the route target is right, but the
  access link is still in the provider's table, so there is no customer session and nothing to
  export.
- **Omitting `as-override`.** `pe1` looks finished and the customer is still broken. Check from
  `ce1`, not only from `pe1`.
- **Configuring the customer session under the router's main `protocols bgp`.** It will commit and
  the session may even establish, but the routes will not be in the customer's instance.
- **Committing the interface into the instance while leaving its address configured somewhere
  else.** The address stays on the physical interface under `interfaces`; only the logical unit is
  referenced from the instance.

---

## Stage 2 — Restore the layer 2 circuit on pe1

### Configuration

On `pe1`:

```text
set interfaces ge-0/0/2 encapsulation ethernet-ccc
set interfaces ge-0/0/2 unit 0 family ccc
set protocols l2circuit neighbor 10.255.0.3 interface ge-0/0/2.0 virtual-circuit-id 200
```

Commit as one change. The `protocols l2circuit` statement references a logical unit that has to
already be a circuit unit, so applying it without the two interface statements in the same commit
is either rejected outright or leaves the circuit down on an encapsulation error.

### Verification

`pe1` — the circuit to the remote provider edge (**live-verified**):

```text
show l2circuit connections
```

```text
Layer-2 Circuit Connections:

Legend for connection status (St)
EI -- encapsulation invalid      NP -- interface h/w not present
MM -- mtu mismatch               Dn -- down
EM -- encapsulation mismatch     VC-Dn -- Virtual circuit Down
CM -- control-word mismatch      Up -- operational
VM -- vlan id mismatch		 CF -- Call admission control failure
OL -- no outgoing label          IB -- TDM incompatible bitrate
NC -- intf encaps not CCC/TCC    TM -- TDM misconfiguration
BK -- Backup Connection          ST -- Standby Connection
CB -- rcvd cell-bundle size bad  SP -- Static Pseudowire
LD -- local site signaled down   RS -- remote site standby
RD -- remote site signaled down  HS -- Hot-standby Connection
XX -- unknown

Legend for interface status
Up -- operational
Dn -- down
Neighbor: 10.255.0.3
    Interface                 Type  St     Time last up          # Up trans
    ge-0/0/2.0(vc 200)        rmt   Up     <timestamp>           1
      Remote PE: 10.255.0.3, Negotiated control-word: Yes (Null)
      Incoming label: <label>, Outgoing label: <label>
      Negotiated PW status TLV: No
      Local interface: ge-0/0/2.0, Status: Up, Encapsulation: ETHERNET
      Flow Label Transmit: No, Flow Label Receive: No
```

`pe2` — the far end's matching view (**live-verified**):

```text
show l2circuit connections
```

```text
pe2> show l2circuit connections
Layer-2 Circuit Connections:

Legend for connection status (St)
EI -- encapsulation invalid      NP -- interface h/w not present
MM -- mtu mismatch               Dn -- down
EM -- encapsulation mismatch     VC-Dn -- Virtual circuit Down
CM -- control-word mismatch      Up -- operational
VM -- vlan id mismatch		 CF -- Call admission control failure
OL -- no outgoing label          IB -- TDM incompatible bitrate
NC -- intf encaps not CCC/TCC    TM -- TDM misconfiguration
BK -- Backup Connection          ST -- Standby Connection
CB -- rcvd cell-bundle size bad  SP -- Static Pseudowire
LD -- local site signaled down   RS -- remote site standby
RD -- remote site signaled down  HS -- Hot-standby Connection
XX -- unknown

Legend for interface status
Up -- operational
Dn -- down
Neighbor: 10.255.0.1
    Interface                 Type  St     Time last up          # Up trans
    ge-0/0/2.0(vc 200)        rmt   Up     Sep 19 05:05:53 2026           1
      Remote PE: 10.255.0.1, Negotiated control-word: Yes (Null)
      Incoming label: 299776, Outgoing label: 299824
      Negotiated PW status TLV: No
      Local interface: ge-0/0/2.0, Status: Up, Encapsulation: ETHERNET
      Flow Label Transmit: No, Flow Label Receive: No
```

### Why it works

- `encapsulation ethernet-ccc` on the physical interface changes what the port *is*. A routed port
  terminates frames and looks at the packet inside; a circuit cross-connect port carries the frame
  onward untouched. This is the statement the customer's segment depends on, and it is why
  `ge-0/0/2` carries no address anywhere in this lab.
- `unit 0 family ccc` gives the logical unit the family that a circuit can be bound to, the same
  way a routed unit needs `family inet`.
- `protocols l2circuit neighbor 10.255.0.3 interface ge-0/0/2.0 virtual-circuit-id 200` binds that
  unit to a pseudowire. The neighbour is the remote provider edge's **loopback**, because the
  pseudowire is signalled by targeted LDP to a transport endpoint, not across a link. The virtual
  circuit identifier is how the two ends recognise each other's half of the same service, so it
  must match: `pe2` carries the mirror statement, pointing at `10.255.0.1` with the same `200`.
- Nothing is added to the core. The verified output's `rmt` type and `Up` status depend on the LDP
  session to `10.255.0.3` that the baseline checks already prove, and on the label path the core
  was already providing for stage 1.

In the verified output, `ge-0/0/2.0(vc 200)` is `Up` with `# Up trans 1` — it came up once and
stayed up — `Remote PE: 10.255.0.3` confirms which end it found, and
`Local interface: ge-0/0/2.0, Status: Up, Encapsulation: ETHERNET` confirms the access port is
presenting the segment rather than routing it.

### Common mistakes

- **Using a link address as the neighbour.** `10.0.12.1` or `10.0.23.1` looks like the path to
  `pe2`, but targeted LDP will not establish to it and the circuit never comes up. The neighbour
  is always the remote loopback.
- **Mismatched virtual circuit identifier.** Each end signals its own. The connection appears with
  a status code from the legend in the output above rather than `Up`.
- **Leaving the access port routed.** No `encapsulation ethernet-ccc`, or a leftover
  `family inet` on the unit, produces an encapsulation status code (`EI`, `EM` or `NC` in the
  legend) instead of `Up`.
- **Binding the wrong unit.** `family ccc` on one unit while the circuit references
  `ge-0/0/2.0` leaves the circuit down with nothing obviously wrong in either half.
- **Regressing stage 1.** Tidying `pe1`'s interface configuration while adding the circuit is the
  easy way to delete the customer instance you just built. The stage's own "done when" includes
  stage 1 still passing, and qualification re-runs stage 1's check after stage 2.

---

## Provenance and derivation

This packet is derived mechanically from LabSmith's live-verified material for the
`sp-vpn-floor-5n` archetype. Nothing in it is invented network design.

- **Finished state.** `configs/*.set` for `ce1`, `ce2`, `p1` and `pe2` are the archetype baseline
  files byte for byte. `pe1`'s finished state is the archetype baseline for `pe1`.
- **The split.** `pe1`'s 27 baseline statements are partitioned into three files with no
  additions, no edits and no reordering: 16 stay in `configs/pe1.set` as the start state, the 8
  `routing-instances CUST-A` statements become stage 1's solution, and the 3 statements that exist
  only to carry the layer 2 circuit — the two `interfaces ge-0/0/2` statements and the
  `protocols l2circuit` statement — become stage 2's solution. Concatenating the three files
  reproduces the archetype baseline exactly.
- **The second form of the start state.** `configs/*.cfg` is the same start state hierarchically,
  and it is what the topology hands each router at boot. Every one of those files was read back
  off a live router that had just been given the matching `.set` statements, by
  `labpack export-start-configs`, for exactly the hierarchy the `.set` file owns. No file was
  converted by hand, and no statement was written twice.
- **Why stage 2 includes the interface statements.** "Restore the layer 2 circuit statements"
  could be read as the single `protocols l2circuit` line. It is taken here as every `pe1`
  statement whose only purpose is the circuit, which adds the CCC access-port encapsulation and
  family. That keeps the start state free of an orphaned circuit-encapsulated port with no
  circuit, and it makes the stage teach the whole mechanism. The finished state is identical
  either way.
- **Checks.** Stage 1's first check is the golden package's `pe1-remote-vrf-route` assertion;
  stage 2's first is its `pe1-l2circuit-up` assertion; both are copied field for field. The rest
  are archetype baseline assertions, also copied field for field, that cover the remaining
  "you're done when" statements in the workbook: `ce1-site1-remote-loopback` and
  `ce1-site1-ping-remote-loopback` for stage 1 (the customer learns the remote site and can reach
  it), and `pe2-l2circuit-up` for stage 2 (both ends agree). The golden's third
  assertion is the negated variant used for its broken-route-target demonstration and does not
  apply to a build lab. `checks/baseline.yaml` is the four archetype baseline assertions that
  still hold once `pe1`'s customer configuration is removed — the route reflector's two VPN
  sessions and its two LDP sessions. The archetype's other eight baseline assertions all depend on
  `pe1`'s customer configuration, so they fail in the start state by construction and cannot be
  baseline checks here; five of them are the stage checks above.
- **Captured output.** Stage 1's verification output is the golden's `step-01-good-route` event.
  Stage 2's is the layer 2 circuit portion of its `step-03-restore-route-target` event, which is
  the same `show l2circuit connections` capture against the same finished configuration.

### Notes for whoever qualifies this packet

- `pe2` carries the mirror image of both services. A learner with access to all five nodes can
  read the answer's shape off `pe2`. That is inherent to restoring one provider edge inside a
  working core, and it is how the work would really be done, so the workbook says so plainly
  rather than pretending otherwise.
- Both stages remove a whole configuration subtree from the start state
  (`routing-instances CUST-A`, `protocols l2circuit`, `interfaces ge-0/0/2`), so the reference
  solution adds sections the start configuration never mentions. Qualification run 3 restores the
  start state by deleting every such section, leaving alone only what the node carried before the
  packet configured it; on `pe1` that is exactly those three deletions. That reset has been proved
  offline only, so the first live qualification of this packet is also its first live proof.
- No ping check exists for the layer 2 circuit. `ce2`'s two interfaces are the two addresses of one
  `/31` in one routing instance, so it has a local route to the far address and a ping from `ce2`
  would not cross the pseudowire. The archetype has no such assertion either; the circuit is proven
  by its own state on both provider edges.
