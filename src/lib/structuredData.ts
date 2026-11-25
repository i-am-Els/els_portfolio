/**
 * schema.org structured data (JSON-LD) describing who the site belongs to.
 *
 * Search engines read it to connect the name, this site and the ArtStation /
 * LinkedIn / GitHub profiles (`sameAs`). Every field comes from
 * Admin -> Profile, with the defaults in src/lib/site.ts for empty ones.
 *
 * - Home page: Person + WebSite. Check with https://validator.schema.org/
 *   (Google's Rich Results Test does not list Person on its own).
 * - /about: ProfilePage whose main entity is that Person. The Rich Results
 *   Test lists it as "Profile page".
 */
import type { Profile } from '@/lib/content';
import {
  SITE_ALTERNATE_NAME,
  SITE_DESCRIPTION,
  SITE_PERSON_NAME,
  SITE_ROLE,
  SITE_URL,
  SOCIAL_IMAGE,
} from '@/lib/site';
import { resolveMediaUrl } from '@/utils/mediaUrl';

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const CONTEXT = 'https://schema.org';

/** Structured data needs absolute URLs; a site-relative path gets the origin. */
function absolute(url: string): string {
  return url.startsWith('/') ? `${SITE_URL}${url}` : url;
}

function personName(profile: Profile | null): string {
  return profile?.full_name?.trim() || SITE_PERSON_NAME;
}

function personNode(profile: Profile | null) {
  const sameAs = [profile?.artstation_url, profile?.linkedin_url, profile?.github_url, profile?.twitter_url]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));
  const location = profile?.location?.trim();

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: personName(profile),
    alternateName: profile?.alternate_name?.trim() || SITE_ALTERNATE_NAME,
    jobTitle: profile?.job_title?.trim() || SITE_ROLE,
    description: profile?.meta_description?.trim() || SITE_DESCRIPTION,
    url: SITE_URL,
    image: absolute(resolveMediaUrl(profile?.image_url) || SOCIAL_IMAGE.url),
    ...(location ? { homeLocation: { '@type': 'Place', name: location } } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** Home page: the person and the website they publish. */
export function homeStructuredData(profile: Profile | null) {
  return {
    '@context': CONTEXT,
    '@graph': [
      personNode(profile),
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: personName(profile),
        publisher: { '@id': PERSON_ID },
      },
    ],
  };
}

/** /about: a profile page whose main entity is the person. */
export function aboutStructuredData(profile: Profile | null) {
  return {
    '@context': CONTEXT,
    '@type': 'ProfilePage',
    '@id': `${SITE_URL}/about#profilepage`,
    url: `${SITE_URL}/about`,
    name: `About ${personName(profile)}`,
    ...(profile?.created_at ? { dateCreated: profile.created_at } : {}),
    ...(profile?.updated_at ? { dateModified: profile.updated_at } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: personNode(profile),
  };
}
