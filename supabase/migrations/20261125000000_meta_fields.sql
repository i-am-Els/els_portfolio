-- Search / link-preview fields.
--
-- projects and blog_posts get meta_title and meta_description, backfilled with
-- a copy of each row's title and a plain-text summary of its description
-- (projects) or excerpt, falling back to the body (posts), so existing items
-- need no editing. profile gets meta_description: the home page's preview
-- description.
--
-- blog_posts.meta_title / meta_description are already in the initial schema,
-- but only for databases created from it, hence ADD COLUMN IF NOT EXISTS.
--
-- Run this BEFORE deploying the code that uses it: the admin forms save these
-- columns, and a save fails while they are missing.

ALTER TABLE projects   ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE projects   ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE profile    ADD COLUMN IF NOT EXISTS meta_description text;

-- HTML -> plain text, cut to 160 characters at a word boundary.
-- Mirrors src/utils/plainText.ts.
CREATE OR REPLACE FUNCTION pg_temp.meta_summary(html text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  WITH t AS (
    SELECT btrim(regexp_replace(
      replace(replace(replace(replace(replace(replace(
        regexp_replace(coalesce(html, ''), '<[^>]*>', ' ', 'g'),
        '&nbsp;', ' '), '&quot;', '"'), '&#39;', ''''), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
      '\s+', ' ', 'g')) AS s
  )
  SELECT CASE
    WHEN length(s) <= 160 THEN s
    ELSE rtrim(regexp_replace(left(s, 159), '\s+\S*$', '')) || '…'
  END
  FROM t
$$;

UPDATE projects
SET meta_title = title
WHERE meta_title IS NULL OR btrim(meta_title) = '';

UPDATE projects
SET meta_description = pg_temp.meta_summary(description)
WHERE meta_description IS NULL OR btrim(meta_description) = '';

UPDATE blog_posts
SET meta_title = title
WHERE meta_title IS NULL OR btrim(meta_title) = '';

UPDATE blog_posts
SET meta_description = pg_temp.meta_summary(coalesce(nullif(btrim(excerpt), ''), content))
WHERE meta_description IS NULL OR btrim(meta_description) = '';

UPDATE profile
SET meta_description = 'Real-time 3D artist: stylised environments, shaders and Unity, telling stories in the engine.'
WHERE meta_description IS NULL OR btrim(meta_description) = '';
