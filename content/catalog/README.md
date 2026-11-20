# The release catalog

`catalog.yaml` is what the public site lists; `labs/<id>.json` is each listed
lab's metadata, written by `scripts/extract-lab-metadata.mts`. A lab is
downloadable only when its entry is `released`, with the date of its learner
read and a hosted file.

The format, the status ladder and the release steps are in
[docs/publishing.md](../../docs/publishing.md). `npm run validate` checks all
of it and runs before every build.
