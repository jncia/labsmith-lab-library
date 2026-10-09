# Solutions — Selective ICMP Access to Local Router Endpoints

Both stages edit the filter lo0-icmp on r1. The baseline checks show the starting point: ge-0/0/0 and ge-0/0/1 are up, all four loopback addresses are Direct routes in inet.0, and 192.0.2.254 answers. The filter therefore affects only the three service addresses.

## Stage 1 — Restore the first service

### Configuration

Apply this on r1 in configuration mode, then commit. It changes the deny term of lo0-icmp so it no longer matches 192.0.2.10.

On `r1`:

```
delete firewall family inet filter lo0-icmp term deny-icmp from destination-address 192.0.2.10/32
```

### Verification

On `r1` — Three replies from 192.0.2.10

```
ping 192.0.2.10 count 3

PING 192.0.2.10 (192.0.2.10): 56 data bytes
<counter> bytes from 192.0.2.10: icmp_seq=0 ttl=64 time=0.071 ms
<counter> bytes from 192.0.2.10: icmp_seq=1 ttl=64 time=0.082 ms
<counter> bytes from 192.0.2.10: icmp_seq=2 ttl=64 time=0.065 ms

--- 192.0.2.10 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.065/0.073/0.082/0.007 ms
```

The ping to 192.0.2.10 reports 0% packet loss with three packets received. Before the change the same ping would have lost every packet. Replies prove the discard term no longer matches .10 and a later term accepts it.

### Why it works

The deny term matched ICMP to .10 and .20, so it discarded the packet before the accept term was reached. Once .10 is out of that term's match, the packet falls through to the accept-all term and is delivered to lo0.0. The ping in s1-10 shows no loss. Removing the whole term would also make .10 answer, but it would leave nothing to deny .30 in stage two.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Removing the whole filter or the deny term | All three service addresses answer, and .30 can no longer be denied without rebuilding the term. | A ping to 192.0.2.30 shows 0% packet loss after stage one. |
| Forgetting to commit | The ping to .10 still shows 100% packet loss. | The candidate configuration shows the change but the running behaviour has not changed. |

## Stage 2 — Complete the service access policy

### Configuration

Apply this on r1 in configuration mode, then commit. Keep .10 out of the deny match, take .20 out of it as well, and add a term that discards ICMP to 192.0.2.30 before the accept-all term.

On `r1`:

```
delete firewall family inet filter lo0-icmp term deny-icmp from destination-address 192.0.2.20/32
set firewall family inet filter lo0-icmp term deny-icmp from destination-address 192.0.2.30/32
```

### Verification

On `r1` — Three replies from 192.0.2.20

```
ping 192.0.2.20 count 3

PING 192.0.2.20 (192.0.2.20): 56 data bytes
<counter> bytes from 192.0.2.20: icmp_seq=0 ttl=64 time=0.039 ms
<counter> bytes from 192.0.2.20: icmp_seq=1 ttl=64 time=0.032 ms
<counter> bytes from 192.0.2.20: icmp_seq=2 ttl=64 time=0.134 ms

--- 192.0.2.20 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.032/0.068/0.134/0.047 ms
```

The ping to 192.0.2.20 reports 0% packet loss with three packets received. This proves .20 is no longer discarded.

On `r1` — No replies from 192.0.2.30

```
ping 192.0.2.30 count 3

PING 192.0.2.30 (192.0.2.30): 56 data bytes

--- 192.0.2.30 ping statistics ---
<counter> packets transmitted, <counter> packets received, 100% packet loss
```

The ping to 192.0.2.30 reports 100% packet loss and no reply lines. This is the wanted result: the deny term now matches .30 and discards it.

### Why it works

The filter is evaluated top to bottom. ICMP to .30 meets the deny term first and is discarded, so s2-30 shows no replies. ICMP to .10 and .20 matches no deny term, reaches the accept-all term and is delivered, so s2-20 shows no loss. The deny term has to sit before the accept-all term. Anything after it is never reached.

### Common mistakes

| Mistake | What it produces | How to tell |
| --- | --- | --- |
| Placing the discard term for .30 after the accept term | .30 still answers. | The ping to 192.0.2.30 shows 0% packet loss. Check the term order in the filter. |
| Matching all ICMP in the deny term instead of only .30 | .10 and .20 stop answering again. | The pings to .10 or .20 show 100% packet loss. |

## What had to stay working

These outcomes were true before the first stage and were still true after the last one. They are what a solution must not break.

On `r1` — Three replies from diagnostic 192.0.2.254

```
ping 192.0.2.254 count 3

PING 192.0.2.254 (192.0.2.254): 56 data bytes
<counter> bytes from 192.0.2.254: icmp_seq=0 ttl=64 time=0.038 ms
<counter> bytes from 192.0.2.254: icmp_seq=1 ttl=64 time=0.075 ms
<counter> bytes from 192.0.2.254: icmp_seq=2 ttl=64 time=0.093 ms

--- 192.0.2.254 ping statistics ---
<counter> packets transmitted, <counter> packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.038/0.069/0.093/0.023 ms
```

On `r1` — ge-0/0/0 up

```
show interfaces ge-0/0/0 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     198.51.100.1/30
                                   multiservice
```

On `r1` — ge-0/0/1 up

```
show interfaces ge-0/0/1 terse

Interface               Admin Link Proto    Local                 Remote
ge-0/0/1                up    up
ge-0/0/1.0              up    up   inet     198.51.100.5/30
                                   multiservice
```

On `r1` — Direct route 192.0.2.10/32

```
show route table inet.0 192.0.2.10/32 exact

inet.0: 8 destinations, 8 routes (8 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.10/32      *[Direct/0] <age>
                    >  via lo0.0
```

On `r1` — Direct route 192.0.2.20/32

```
show route table inet.0 192.0.2.20/32 exact

inet.0: 8 destinations, 8 routes (8 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.20/32      *[Direct/0] <age>
                    >  via lo0.0
```

On `r1` — Direct route 192.0.2.30/32

```
show route table inet.0 192.0.2.30/32 exact

inet.0: 8 destinations, 8 routes (8 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.30/32      *[Direct/0] <age>
                    >  via lo0.0
```

On `r1` — Direct route 192.0.2.254/32

```
show route table inet.0 192.0.2.254/32 exact

inet.0: 8 destinations, 8 routes (8 active, 0 holddown, 0 hidden)
+ = Active Route, - = Last Active, * = Both

192.0.2.254/32     *[Direct/0] <age>
                    >  via lo0.0
```

## Provenance

Every command and its output above were captured on a lab deployed from these files, taken to the start state, and driven through the stages with the reference configuration exactly as it is written here. Some values that vary between runs, such as ages and counters, use placeholders. Timings and assigned identifiers may also differ in your own run.

- Authoring run: `a10087ur`
- Rehearsal receipt: `jncia-loopback-filter-1n-2026-10-09-5ae79d8e23be`
