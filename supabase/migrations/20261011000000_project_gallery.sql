-- Project gallery: several ordered images per project, shown on the public
-- project page. Same shape as project_categories.
--
-- The bytes live in Backblaze B2 at project-images/{project_id}/gallery/{name}.webp
-- (see src/utils/mediaPaths.ts); only the public URL is stored here. Deleting a
-- project cascades to these rows, and the admin delete flow clears the folder.

CREATE TABLE IF NOT EXISTS project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- project_categories has no index, but a gallery is read on every project page
-- load, so this one earns its keep.
CREATE INDEX IF NOT EXISTS project_images_project_id_idx
    ON project_images(project_id, order_index);

ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on project_images" ON project_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert into project_images" ON project_images;
DROP POLICY IF EXISTS "Allow authenticated users to update into project_images" ON project_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete from project_images" ON project_images;

CREATE POLICY "Allow public read access on project_images"
    ON project_images FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert into project_images"
    ON project_images FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update into project_images"
    ON project_images FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete from project_images"
    ON project_images FOR DELETE
    USING (auth.role() = 'authenticated');

-- updated_at, using update_updated_at_column() which the initial schema
-- (20240320000000) already defines and applies to every other table. Deliberately
-- not redefined here, so this migration cannot change how any other table
-- behaves.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_project_images_updated_at'
    ) THEN
        CREATE TRIGGER update_project_images_updated_at
            BEFORE UPDATE ON project_images
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
