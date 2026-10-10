/**
 * Central helper for turning a stored media reference into a displayable URL.
 *
 * Media now lives in Backblaze B2 (bucket `portfolio-elsrael`). Rows in the
 * database may still contain legacy Supabase Storage URLs, so every place that
 * renders an image should go through `resolveMediaUrl()` — it passes anything
 * that is already B2 / external / local straight through, and rewrites legacy
 * Supabase Storage URLs to their B2 equivalent.
 *
 * Legacy shape:
 *   https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<key>.<ext>
 * New shape:
 *   https://f005.backblazeb2.com/file/portfolio-elsrael/<bucket>/<key>.webp
 *
 * Two things happen during the rewrite:
 *   1. Supabase object keys carry a duplicated bucket-name segment
 *      (`project-images/project-images/<id>/…`) which the B2 export stripped.
 *   2. Every migrated file was converted to WebP, so the extension is swapped.
 */

const SUPABASE_STORAGE_RE =
  /^https?:\/\/[^/]+\/storage\/v1\/object\/public\/(.+)$/;

/** Public base for the B2 bucket, e.g. `https://f005.backblazeb2.com/file/portfolio-elsrael`. */
export const B2_PUBLIC_BASE = (
  process.env.NEXT_PUBLIC_B2_PUBLIC_URL ||
  'https://f005.backblazeb2.com/file/portfolio-elsrael'
).replace(/\/+$/, '');

/** Replace the extension of the final path segment with `.webp`. */
function toWebp(path: string): string {
  const slash = path.lastIndexOf('/');
  const dot = path.lastIndexOf('.');
  // No extension on the final segment (or a leading-dot name).
  if (dot <= slash + 1) return path;
  if (dot === path.length - 1) return path;
  return `${path.slice(0, dot)}.webp`;
}

/** Rewrite a legacy Supabase Storage public URL to its B2 equivalent, or `null` if it isn't one. */
function supabaseStorageUrlToB2(url: string): string | null {
  const match = SUPABASE_STORAGE_RE.exec(url.trim());
  if (!match) return null;

  const rest = match[1];
  const slash = rest.indexOf('/');
  if (slash <= 0) return null;

  const bucket = rest.slice(0, slash);
  let key = rest.slice(slash + 1);

  // Strip the duplicated bucket-name segment Supabase stored in the key.
  if (key.startsWith(`${bucket}/`)) key = key.slice(bucket.length + 1);
  if (!key) return null;

  return `${B2_PUBLIC_BASE}/${bucket}/${toWebp(key)}`;
}

/**
 * Resolve any stored image reference to a URL the app can render.
 *
 * Handles legacy Supabase Storage URLs (rewritten to B2), existing B2 URLs,
 * external `http(s)` URLs, `data:`/`blob:` previews and empty values.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  const rewritten = supabaseStorageUrlToB2(trimmed);
  if (rewritten) return rewritten;

  // Bare `bucket/key` paths (never a full URL, `/asset`, `data:` or `blob:`)
  // were previously resolved by hand against Supabase — do the same, then map.
  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('/');
  if (!isAbsolute) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (base) {
      const asUrl = `${base.replace(/\/+$/, '')}/storage/v1/object/public/${trimmed}`;
      return supabaseStorageUrlToB2(asUrl) ?? asUrl;
    }
  }

  return trimmed;
}

/**
 * Resolve every image reference inside an HTML fragment (blog post content or
 * project description), so embedded `<img>`/`<source>` tags follow too.
 */
export function resolveHtmlImages(html: string | null | undefined): string {
  if (!html) return '';

  return html
    .replace(
      /(<img\b[^>]*?\bsrc=["'])([^"']+)(["'])/gi,
      (_m, open, src, close) => `${open}${resolveMediaUrl(src)}${close}`
    )
    .replace(
      /(<source\b[^>]*?\bsrcset=["'])([^"']+)(["'])/gi,
      (_m, open, srcset, close) =>
        `${open}${resolveSrcset(srcset)}${close}`
    );
}

/** Resolve each candidate URL inside a `srcset` attribute value. */
function resolveSrcset(srcset: string): string {
  return srcset
    .split(',')
    .map((candidate) => {
      const parts = candidate.trim().split(/\s+/);
      if (!parts[0]) return candidate;
      parts[0] = resolveMediaUrl(parts[0]);
      return parts.join(' ');
    })
    .join(', ');
}
