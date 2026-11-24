# Publishing labs on the Full Mesh Labs site

The site lists what `content/catalog/` says, and nothing else. This page is
the whole workflow, from a qualified packet to a download on the site.

**This repository is public.** Anything pushed to any branch can be read by
anyone. Never commit a packet, the client zip, a private path, a host address
or device output. `npm run validate` scans for them, but it is a net, not a
licence.

## The catalog

```
content/catalog/
  catalog.yaml        the release manifest: client, levels, collections, labs
  labs/<id>.json      one listed lab's public-safe metadata
```

`catalog.yaml` fields:

| Field | Meaning |
| --- | --- |
| `schema` | `labpack-site.catalog.v1` |
| `kind` | `release` (this folder) or `development` (a local catalog; refused for production) |
| `client` | the Full Mesh Labs app download: version (the app's own, such as `0.1.0b2`), build, file name, bytes, SHA-256, `url` (`null` until hosted), publisher, platform, requirements |
| `levels[]` | certification levels with `stage` and `status`: `available` (has a released lab), `in-review`, `planned`, `later` |
| `access[]` | access tiers (`open`, `free-account`, `course`, `subscription`) with `delivered`: whether the site can hand out a download in that tier today |
| `accessRule` | which tier each collection `kind` (`course`, `library`) gets at each level `stage` (`associate`, `specialist`, `professional`, `expert`) |
| `collections[]` | sets of labs with `kind`, `level` and `unlistedInReview`, a count shown while none of a set is listed; access follows from the rule and is never set by hand |
| `topicGroups[]` | the catalog's topic filter |
| `labs[]` | `id`, `collection`, `status` (`in-review` or `released`), and for a released lab `learnerReadOn` and `download` |

`labs/<id>.json` is written by the extractor, never by hand. It holds only an
allow-list of fields from the packet's `lab.yaml`: title, summary,
prerequisites, topics, stage titles and goals, the drawing's nodes and links,
terminal labels, image version, memory and cores, and the qualification status
and date. Configs, solutions, checks, the workbook, authoring records, digests
and run names never cross.

## Access

The rule (owner direction, 2026-11-20):

| | JNCIA and JNCIS | JNCIP and JNCIE |
| --- | --- | --- |
| Course labs | free, no account | with the course purchase |
| Practice library | free account | Full Mesh Labs subscription |

The app itself needs no account. Only the `open` tier is delivered today: sign-in, course entitlement and
subscriptions are not built, so a lab in any other tier can be listed as in review but the validator refuses
to release it. When a tier's delivery exists, set its `delivered: true` in the same change.

## The status ladder

1. **Qualified** (LabSmith): the packet passed qualification on a real router.
   The extractor refuses any other packet.
2. **In review** (listed): the lab is in `labs[]` with `status: in-review`.
   Its page shows the drawing and stages and says it is not released. No
   download. Optional: a set can stay unlisted and appear only as a count.
3. **Released**: after Claude's learner read of the packet, the entry gets
   `status: released`, `learnerReadOn: <date>` and a `download` with an
   `https://` URL, file name ending `.labpack`, bytes and SHA-256. The site
   then serves `/download/labs/<id>` as a redirect to that URL.

The validator enforces the ladder: a released lab without its learner-read
date or a hosted file fails the build; an in-review lab with a download fails;
a level marked `available` with no released lab fails; a `planned` or `later`
level that lists labs fails.

## Releasing a lab

1. Extract its metadata from the qualified packet folder (a local path, never
   committed):

   ```bash
   node scripts/extract-lab-metadata.mts --out content/catalog --register <collection id> <packet folder>
   ```

   This writes `labs/<id>.json` and lists the lab as `in-review`.
2. Seal the `.labpack` file (the app opens sealed lessons only) and upload it
   to the download host (see "Where the files live" below).
3. Edit its entry in `catalog.yaml`: `status: released`, `learnerReadOn`,
   `download`. Lower the collection's `unlistedInReview` by one.
4. Set its level to `available` once it has a released lab.
5. `npm run validate`, `npm test`, `npm run lint`, `npm run build`, then a
   branch and a pull request.

## Where the files live

Downloads are release files of the public repository
`jncia/full-mesh-labs-releases` (owner's choice, 24 November 2026: free, no
transfer bill). It holds release files only. This repository never holds a
lesson file or the app.

- **The app**: one release per version, tagged `v<version>` (for example
  `v0.1.0b2`), holding the signed zip. The app's own update check downloads
  from the same address, so a release's file is never replaced: a new build is
  a new version and a new release.
- **Lessons**: one release per set and sealing date (for example
  `jncia-course-2026-11-24`), holding that set's `.labpack` files. A lesson
  that is rebuilt goes into a new release, and its catalog entry is pointed at
  the new address.

```bash
gh release create <tag> --repo jncia/full-mesh-labs-releases --title "<title>" --notes "<one plain line>" <file>...
```

The site links only to `/download/client` and `/download/labs/<id>`, which
send the visitor on to the address in the catalog, so a file can move without
any link on the site changing. After uploading, copy each file's address,
size and SHA-256 into `catalog.yaml`.

## Local development and previews

`CATALOG_DIR` points the site at another catalog. A development catalog
(`kind: development`) lists every qualified lab as `in-review` so the pages
can be seen with real content. It is generated from local packets into
`content/dev-catalog/`, which is git-ignored, and it can never build for
production:

```bash
CATALOG_DIR=content/dev-catalog npm run dev
```

## Deploys

The site is a static export (`out/`) served by a Cloudflare Worker with no Worker code (`wrangler.jsonc`),
on the Workers Free plan, at `fullmeshlabs.com`; `www.fullmeshlabs.com` redirects there (a zone Redirect
Rule). A static export cannot carry redirects or headers, so `npm run build` writes them into
`out/_redirects` (the download addresses) and `out/_headers` (`noindex` on anything but a production build) from
`src/lib/hosting.ts`; `next dev` applies the same rules.

- **A merge to `main` deploys production.** The `deploy` job in `.github/workflows/check.yml` runs
  after the check passes on the merged commit, one deploy at a time. It runs `npm run deploy`, which
  builds with `SITE_ENV=production` from the committed catalog (a development catalog is refused) and
  runs `wrangler deploy`. Merging is the release step. Pull requests never run this job.

  It needs two repository settings (Settings → Secrets and variables → Actions):

  - secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API token made from the "Edit Cloudflare Workers"
    template, limited to the account and the `fullmeshlabs.com` zone;
  - variable `CLOUDFLARE_ACCOUNT_ID`: the account that owns the Worker.

  Without them the job ends with a notice and deploys nothing. To deploy by hand instead (the same
  build and deploy), run `npm run deploy` from a checkout of `main` with Wrangler signed in to that
  account.
- **Previews are local.** The Worker has no `*.workers.dev` address and no preview URLs, so nothing but
  production is public. Build, then serve the output on Cloudflare's runtime (redirects and headers
  included) at http://127.0.0.1:8787:

  ```bash
  npm run build && npm run preview
  CATALOG_DIR=content/dev-catalog npm run build && npm run preview   # all qualified labs, in review
  ```

Only a production build is open to search engines (`src/lib/indexing.ts`). Local builds and previews
are marked `noindex` and `robots.txt` disallows them. Every deploy runs
`npm run build`, so the validator and the leak scan gate production as well.

## The leak scan

`src/lib/leak-markers.ts` is the list. It refuses home and workspace paths,
SSH keys, tokens, credentials, image digests, home-network and management
addresses, private host names, personal email addresses, authoring internals
and raw device output, in every file the site is built from (`content/catalog`,
`content/dev-catalog`, `src`, `public`, `scripts`, `docs`, `README.md`,
`next.config.ts`, `package.json`, `wrangler.jsonc`). Lab addresses from the documentation ranges
are fine.

`npm run validate -- --include-legacy` also reports what the scan finds in the
older `content/labs` and `content/labpacks` folders, which the site no longer
renders.
