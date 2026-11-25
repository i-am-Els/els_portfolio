import { plainText } from '@/utils/plainText';

/** Longest meta description search engines and link previews show in full. */
export const META_DESCRIPTION_MAX = 160;

/**
 * The search / link-preview title and description for a project or post.
 *
 * The meta fields are optional: when one is blank it falls back to a copy of
 * the item's own title, and a plain-text summary of its description (or a
 * post's excerpt or body). The admin forms call this on save, so the copy is
 * stored in the row; the public pages call it too, for rows saved before the
 * meta fields existed.
 */
export function resolveMeta(item: {
  title: string;
  summary: string | null | undefined;
  meta_title?: string | null;
  meta_description?: string | null;
}): { meta_title: string; meta_description: string } {
  return {
    meta_title: item.meta_title?.trim() || item.title.trim(),
    meta_description:
      item.meta_description?.trim() || plainText(item.summary ?? '', META_DESCRIPTION_MAX),
  };
}
