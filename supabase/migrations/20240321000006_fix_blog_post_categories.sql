-- Drop the duplicate blog_post_categories table if it exists
DROP TABLE IF EXISTS blog_post_categories;

-- Recreate the blog_post_categories table with correct column types
CREATE TABLE IF NOT EXISTS blog_post_categories (
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, category_id)
);

-- Drop the category_id column from blog_posts if it exists
ALTER TABLE blog_posts DROP COLUMN IF EXISTS category_id; 