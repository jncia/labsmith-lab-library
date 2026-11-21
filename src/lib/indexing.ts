/*
 * Whether search engines may index the site. Imported by next.config.ts and
 * src/lib/hosting.ts too, so this file imports nothing.
 *
 * Owner direction, 2026-11-20: keep the live site out of search until the
 * brand and domain are settled. Set SEARCH_INDEXING_OPEN to true in the same
 * change that moves the site to its new name and address.
 */
export const SEARCH_INDEXING_OPEN = false;

/**
 * True only for a production build. `npm run deploy` sets SITE_ENV=production;
 * local builds and previews never do, so they are never indexed.
 */
export const IS_PRODUCTION = process.env.SITE_ENV === "production";

/** Indexed only in production, and only once indexing is open. */
export const INDEXABLE = IS_PRODUCTION && SEARCH_INDEXING_OPEN;
