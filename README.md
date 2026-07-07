# LabSmith Lab Library

Public draft website for a searchable library of LabSmith-generated network lab exercises.

The site is a Next.js App Router app deployed on Vercel. Lab examples are kept as repo files under `content/labs/` so engineers can inspect, clone, and run the same topology and configuration artifacts shown in the web UI.

## Development

```bash
npm install
npm run dev
```

## Content Model

Each lab should include:

- `lab.yaml` for catalog metadata
- `topology.clab.yml` for the primary Containerlab topology
- `configs/*.set` for per-device startup configuration
- `guide.mdx` for the guided exercise narrative

The current site renders the first draft from `src/lib/labs.ts`; the next iteration should load `content/labs/**/lab.yaml` directly at build time and generate downloadable bundles.
