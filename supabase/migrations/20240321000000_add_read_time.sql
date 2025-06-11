-- Add read_time column to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN read_time integer NOT NULL DEFAULT 0;

-- Add published column if it doesn't exist
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false; 