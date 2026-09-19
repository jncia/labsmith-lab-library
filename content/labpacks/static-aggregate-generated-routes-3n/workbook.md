# Summarise a branch's routes with static, aggregate and generated routes

Finish the routing on a three-router line, branch, hq and upstream. Give branch static routes to two subnets that hq owns, build one /23 summary on hq and pass only that to upstream over eBGP, then create a default on branch that exists only while the routes through hq exist. The finished tables show static, aggregate and generated routes.

## Scenario

You've taken over a small three-router network. branch connects to hq, and hq connects to upstream. hq owns two small subnets, 172.16.0.0/24 and 172.16.1.0/24, and branch has to reach them. upstream sits in a different AS and has no business knowing about two separate small prefixes. It should see one summary. branch also needs a default route towards hq, but only while the path to hq is alive. If the routes behind hq go away, the default has to go with them. You have three jobs: give branch the routes it lacks, summarise on hq for upstream, and make the default on branch depend on the routes that justify it.

## Before you start

Deploy the lab from `topology.clab.yml` in this directory and wait until every node answers. Each node boots into the start state from its own file under `configs/`, so there is nothing to apply by hand before you begin. `lab.yaml` records how much memory and how many cores the lab needs and where the node images come from.

If your own image is tagged differently, set `VJUNOS_ROUTER_IMAGE` before you deploy; the topology takes the tag from the environment and falls back to the default it names.

## Topology

| Node | Role |
| --- | --- |
| branch | Branch router that needs the remote subnets and a conditional default |
| hq | Headquarters router that owns the remote subnets and builds the summary |
| upstream | Upstream router that should only see the summary |

- `branch ge-0/0/0` to `hq ge-0/0/0`
- `hq ge-0/0/1` to `upstream ge-0/0/0`

These are the interface names to use. Nothing in this lab needs any other interface.

## Addressing

| Router | Interface | Address |
| --- | --- | --- |
| branch | ge-0/0/0 | 10.0.12.1/30 |
| hq | ge-0/0/0 | 10.0.12.2/30 |
| hq | ge-0/0/1 | 10.0.23.1/30 |
| upstream | ge-0/0/0 | 10.0.23.2/30 |
| hq | lo0.0 | 192.168.255.2/32, 172.16.0.1/24, 172.16.1.1/24 |

## BGP

| Router | AS | Peer |
| --- | --- | --- |
| hq | 65002 | 10.0.23.2 (AS 65003) |
| upstream | 65003 | 10.0.23.1 (AS 65002) |

## Design values

| Item | Value |
| --- | --- |
| Remote subnets | 172.16.0.0/24 and 172.16.1.0/24 |
| Next hop from branch to the subnets | 10.0.12.2 (hq) |
| Summary prefix built on hq | 172.16.0.0/23 |
| Generated default on branch | 0.0.0.0/0, next hop 10.0.12.2 |

## What is already built

All three routers are addressed and each has only its connected routes. The addressing table gives the link and loopback addresses. hq holds both remote subnets on its loopback. The eBGP session between hq (AS 65002, 10.0.23.1) and upstream (AS 65003, 10.0.23.2) is established and carries no routes yet. upstream currently has neither subnet, branch can reach hq on the shared link, and the interfaces are up. Leave the addressing and the BGP session as they are.

## Stage 1 — Reach the remote subnets

The branch router has no route to the two small subnets that sit behind hq. Give it a fixed route for each, pointing at hq, so it can reach addresses inside them. Only branch needs to change.

**You're done when**

- The branch route table lists 172.16.0.0/24 and 172.16.1.0/24 as static routes with next hop 10.0.12.2.
- The branch router can ping 172.16.0.1 and 172.16.1.1.

Hint: Ask where branch should send the packet, not where the destination is. The next hop has to be an address on the link branch already shares with hq. hq already knows how to answer, so think about what is missing on branch alone.

## Stage 2 — Summarise for the upstream router

The upstream router should learn one summary covering both subnets and none of the specifics. Build the summary on hq and make sure only that summary is passed to upstream over the existing BGP session. The session must stay as it is.

**You're done when**

- hq holds 172.16.0.0/23 as an aggregate route.
- upstream holds 172.16.0.0/23 learned from BGP with next hop 10.0.23.1.
- upstream still holds neither 172.16.0.0/24 nor 172.16.1.0/24.

Hint: Two questions, and both are on hq. What has to exist before there is something to send? And what does eBGP send by default when it has been told nothing? Whatever policy you build decides what leaves, so decide what it must not let through as well as what it must.

## Stage 3 — Make a conditional default

The branch router needs a default route that exists only while a route through hq exists. Create it so that it depends on the branch routes towards the remote subnets and points at hq. It must not be a permanent route.

**You're done when**

- The branch route table holds 0.0.0.0/0 with protocol Aggregate and next hop 10.0.12.2.

Hint: A route that is generated takes its next hop from a contributing route, and a policy chooses which routes may contribute. Look at what you built in stage 1 and let the policy accept exactly those routes and nothing else.

## Checking your work

Each outcome of this exercise is written as a check under `checks/`. `checks/baseline.yaml` states what is true before you start and must stay true, and one file per stage states that stage's outcome. Every check names the device and the command it reads, so you can run them with the launcher for this format or read the file and check the outcome by hand.

## Tearing down

Destroy the lab with the same tool you deployed it with, and confirm that nothing of it is left running. A lab left up holds the memory and the cores the next one needs.
