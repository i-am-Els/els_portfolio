/**
 * Canonical public origin of the site, with no trailing slash.
 *
 * `NEXT_PUBLIC_SITE_URL` may be set with a trailing slash (which produced
 * `https://portfolio.elsrael.com//…` in the sitemap), so it is normalised here
 * once and every caller builds URLs as `${SITE_URL}/path`.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://portfolio.elsrael.com'
).replace(/\/+$/, '');
