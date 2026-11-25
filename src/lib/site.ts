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

/** Title of the home page, and of any page that sets none. */
export const SITE_TITLE = 'Eniola Olawale - Game Developer & Artist';

/**
 * Default link-preview / search description for the site.
 *
 * Used on the home page when the profile's "Home page preview description"
 * is empty, and by any page that sets no description of its own.
 */
export const SITE_DESCRIPTION =
  'Real-time 3D artist: stylised environments, shaders and Unity, telling stories in the engine.';

/** Default 1200×630 social preview image (public/seo-image.png). */
export const SOCIAL_IMAGE = { url: '/seo-image.png', width: 1200, height: 630, alt: 'Eniola Olawale Portfolio' };
