-- Home page search / link-preview title, edited in Admin -> Profile.
--
-- Run this BEFORE deploying the code that uses it: the profile form saves this
-- column, and a save fails while it is missing.

ALTER TABLE profile ADD COLUMN IF NOT EXISTS meta_title text;

UPDATE profile
SET meta_title = 'Eniola Olawale – 3D Artist & Visual Storyteller'
WHERE meta_title IS NULL OR btrim(meta_title) = '';
