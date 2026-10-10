import { B2_PUBLIC_BASE } from '@/utils/mediaUrl';
import {
  blogContentPrefix,
  blogThumbnailPrefix,
  projectGalleryPrefix,
  projectThumbnailPrefix,
  PROFILE_PREFIX,
  type BlogImageKind,
} from '@/utils/mediaPaths';

/**
 * Browser-side helpers for the B2 upload/delete routes.
 *
 * Nothing here talks to Backblaze directly — the browser only ever talks to
 * our own /api/b2/* routes, which hold the credentials and enforce the folder
 * conventions from src/utils/mediaPaths.ts.
 *
 * Uploads are DEFERRED: while editing, images are previewed from blob: URLs and
 * only reach uploadMedia() when the user saves. Images inserted and then
 * removed are therefore never written to B2.
 */

const QUALITY = 0.87; // matches the migrated asset set

export interface MediaUploadResult {
  key: string;
  url: string;
}

/**
 * Re-encode an image to WebP so new uploads match the migrated assets.
 * Falls back to the original file if the browser can't decode it or can't
 * produce WebP (e.g. older Safari).
 */
export async function toWebp(file: File, quality: number = QUALITY): Promise<File> {
  if (typeof document === 'undefined') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[A-Za-z0-9]+$/, '') || 'image';
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}

/** Upload a (already WebP-encoded) file into `prefix`. */
export async function uploadMedia(
  file: File,
  prefix: string,
  filename?: string
): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append('file', file, file.name);
  form.append('prefix', prefix);
  if (filename) form.append('filename', filename);

  const res = await fetch('/api/b2/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return { key: data.key, url: data.url };
}

/** Convert to WebP then upload. */
export async function uploadImage(file: File, prefix: string, filename?: string) {
  return uploadMedia(await toWebp(file), prefix, filename);
}

/** Best-effort delete; failures are non-fatal by design (callers ignore). */
export async function deleteMedia(key: string): Promise<boolean> {
  if (!key) return false;
  try {
    const res = await fetch('/api/b2/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return Boolean(data.deleted);
  } catch {
    return false;
  }
}

/** Delete every object inside a folder. Used when a post or project is removed. */
export async function deleteMediaFolder(prefix: string): Promise<number> {
  if (!prefix) return 0;
  try {
    const res = await fetch('/api/b2/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix }),
    });
    if (!res.ok) return 0;
    const data = await res.json().catch(() => ({}));
    return Number(data.deleted) || 0;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------------ *
 * High-level callers — one per surface
 * ------------------------------------------------------------------ */

export async function uploadBlogImage(
  file: File,
  blogId: string,
  kind: BlogImageKind
): Promise<string> {
  const prefix = kind === 'thumbnail' ? blogThumbnailPrefix(blogId) : blogContentPrefix(blogId);
  const { url } = await uploadImage(file, prefix);
  return url;
}

export async function uploadProjectImage(file: File, projectId: string): Promise<string> {
  const { url } = await uploadImage(file, projectThumbnailPrefix(projectId));
  return url;
}

export async function uploadProjectGalleryImage(file: File, projectId: string): Promise<string> {
  const { url } = await uploadImage(file, projectGalleryPrefix(projectId));
  return url;
}

export async function uploadProfileImage(file: File, profileId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'webp';
  const { url } = await uploadImage(file, PROFILE_PREFIX, `${profileId}.${ext}`);
  return url;
}

/* ------------------------------------------------------------------ *
 * URL → key
 * ------------------------------------------------------------------ */

/** `https://…/file/portfolio-elsrael/blog-images/…/x.webp` → `blog-images/…/x.webp` */
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const prefix = `${B2_PUBLIC_BASE}/`;
  if (!url.startsWith(prefix)) return null;
  const key = decodeURIComponent(url.slice(prefix.length));
  return key || null;
}
