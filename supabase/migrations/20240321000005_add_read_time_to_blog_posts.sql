DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'read_time') THEN
    ALTER TABLE blog_posts ADD COLUMN read_time integer DEFAULT 0;
  END IF;
END $$; 