ALTER TABLE blog_posts
ADD COLUMN category_ids uuid[] DEFAULT '{}'; 