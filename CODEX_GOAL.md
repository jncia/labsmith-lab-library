# Lab Library Goal: Workbook Packages, Publish Gate, and First Verified Wave

This is the ONLY active goal in this repo. Read `README.md`, `AGENTS.md`, and this whole file before editing.

## Paste-Ready Goal

```text
/goal Implement the lab-library workbook and publishing program in CODEX_GOAL.md. Document the lab package format as the public contract, build the publish-gate validator (schema + leak-marker scan wired into the build), upgrade the three seed labs into attempt-first workbooks whose answers and outputs come ONLY from verified LabSmith artifacts (read the sibling labsmith repo strictly read-only; never invent device output; labs without verified sources keep expected-only answers and candidate status), convert two additional verified LabSmith packages (the router-pair route-preference integration fixture and the single-router aggregate-route golden) into published library workbooks, and write the publishing workflow doc that defines the planned→candidate→verified status ladder. The site build must fail on any malformed or leaking lab. Do not modify the labsmith or lessonsmith repositories at all.
```

## Why This Library Exists (context for every decision)

This is the PUBLIC face of LabSmith verification — a free library of runnable, verified lab workbooks that (a) earns trust and search traffic in the Juniper niche, and (b) proves the core product claim: *content verified on real devices, not written by hand*. Its credibility is the whole point. One fabricated output or one leaked internal detail damages the exact asset it exists to build. Treat every content decision through that lens.

The site is fully content-driven: `content/labs/<slug>/` is the single source of truth (`lab.yaml` + `configs/*.set` + `topology.clab.yml` + optional `guide.mdx`), loaded and validated at build time by `src/lib/labs.ts` — **a malformed lab fails the build; the build is the publish gate.** The workbook UI is attempt-first: tasks show intent and commands; expected results, solution commands, captured output, and explanations are hidden behind a reveal (`tasks[].answer.{explanation,commands,output}` are optional fields the template already renders).

The verified source material lives in the sibling repo `../labsmith` — **READ-ONLY for this goal** (it has its own active Phase 3 goal; do not edit anything there, do not run live labs from here). Verified artifacts you may read: `../labsmith/goldens/`, `../labsmith/artifacts/phase2/` (live packages, evidence bundles, captures), `../labsmith/docs/integration-fixtures/route-preference-package/`, and `../labsmith/archetypes/` (baselines). The `../lessonsmith` repo is out of scope entirely.

## Hard Rules (public-safety and honesty)

- **Never invent, edit, trim, or "clean up" device output.** Published outputs come verbatim from LabSmith captured artifacts (already volatile-normalized: `<age>`, `<timestamp>`, `<counter>` placeholders are expected and stay).
- **`status: verified` requires LabSmith provenance** — a golden or live package behind it, with `verification.last_run`, `mode`, `assertions`, and (when available) `junos_version` + `image` family recorded in lab.yaml. Labs without that stay `candidate` (honest labeling is part of the trust story). Never promote by hand.
- **Leak boundary (public repo!):** no credentials, no host IPs or hostnames, no SSH key paths, no `/Users/` or `/home/` paths, no image digests (`sha256:`), no raw internal logs, no LabSmith run paths (`labsmith://` is allowed only inside lab.yaml verification notes if already public-safe — prefer omitting). Vendor images are referenced ONLY via env var in topology files; never distribute or link images.
- Learner tone: the library speaks to learners, not to our tooling. No internal jargon (archetype ids like `sp-vpn-floor-5n` are fine as topology-family labels; runner/goldens/assertion-engine internals are not learner content).

## Work Item 1: Lab Package Format — the public contract

Write `docs/lab-package-format.md` documenting the exact directory format the loader consumes (derive from `src/lib/labs.ts`, do not invent divergence):

- `lab.yaml` fields with types and which are required: id, title, summary, status (planned|candidate|verified), difficulty, vendor, node_count, topology_family, technologies[], scenarios[], devices[]{id, role}, verification{last_run, mode, assertions, junos_version?, image?, notes[]}, diagram{nodes[]{id, role, x?, y?}, links[]{from, to, label}} (x/y optional — auto-layout), tasks[]{id, title, why, commands[], expected, answer?{explanation?, commands?, output?}}.
- `configs/<device>.set` per declared device; `topology.clab.yml` with env-var image; optional `guide.mdx` whose `## Goal` section surfaces on the overview tab.
- The workbook quality bar: every task is attempt-first (why → commands → hidden expected/answer); `answer.output` only from verified captures; `answer.explanation` teaches WHY the output looks the way it does (the field a learner should notice, what it proves, what wrong would look like); broken→repair task pairs are the house specialty when the source package has a broken variant.
- State explicitly: this format is the contract a future `labsmith workbook` emitter will target (that emitter belongs to the labsmith repo later, not this goal).

## Work Item 2: Publish-Gate Validator

`npm run validate:labs` (a small TS script, run also as part of `npm run build` before `next build`):

1. Re-validate the schema (the loader already throws — reuse it by importing the loader, not duplicating rules).
2. **Leak-marker scan** over every file under `content/`: credentials (`admin@123` and password-like markers), host IPs/subnets used internally (192.168._, 172.20.20._), key filenames, `/Users/`, `/home/`, `/opt/vrnetlab`, `sha256:`, raw `.clab` deploy logs. Maintain the marker list as a documented constant (mirror the intent of labsmith's `PROHIBITED_LEARNER_MARKERS`; do not import across repos).
3. Status honesty check: `status: verified` requires non-placeholder verification fields (last_run parses as a date, assertions non-empty, mode names a LabSmith proof).
4. Tests or a self-check mode with planted violations proving each rule fires.

## Work Item 3: Upgrade the Three Seed Labs to Full Workbooks

- `mpls-l3vpn-route-reflector-5n` (status verified): source answers from the live SP-VPN package and goldens in `../labsmith/artifacts/phase2/` — per task, add `answer.output` (verbatim normalized captures: VPNv4 routes on the RR, the CUST-A table before/after the broken route-target, the restored reachability ping) and `answer.explanation` teaching what each output proves. Update `verification` with junos_version/image family from the package provenance (public-safe fields only — version string yes, digest no).
- `evpn-vxlan-anycast-gateway-5n` and `interprovider-option-b-6n` (candidates, no verified source yet): tighten tasks/why/expected for the attempt-first bar; add `answer.explanation` where it is concept-teaching (no fabricated output — omit `answer.output` entirely); keep `status: candidate` and add a verification note that live verification is pending. Do not fake it.

## Work Item 4: Two New Verified Workbooks From Existing LabSmith Material

Convert (read-only) into full library packages:

1. **`junos-route-preference-2n`** from `../labsmith/docs/integration-fixtures/route-preference-package/` + the router-pair archetype baseline — note its provenance mode honestly (the fixture is doc-derived; if a corresponding live golden exists in `../labsmith/goldens/`, prefer it and mark verified; otherwise publish as candidate with real structure and fixture-grounded outputs clearly labeled).
2. **`junos-aggregate-route-1r`** from the aggregate-route golden/live runs (`../labsmith/artifacts/runs/`, `../labsmith/goldens/`) — single-router, verified, with captured RIB outputs as answers.

Each gets: lab.yaml (full workbook), configs from the archetype baselines (public-safe — they contain no credentials by design; verify with the marker scan), topology.clab.yml with env-var image, guide.mdx with a Goal section, diagram (auto-layout is fine). Both must pass the validator and render (build).

## Work Item 5: Publishing Workflow Doc

`docs/publishing.md`: the lifecycle of a lab — LabSmith verified package → converted to library format (this repo) → `npm run validate:labs` → build → commit → Vercel deploys on push. The status ladder (planned → candidate → verified) with promotion rules (verified = LabSmith provenance only). Who may edit what: generated outputs are never hand-edited; explanations/prose are editable; configs/topology only change when re-verified. Note for the future: when the labsmith `workbook` emitter lands, conversion becomes automated and this doc gains its command.

## Verification (all must pass)

- `npm run validate:labs` green on all labs; planted-violation self-check proves each marker rule fires.
- `npm run build` green (5 labs SSG'd), `npm run lint` green.
- Grep-proof: no internal IPs/credentials/digests/key paths anywhere under `content/`.
- The mpls lab's workbook shows verbatim captured outputs behind reveals; the two candidates contain no `answer.output`.
- Two new labs render with diagrams, configs, tasks, and honest status.

## Final Report

Per work item: what landed + paths. REQUIRED: for every `answer.output` published, the source artifact path in `../labsmith` it was copied from (traceability list — goes in the report, NOT in public content); any place where source material was insufficient and the honest fallback used; and the validator rules list as shipped.
