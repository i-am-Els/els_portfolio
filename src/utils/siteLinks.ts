/**
 * Links that point at this site, stored as absolute URLs.
 *
 * Content saved before the move to portfolio.elsrael.com (a project's
 * "View Project Breakdown" URL, links inside posts) carries the old Vercel
 * host. Any absolute link to one of these hosts is rendered as a relative
 * path instead, so it stays on whichever domain the visitor is on.
 */
const OWN_HOSTS = new Set([
  'eniola-olawale-portfolio.vercel.app',
  'portfolio.elsrael.com',
  'www.portfolio.elsrael.com',
]);

/** `/path?query#hash` for a link to this site, or `null` for an external link. */
export function toSitePath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Already relative (or not a URL at all): a leading slash means it's ours.
    return url.startsWith('/') ? url : null;
  }
  if (!OWN_HOSTS.has(parsed.hostname)) return null;
  return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
}

/** Rewrite `href`s in rich-text HTML that point at this site to relative paths. */
export function resolveHtmlLinks(html: string): string {
  return html.replace(/(<a\b[^>]*?\bhref=["'])([^"']+)(["'])/gi, (match, open, href, close) => {
    const path = toSitePath(href);
    return path && path !== href ? `${open}${path}${close}` : match;
  });
}
