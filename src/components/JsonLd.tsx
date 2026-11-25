/**
 * Renders schema.org structured data (built in src/lib/structuredData.ts) as a
 * JSON-LD script tag. Invisible on the page.
 */
export default function JsonLd({ data }: { data: object }) {
  // JSON.stringify does not escape "<", so a profile value containing
  // "</script>" could end the tag early; the < escape keeps it inert.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
