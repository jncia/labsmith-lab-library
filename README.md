# Full Mesh Labs site

The public site where learners browse Full Mesh Labs practice labs, download
them, and get the Full Mesh Labs app. Next.js App Router, built as a static export and
served by Cloudflare at https://fullmeshlabs.com (see docs/publishing.md).

**This repository is public.** Read [docs/publishing.md](docs/publishing.md)
before adding anything.

## Pages

- `/` the catalog, with search and filters by level, set and topic
- `/labs/<id>` a lab: summary, the network drawing, stages, what you need, download
- `/client` the app download, requirements and setup steps
- `/start` getting started

## Content

The site reads one catalog at build time: `content/catalog/` by default, or
the folder named by `CATALOG_DIR`. `src/lib/catalog.ts` holds every rule a
catalog must keep, so a malformed or dishonest catalog fails the build.

## Commands

```bash
npm install
npm run dev        # local site
npm run validate   # schema, honesty rules and the leak scan (also runs first in build)
npm test           # the validator's self-test with planted violations
npm run lint
npm run build
```

The older `content/labs/` and `content/labpacks/` folders are kept from
earlier drafts. The site no longer renders them.
