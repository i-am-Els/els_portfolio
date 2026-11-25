'use client';

import { META_DESCRIPTION_MAX, resolveMeta } from '@/utils/seo';

interface SeoFieldsProps {
  /** Which item the notes talk about, e.g. "project" or "post". */
  noun: string;
  /** The item's title and summary source; their copy is the default. */
  title: string;
  summary: string | null | undefined;
  metaTitle: string | null | undefined;
  metaDescription: string | null | undefined;
  onChange: (patch: { meta_title?: string; meta_description?: string }) => void;
}

const inputClass =
  'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm';
const noteClass = 'mt-1 text-xs text-gray-500';

/**
 * "Search & link preview" fields for a project or post.
 *
 * Left empty, each field shows (as its placeholder) and saves a copy of the
 * item's title / description, so filling them in is optional.
 */
export default function SeoFields({ noun, title, summary, metaTitle, metaDescription, onChange }: SeoFieldsProps) {
  const defaults = resolveMeta({ title, summary });
  const descriptionLength = (metaDescription?.trim() || defaults.meta_description).length;
  const tooLong = descriptionLength > META_DESCRIPTION_MAX;

  return (
    <fieldset className="space-y-4 rounded-md border border-gray-300 p-4">
      <legend className="px-1 text-sm font-medium text-gray-700">Search &amp; link preview</legend>
      <p className={noteClass}>
        What Google shows in search results, and what WhatsApp, LinkedIn, X and others show when someone
        shares this {noun}&apos;s link. Both are optional: an empty field uses a copy of the {noun}&apos;s title
        and description.
      </p>

      <div>
        <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 mb-1">
          Meta title
        </label>
        <input
          id="meta_title"
          type="text"
          value={metaTitle ?? ''}
          placeholder={defaults.meta_title || `Copy of the ${noun} title`}
          onChange={(e) => onChange({ meta_title: e.target.value })}
          className={inputClass}
        />
        <p className={noteClass}>
          The headline of the search result and preview card. &ldquo; | Eniola Olawale&rdquo; is added
          automatically. If you rename the {noun} later, update this too.
        </p>
      </div>

      <div>
        <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
          Meta description
        </label>
        <textarea
          id="meta_description"
          rows={3}
          value={metaDescription ?? ''}
          placeholder={defaults.meta_description || `Copy of the ${noun} description`}
          onChange={(e) => onChange({ meta_description: e.target.value })}
          className={inputClass}
        />
        <p className={noteClass}>
          One or two sentences under the headline: say what it is and what it shows.{' '}
          <span className={tooLong ? 'font-medium text-red-600' : undefined}>
            {descriptionLength} / {META_DESCRIPTION_MAX} characters
            {tooLong ? ' (anything past 160 gets cut off)' : ''}
          </span>
        </p>
      </div>
    </fieldset>
  );
}
