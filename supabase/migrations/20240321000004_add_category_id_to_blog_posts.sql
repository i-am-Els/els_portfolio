ALTER TABLE blog_posts
ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL; 