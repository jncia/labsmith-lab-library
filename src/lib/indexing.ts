/*
 * Whether search engines may index the site. Imported by next.config.ts and
 * src/lib/hosting.ts too, so this file imports nothing.
 *
 * Owner direction, 2026-11-20: keep the live site out of search until the
 * brand and domain are settled. Both were settled that day (Full Mesh Labs at
 * fullmeshlabs.com), so indexing opened with the rename. Set this to false to
 * take the whole site out of search again.
 */
export const SEARCH_INDEXING_OPEN = true;

/**
 * True only for a production build. `npm run deploy` sets SITE_ENV=production;
 * local builds and previews never do, so they are never indexed.
 */
export const IS_PRODUCTION = process.env.SITE_ENV === "production";

/** Indexed only in production, and only once indexing is open. */
export const INDEXABLE = IS_PRODUCTION && SEARCH_INDEXING_OPEN;
