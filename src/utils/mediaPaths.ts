/**
 * Object-key layout for the Backblaze B2 bucket `portfolio-elsrael`.
 *
 *   blog-images/{blogId}/thumbnail/{name}.webp      featured image (blog_posts.image_url)
 *   blog-images/{blogId}/content/{name}.webp        images embedded in blog_posts.content
 *   project-images/{projectId}/thumbnail/{name}.webp  featured image (projects.image_url)
 *   project-images/{projectId}/gallery/{name}.webp    project_images rows
 *   images/{profileId}.webp
 *
 * The browser uses these helpers to ask for a destination; /api/b2/upload and
 * /api/b2/delete use the same helpers to VALIDATE what was asked for. Because
 * both sides share one module, a client can never write (or delete) outside the
 * folders above, and the thumbnail/content split can't silently drift again.
 *
 * Safe to import from client and server — no secrets here.
 */

/** The random-name rules below are the pre-existing ones, reused verbatim. */
const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

const BLOG_DIR_RE = new RegExp(`^blog-images/${UUID}/(content|thumbnail)$`);
// "temp" used to live here for the upload-to-temp-then-copy dance, which Step 4
// replaced. Nothing writes or reads project-images/temp/ any more, so it is no
// longer part of the allowlist.
const PROJECT_DIR_RE = new RegExp(`^project-images/${UUID}/(thumbnail|gallery)$`);
const PROFILE_DIR_RE = /^images$/;

const BLOG_FILE_RE = new RegExp(`^blog-images/${UUID}/(content|thumbnail)/[A-Za-z0-9._-]+$`);
const PROJECT_FILE_RE = new RegExp(`^project-images/${UUID}/(thumbnail|gallery)/[A-Za-z0-9._-]+$`);
const PROFILE_FILE_RE = /^images\/[A-Za-z0-9._-]+$/;

export type BlogImageKind = 'content' | 'thumbnail';
export type MediaRoot = 'blog-images' | 'project-images' | 'images';

/* ------------------------------------------------------------------ *
 * Prefix builders (browser side)
 * ------------------------------------------------------------------ */

export const blogContentPrefix = (blogId: string): string =>
  `blog-images/${blogId}/content`;

export const blogThumbnailPrefix = (blogId: string): string =>
  `blog-images/${blogId}/thumbnail`;

export const projectThumbnailPrefix = (projectId: string): string =>
  `project-images/${projectId}/thumbnail`;

export const projectGalleryPrefix = (projectId: string): string =>
  `project-images/${projectId}/gallery`;

export const PROFILE_PREFIX: string = 'images';

/* ------------------------------------------------------------------ *
 * Validation (server side)
 * ------------------------------------------------------------------ */

export function isAllowedPrefix(prefix: string): boolean {
  return (
    BLOG_DIR_RE.test(prefix) ||
    PROJECT_DIR_RE.test(prefix) ||
    PROFILE_DIR_RE.test(prefix)
  );
}

export function isAllowedKey(key: string): boolean {
  return BLOG_FILE_RE.test(key) || PROJECT_FILE_RE.test(key) || PROFILE_FILE_RE.test(key);
}

export function rootOf(prefix: string): MediaRoot | null {
  if (prefix.startsWith('blog-images/')) return 'blog-images';
  if (prefix.startsWith('project-images/')) return 'project-images';
  if (prefix === 'images') return 'images';
  return null;
}

/* ------------------------------------------------------------------ *
 * Naming
 * ------------------------------------------------------------------ */

const CONTENT_TYPE_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

export function extensionFor(contentType: string): string {
  return CONTENT_TYPE_EXT[contentType.toLowerCase()] || 'webp';
}

/** `{uuid}.{ext}` — the only shape a profile image filename may take. */
const PROFILE_FILE_RE_ALLOW = new RegExp(`^${UUID}\\.(webp|png|jpe?g|gif|avif)$`);

/**
 * Build the object key to write under `prefix`.
 *
 * `randomName` is only supplied for `images/`, because that surface never had a
 * random name — it is `{profileId}.{ext}` (see admin/profile).
 *
 * Returns `null` when the request doesn't match the stored convention.
 */
export function buildObjectKey(
  prefix: string,
  contentType: string,
  providedFilename?: string | null
): string | null {
  if (!isAllowedPrefix(prefix)) return null;
  const root = rootOf(prefix);
  if (!root) return null;

  const ext = extensionFor(contentType);

  if (root === 'images') {
    if (!providedFilename || !PROFILE_FILE_RE_ALLOW.test(providedFilename)) return null;
    // Keep the extension truthful to what was actually uploaded.
    const base = providedFilename.replace(/\.[A-Za-z0-9]+$/, '');
    return `${prefix}/${base}.${ext}`;
  }

  return `${prefix}/${randomName(root)}.${ext}`;
}

/**
 * The per-surface random-name rules, exactly as they were written before the
 * B2 migration (do not "unify" these — see the decision recorded in Step 0).
 *
 *   blog-images   →  Math.random().toString(36).slice(2, 12)     (fixed 10 chars)
 *   project-images→  Math.random().toString(36).substring(2)     (variable length)
 */
export function randomName(root: MediaRoot): string {
  if (root === 'project-images') return Math.random().toString(36).substring(2);
  return Math.random().toString(36).slice(2, 12);
}
