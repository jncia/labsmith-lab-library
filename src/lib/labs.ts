export type LabStatus = "Verified" | "Candidate" | "Planned";

export type Lab = {
  slug: string;
  title: string;
  summary: string;
  status: LabStatus;
  difficulty: "Intermediate" | "Advanced";
  vendor: string;
  nodeCount: number;
  topologyFamily: string;
  technologies: string[];
  scenarios: string[];
  repositoryPath: string;
  topology: string;
  configs: { device: string; role: string; content: string }[];
  exercise: { title: string; why: string; commands: string[]; expected: string }[];
  verification: {
    lastRun: string;
    mode: string;
    assertions: string;
    notes: string[];
  };
  diagram: {
    nodes: { id: string; role: string; x: number; y: number }[];
    links: { from: string; to: string; label: string }[];
  };
};

const repoRoot = "https://github.com/jncia/labsmith-lab-library/tree/main/content/labs";

export const labs: Lab[] = [
  {
    slug: "mpls-l3vpn-route-reflector-5n",
    title: "MPLS L3VPN with Route Reflector Core",
    summary:
      "Five-node Junos service-provider floor with PE routers, a core route reflector, dual customer edges, VPNv4 control plane, LDP transport, and a guided import/export failure exercise.",
    status: "Verified",
    difficulty: "Advanced",
    vendor: "Juniper vJunos-router",
    nodeCount: 5,
    topologyFamily: "sp-vpn-floor-5n",
    technologies: ["MPLS", "L3VPN", "MP-BGP", "Route Reflector", "LDP", "VRF"],
    scenarios: [
      "VPNv4 route reflection",
      "VRF target import/export",
      "Remote customer loopback reachability",
      "Broken route target repair",
    ],
    repositoryPath: `${repoRoot}/mpls-l3vpn-route-reflector-5n`,
    topology: `name: mpls-l3vpn-rr-5n
topology:
  kinds:
    juniper_vjunosrouter:
      image: \${VJUNOS_ROUTER_IMAGE:=vrnetlab/juniper_vjunos-router:26.2R1.7}
  nodes:
    pe1:
      kind: juniper_vjunosrouter
      startup-config: configs/pe1.set
    p1:
      kind: juniper_vjunosrouter
      startup-config: configs/p1.set
    pe2:
      kind: juniper_vjunosrouter
      startup-config: configs/pe2.set
    ce1:
      kind: juniper_vjunosrouter
      startup-config: configs/ce1.set
    ce2:
      kind: juniper_vjunosrouter
      startup-config: configs/ce2.set
  links:
    - endpoints: ["ce1:eth1", "pe1:eth1"]
    - endpoints: ["pe1:eth2", "p1:eth1"]
    - endpoints: ["p1:eth2", "pe2:eth2"]
    - endpoints: ["ce1:eth2", "pe2:eth1"]
    - endpoints: ["ce2:eth1", "pe1:eth3"]
    - endpoints: ["ce2:eth2", "pe2:eth3"]`,
    configs: [
      {
        device: "pe1",
        role: "provider edge",
        content: `set system host-name pe1
set interfaces lo0 unit 0 family inet address 10.255.0.1/32
set interfaces ge-0/0/0 unit 0 family inet address 172.16.11.1/30
set interfaces ge-0/0/1 unit 0 family inet address 10.0.12.0/31
set protocols mpls interface ge-0/0/1.0
set protocols ldp interface ge-0/0/1.0
set protocols bgp group CORE type internal
set protocols bgp group CORE local-address 10.255.0.1
set protocols bgp group CORE family inet-vpn unicast
set protocols bgp group CORE neighbor 10.255.0.2
set routing-instances CUST-A instance-type vrf
set routing-instances CUST-A route-distinguisher 10.255.0.1:100
set routing-instances CUST-A vrf-target target:65000:100
set routing-instances CUST-A interface ge-0/0/0.0`,
      },
      {
        device: "p1",
        role: "core route reflector",
        content: `set system host-name p1
set interfaces lo0 unit 0 family inet address 10.255.0.2/32
set interfaces ge-0/0/0 unit 0 family inet address 10.0.12.1/31
set interfaces ge-0/0/1 unit 0 family inet address 10.0.23.0/31
set protocols mpls interface ge-0/0/0.0
set protocols mpls interface ge-0/0/1.0
set protocols ldp interface ge-0/0/0.0
set protocols ldp interface ge-0/0/1.0
set protocols bgp group PEERS type internal
set protocols bgp group PEERS local-address 10.255.0.2
set protocols bgp group PEERS family inet-vpn unicast
set protocols bgp group PEERS cluster 10.255.0.2
set protocols bgp group PEERS neighbor 10.255.0.1
set protocols bgp group PEERS neighbor 10.255.0.3`,
      },
      {
        device: "pe2",
        role: "provider edge",
        content: `set system host-name pe2
set interfaces lo0 unit 0 family inet address 10.255.0.3/32
set interfaces ge-0/0/0 unit 0 family inet address 172.16.12.1/30
set interfaces ge-0/0/1 unit 0 family inet address 10.0.23.1/31
set protocols mpls interface ge-0/0/1.0
set protocols ldp interface ge-0/0/1.0
set protocols bgp group CORE type internal
set protocols bgp group CORE local-address 10.255.0.3
set protocols bgp group CORE family inet-vpn unicast
set protocols bgp group CORE neighbor 10.255.0.2
set routing-instances CUST-A instance-type vrf
set routing-instances CUST-A route-distinguisher 10.255.0.3:100
set routing-instances CUST-A vrf-target target:65000:100
set routing-instances CUST-A interface ge-0/0/0.0`,
      },
      {
        device: "ce1",
        role: "customer edge",
        content: `set system host-name ce1
set interfaces ge-0/0/0 unit 0 family inet address 172.16.11.2/30
set interfaces ge-0/0/1 unit 0 family inet address 172.16.12.2/30
set interfaces lo0 unit 0 family inet address 192.0.2.1/32
set protocols bgp group PE type external
set protocols bgp group PE peer-as 65000
set protocols bgp group PE neighbor 172.16.11.1
set protocols bgp group PE neighbor 172.16.12.1
set routing-options autonomous-system 65101`,
      },
      {
        device: "ce2",
        role: "customer edge",
        content: `set system host-name ce2
set interfaces ge-0/0/0 unit 0 family inet address 203.0.113.0/31
set interfaces ge-0/0/1 unit 0 family inet address 203.0.113.2/31
set interfaces lo0 unit 0 family inet address 198.51.100.1/32`,
      },
    ],
    exercise: [
      {
        title: "Confirm VPNv4 sessions terminate on the route reflector",
        why: "The core route reflector should carry VPN routes without hosting a customer VRF.",
        commands: [
          "show bgp summary",
          "show route table bgp.l3vpn.0",
        ],
        expected: "p1 has established BGP sessions to pe1 and pe2 and sees VPNv4 NLRI.",
      },
      {
        title: "Break one VRF target import",
        why: "Changing the route target demonstrates that VPN reachability depends on route-target membership, not just BGP session state.",
        commands: [
          "delete routing-instances CUST-A vrf-target target:65000:100",
          "set routing-instances CUST-A vrf-target target:65000:999",
          "commit check",
          "commit",
          "show route table CUST-A.inet.0 198.51.100.1/32 exact",
        ],
        expected: "The remote customer loopback disappears from the CUST-A table on the modified PE.",
      },
      {
        title: "Restore the import target and verify traffic",
        why: "The repair closes the loop between control-plane policy and customer reachability.",
        commands: [
          "delete routing-instances CUST-A vrf-target target:65000:999",
          "set routing-instances CUST-A vrf-target target:65000:100",
          "commit",
          "show route table CUST-A.inet.0 198.51.100.1/32 exact",
          "ping routing-instance CUST-A 198.51.100.1 count 3",
        ],
        expected: "The remote prefix returns and the routed ping succeeds.",
      },
    ],
    verification: {
      lastRun: "2026-07-07",
      mode: "LabSmith live proof seed",
      assertions: "12 baseline assertions",
      notes: [
        "Uses the current LabSmith sp-vpn-floor-5n archetype as the first public seed.",
        "Public files intentionally omit host details, credentials, image digests, and raw private logs.",
      ],
    },
    diagram: {
      nodes: [
        { id: "ce1", role: "CE", x: 92, y: 120 },
        { id: "pe1", role: "PE", x: 242, y: 120 },
        { id: "p1", role: "core RR", x: 360, y: 188 },
        { id: "pe2", role: "PE", x: 478, y: 120 },
        { id: "ce2", role: "CE", x: 628, y: 120 },
      ],
      links: [
        { from: "ce1", to: "pe1", label: "eBGP" },
        { from: "pe1", to: "p1", label: "LDP/MPLS" },
        { from: "p1", to: "pe2", label: "LDP/MPLS" },
        { from: "pe2", to: "ce2", label: "VRF edge" },
        { from: "ce1", to: "pe2", label: "dual home" },
      ],
    },
  },
  {
    slug: "evpn-vxlan-anycast-gateway-5n",
    title: "EVPN/VXLAN Anycast Gateway Fabric",
    summary:
      "Five-node fabric exercise showing an EVPN route-reflector spine, two leaf gateways, two hosts, symmetric IRB, and gateway MAC consistency checks.",
    status: "Candidate",
    difficulty: "Advanced",
    vendor: "Juniper vJunos-switch",
    nodeCount: 5,
    topologyFamily: "evpn-irb-5n",
    technologies: ["EVPN", "VXLAN", "Anycast Gateway", "MP-BGP", "IRB"],
    scenarios: [
      "Type-2 MAC/IP advertisement",
      "Anycast default gateway",
      "Leaf-to-leaf host mobility",
      "Missing VNI repair",
    ],
    repositoryPath: `${repoRoot}/evpn-vxlan-anycast-gateway-5n`,
    topology: `name: evpn-vxlan-anycast-5n
topology:
  kinds:
    juniper_vjunosswitch:
      image: \${VJUNOS_SWITCH_IMAGE:=vrnetlab/juniper_vjunos-switch:26.2R1.7}
  nodes:
    spine1:
      kind: juniper_vjunosswitch
      startup-config: configs/spine1.set
    leaf1:
      kind: juniper_vjunosswitch
      startup-config: configs/leaf1.set
    leaf2:
      kind: juniper_vjunosswitch
      startup-config: configs/leaf2.set
    host1:
      kind: linux
      image: alpine:latest
    host2:
      kind: linux
      image: alpine:latest
  links:
    - endpoints: ["spine1:eth1", "leaf1:eth1"]
    - endpoints: ["spine1:eth2", "leaf2:eth1"]
    - endpoints: ["leaf1:eth2", "host1:eth1"]
    - endpoints: ["leaf2:eth2", "host2:eth1"]`,
    configs: [
      {
        device: "spine1",
        role: "EVPN route reflector",
        content: `set system host-name spine1
set interfaces lo0 unit 0 family inet address 10.10.0.1/32
set protocols bgp group LEAFS type internal
set protocols bgp group LEAFS family evpn signaling
set protocols bgp group LEAFS cluster 10.10.0.1
set protocols bgp group LEAFS neighbor 10.10.0.11
set protocols bgp group LEAFS neighbor 10.10.0.12`,
      },
      {
        device: "leaf1",
        role: "VXLAN leaf gateway",
        content: `set system host-name leaf1
set interfaces lo0 unit 0 family inet address 10.10.0.11/32
set switch-options vtep-source-interface lo0.0
set vlans BLUE vlan-id 100
set vlans BLUE vxlan vni 10100
set interfaces irb unit 100 family inet address 10.100.0.1/24
set routing-instances EVPN protocols evpn encapsulation vxlan
set routing-instances EVPN protocols evpn extended-vni-list 10100`,
      },
      {
        device: "leaf2",
        role: "VXLAN leaf gateway",
        content: `set system host-name leaf2
set interfaces lo0 unit 0 family inet address 10.10.0.12/32
set switch-options vtep-source-interface lo0.0
set vlans BLUE vlan-id 100
set vlans BLUE vxlan vni 10100
set interfaces irb unit 100 family inet address 10.100.0.1/24
set routing-instances EVPN protocols evpn encapsulation vxlan
set routing-instances EVPN protocols evpn extended-vni-list 10100`,
      },
    ],
    exercise: [
      {
        title: "Verify EVPN control-plane reachability",
        why: "Leafs should exchange MAC/IP routes through the spine route reflector before any host test matters.",
        commands: ["show bgp summary", "show evpn database"],
        expected: "Both leafs have an established EVPN session and learn remote MAC/IP entries.",
      },
      {
        title: "Remove the VNI from one leaf",
        why: "A missing VNI is a common fabric-side error that leaves BGP healthy while data-plane learning fails.",
        commands: [
          "delete vlans BLUE vxlan vni 10100",
          "commit check",
          "commit",
          "show evpn database extensive",
        ],
        expected: "Remote BLUE entries stop resolving through the affected leaf.",
      },
      {
        title: "Restore the VNI and prove host reachability",
        why: "The repair demonstrates the relationship between VLAN, VNI, and EVPN route install.",
        commands: [
          "set vlans BLUE vxlan vni 10100",
          "commit",
          "show evpn database",
          "ping 10.100.0.20 count 3",
        ],
        expected: "The VNI returns and host-to-host reachability is restored.",
      },
    ],
    verification: {
      lastRun: "pending",
      mode: "candidate spec",
      assertions: "planned EVPN assertions",
      notes: [
        "Included to exercise the catalog design for EVPN/VXLAN discovery.",
        "Needs LabSmith live verification before being marked verified.",
      ],
    },
    diagram: {
      nodes: [
        { id: "host1", role: "host", x: 120, y: 250 },
        { id: "leaf1", role: "leaf", x: 240, y: 175 },
        { id: "spine1", role: "RR", x: 360, y: 90 },
        { id: "leaf2", role: "leaf", x: 480, y: 175 },
        { id: "host2", role: "host", x: 600, y: 250 },
      ],
      links: [
        { from: "host1", to: "leaf1", label: "VLAN 100" },
        { from: "leaf1", to: "spine1", label: "EVPN" },
        { from: "spine1", to: "leaf2", label: "EVPN" },
        { from: "leaf2", to: "host2", label: "VLAN 100" },
      ],
    },
  },
  {
    slug: "interprovider-option-b-6n",
    title: "Inter-provider MPLS VPN Option B",
    summary:
      "Six-node inter-provider scenario with two ASBRs exchanging VPNv4 routes, separate provider cores, and a guided failure around next-hop reachability.",
    status: "Planned",
    difficulty: "Advanced",
    vendor: "Juniper vJunos-router",
    nodeCount: 6,
    topologyFamily: "interprovider-option-b-6n",
    technologies: ["MPLS", "Inter-provider", "Option B", "MP-BGP", "L3VPN"],
    scenarios: [
      "ASBR-to-ASBR VPNv4 exchange",
      "Next-hop-self behavior",
      "Provider boundary troubleshooting",
      "Route-target preservation",
    ],
    repositoryPath: `${repoRoot}/interprovider-option-b-6n`,
    topology: `name: interprovider-option-b-6n
topology:
  kinds:
    juniper_vjunosrouter:
      image: \${VJUNOS_ROUTER_IMAGE:=vrnetlab/juniper_vjunos-router:26.2R1.7}
  nodes:
    ce-a:
      kind: juniper_vjunosrouter
      startup-config: configs/ce-a.set
    pe-a:
      kind: juniper_vjunosrouter
      startup-config: configs/pe-a.set
    asbr-a:
      kind: juniper_vjunosrouter
      startup-config: configs/asbr-a.set
    asbr-b:
      kind: juniper_vjunosrouter
      startup-config: configs/asbr-b.set
    pe-b:
      kind: juniper_vjunosrouter
      startup-config: configs/pe-b.set
    ce-b:
      kind: juniper_vjunosrouter
      startup-config: configs/ce-b.set
  links:
    - endpoints: ["ce-a:eth1", "pe-a:eth1"]
    - endpoints: ["pe-a:eth2", "asbr-a:eth1"]
    - endpoints: ["asbr-a:eth2", "asbr-b:eth2"]
    - endpoints: ["asbr-b:eth1", "pe-b:eth2"]
    - endpoints: ["pe-b:eth1", "ce-b:eth1"]`,
    configs: [
      {
        device: "asbr-a",
        role: "provider A ASBR",
        content: `set system host-name asbr-a
set interfaces lo0 unit 0 family inet address 10.1.0.3/32
set interfaces ge-0/0/1 unit 0 family inet address 10.12.0.0/31
set protocols bgp group ASBR-B type external
set protocols bgp group ASBR-B family inet-vpn unicast
set protocols bgp group ASBR-B peer-as 65200
set protocols bgp group ASBR-B neighbor 10.12.0.1
set routing-options autonomous-system 65100`,
      },
      {
        device: "asbr-b",
        role: "provider B ASBR",
        content: `set system host-name asbr-b
set interfaces lo0 unit 0 family inet address 10.2.0.3/32
set interfaces ge-0/0/1 unit 0 family inet address 10.12.0.1/31
set protocols bgp group ASBR-A type external
set protocols bgp group ASBR-A family inet-vpn unicast
set protocols bgp group ASBR-A peer-as 65100
set protocols bgp group ASBR-A neighbor 10.12.0.0
set routing-options autonomous-system 65200`,
      },
    ],
    exercise: [
      {
        title: "Confirm VPNv4 exchange across the AS boundary",
        why: "Option B keeps VPN labels and VPNv4 routes at the ASBR boundary instead of back-to-back VRFs.",
        commands: ["show bgp summary", "show route table bgp.l3vpn.0"],
        expected: "Each ASBR sees VPNv4 routes from the other provider.",
      },
      {
        title: "Break next-hop reachability",
        why: "This separates BGP route exchange from transport resolution across the provider edge.",
        commands: [
          "delete protocols bgp group ASBR-B next-hop-self",
          "commit check",
          "commit",
          "show route table bgp.l3vpn.0 hidden extensive",
        ],
        expected: "VPNv4 routes remain present but hidden or unresolved.",
      },
      {
        title: "Restore next-hop handling and verify CE reachability",
        why: "The repair shows which device owns inter-AS transport correctness.",
        commands: [
          "set protocols bgp group ASBR-B next-hop-self",
          "commit",
          "show route table CUST-A.inet.0",
          "ping routing-instance CUST-A 198.51.100.1 count 3",
        ],
        expected: "The VPN route resolves and customer reachability returns.",
      },
    ],
    verification: {
      lastRun: "pending",
      mode: "planned archetype",
      assertions: "not yet pinned",
      notes: [
        "Included to reserve the six-node inter-provider pattern.",
        "Needs a dedicated LabSmith archetype and live verification.",
      ],
    },
    diagram: {
      nodes: [
        { id: "ce-a", role: "CE", x: 80, y: 180 },
        { id: "pe-a", role: "PE", x: 200, y: 180 },
        { id: "asbr-a", role: "ASBR", x: 320, y: 180 },
        { id: "asbr-b", role: "ASBR", x: 440, y: 180 },
        { id: "pe-b", role: "PE", x: 560, y: 180 },
        { id: "ce-b", role: "CE", x: 680, y: 180 },
      ],
      links: [
        { from: "ce-a", to: "pe-a", label: "VRF" },
        { from: "pe-a", to: "asbr-a", label: "AS 65100" },
        { from: "asbr-a", to: "asbr-b", label: "VPNv4 eBGP" },
        { from: "asbr-b", to: "pe-b", label: "AS 65200" },
        { from: "pe-b", to: "ce-b", label: "VRF" },
      ],
    },
  },
];

export function getLab(slug: string) {
  return labs.find((lab) => lab.slug === slug);
}
