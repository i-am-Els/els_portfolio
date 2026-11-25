-- Who the site belongs to, edited in Admin -> Profile ("Name", "Also known as",
-- "Job title"). Feeds the home page's structured data; job_title is also the
-- footer's role line.
--
-- full_name is already in the initial schema; ADD COLUMN IF NOT EXISTS covers
-- databases created without it. An existing full_name is kept as it is.
--
-- Run this BEFORE deploying the code that uses it: the profile form saves these
-- columns, and a save fails while they are missing.

ALTER TABLE profile ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS alternate_name text;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS job_title text;

UPDATE profile SET full_name = 'Eniola Olawale'
WHERE full_name IS NULL OR btrim(full_name) = '';

UPDATE profile SET alternate_name = 'Elsrael'
WHERE alternate_name IS NULL OR btrim(alternate_name) = '';

UPDATE profile SET job_title = '3D Artist & Visual Storyteller'
WHERE job_title IS NULL OR btrim(job_title) = '';
