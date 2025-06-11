-- Add category_id and tags columns to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN category_id integer REFERENCES categories(id),
ADD COLUMN tags text[] DEFAULT '{}';

-- Create index for faster category lookups
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id); 