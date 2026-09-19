# Learner LabPacks

A LabPack is a self-contained exercise a learner runs with containerlab alone. Format v0 is
`lab.yaml` (metadata, requirements, stages, qualification receipts), `topology.clab.yml`,
`configs/<node>.set` for the start state, `workbook.md` for the tasks, `checks/baseline.yaml` plus
`checks/<stage-id>.yaml`, `solutions/<stage-id>/<node>.set`, and `solutions.md`. Checks are
operational outcomes rather than required configuration, so any correct solution passes and
shipping them gives nothing away; the student bundle drops `solutions/` and `solutions.md`, the
full bundle keeps them. A packet is qualified by three model-free runs on a real lab host — start
state, reference solution, reset — which write a receipt into `lab.yaml`.

The authority for field names, the check vocabulary and the qualification contract is LabSmith's
`docs/learner-labpack/README.md`. These packets are separate from the course content under
`content/labs/`; nothing here is read by the website build.
