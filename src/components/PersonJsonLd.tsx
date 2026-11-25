import type { Profile } from '@/lib/content';
import { SITE_ALTERNATE_NAME, SITE_DESCRIPTION, SITE_PERSON_NAME, SITE_ROLE, SITE_URL, SOCIAL_IMAGE } from '@/lib/site';
import { resolveMediaUrl } from '@/utils/mediaUrl';

/**
 * schema.org structured data for the home page: who the site belongs to.
 *
 * Tells search engines that the person behind this site is Eniola Olawale
 * (also "Elsrael") and that the listed ArtStation / LinkedIn / GitHub
 * profiles are theirs (`sameAs`), so the name, the site and those profiles
 * get connected. Every field comes from Admin -> Profile, with the defaults in
 * src/lib/site.ts for empty ones.
 * Invisible on the page; check it with https://search.google.com/test/rich-results.
 */
export default function PersonJsonLd({ profile }: { profile: Profile | null }) {
  const sameAs = [profile?.artstation_url, profile?.linkedin_url, profile?.github_url, profile?.twitter_url]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  // Structured data needs absolute URLs; a site-relative path gets the origin.
  const photo = resolveMediaUrl(profile?.image_url) || SOCIAL_IMAGE.url;
  const image = photo.startsWith('/') ? `${SITE_URL}${photo}` : photo;

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: profile?.full_name?.trim() || SITE_PERSON_NAME,
        alternateName: profile?.alternate_name?.trim() || SITE_ALTERNATE_NAME,
        jobTitle: profile?.job_title?.trim() || SITE_ROLE,
        description: profile?.meta_description?.trim() || SITE_DESCRIPTION,
        url: SITE_URL,
        image,
        ...(profile?.location ? { homeLocation: { '@type': 'Place', name: profile.location } } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: profile?.full_name?.trim() || SITE_PERSON_NAME,
        publisher: { '@id': `${SITE_URL}/#person` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify does not escape "<", so a value containing "</script>"
      // could end the tag early; < keeps it inert.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
