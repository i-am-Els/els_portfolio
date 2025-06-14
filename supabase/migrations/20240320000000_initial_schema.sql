-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create categories table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references categories(id) on delete set null,
  order_index integer default 0
);

-- Create projects table
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  title text not null,
  slug text not null unique,
  description text not null,
  image_url text,
  project_url text,
  github_url text,
  technologies text[] default '{}',
  published boolean default false,
  featured boolean default false,
  order_index integer default 0
);

-- Create blog_posts table
create table if not exists blog_posts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  title text not null,
  slug text not null unique,
  content text not null,
  excerpt text,
  image_url text,
  published boolean default false,
  featured boolean default false,
  reading_time integer,
  meta_title text,
  meta_description text,
  order_index integer default 0,
  tags text[] default '{}'
);

-- Join tables
create table if not exists blog_post_categories (
  blog_post_id uuid references blog_posts(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (blog_post_id, category_id)
);

create table if not exists project_categories (
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (project_id, category_id)
);

-- Create profile table
create table if not exists profile (
    id uuid primary key default uuid_generate_v4(),
    full_name text,
    bio text,
    short_bio text,
    email text,
    phone text,
    location text,
    github_url text,
    artstation_url text,
    linkedin_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profile' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE profile ADD COLUMN user_id uuid;
        ALTER TABLE profile ADD CONSTRAINT profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profile' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE profile ADD COLUMN image_url text;
    END IF;
END $$;

-- Remove profile_image_url column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profile' 
        AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE profile DROP COLUMN profile_image_url;
    END IF;
END $$;

-- Enable RLS
alter table if exists categories enable row level security;
alter table if exists projects enable row level security;
alter table if exists blog_posts enable row level security;
alter table if exists blog_post_categories enable row level security;
alter table if exists project_categories enable row level security;
alter table if exists profile enable row level security;
alter table if exists experiences enable row level security;
alter table if exists skills enable row level security;

-- Add read_time column if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name='blog_posts' and column_name='read_time'
  ) then
    alter table blog_posts add column read_time integer not null default 0;
  end if;
end $$;

-- Recreate update_updated_at_column() safely
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Safely create triggers (only if not already created)
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_categories_updated_at') then
    create trigger update_categories_updated_at
    before update on categories
    for each row
    execute function update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'update_projects_updated_at') then
    create trigger update_projects_updated_at
    before update on projects
    for each row
    execute function update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'update_blog_posts_updated_at') then
    create trigger update_blog_posts_updated_at
    before update on blog_posts
    for each row
    execute function update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'update_profile_updated_at') then
    create trigger update_profile_updated_at
    before update on profile
    for each row
    execute function update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'update_experiences_updated_at') then
    create trigger update_experiences_updated_at
    before update on experiences
    for each row
    execute function update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'update_skills_updated_at') then
    create trigger update_skills_updated_at
    before update on skills
    for each row
    execute function update_updated_at_column();
  end if;
end $$;

-- Drop existing policies and recreate
do $$
declare
  tbl text;
begin
  -- Table names to process
  for tbl in
    select unnest(array[
      'categories', 'projects', 'blog_posts', 
      'blog_post_categories', 'project_categories', 
      'profile', 'experiences', 'skills'
    ])
  loop
    -- Drop all policies from the table
    execute format('drop policy if exists "Allow public read access on %1$I" on %1$I', tbl);
    execute format('drop policy if exists "Allow authenticated users to insert into %1$I" on %1$I', tbl);
    execute format('drop policy if exists "Allow authenticated users to update %1$I" on %1$I', tbl);
    execute format('drop policy if exists "Allow authenticated users to delete from %1$I" on %1$I', tbl);
  end loop;
end $$;


-- Categories Policies
drop policy if exists "Allow public read access on categories" on categories;
drop policy if exists "Allow authenticated users to insert into categories" on categories;
drop policy if exists "Allow authenticated users to update categories" on categories;
drop policy if exists "Allow authenticated users to delete from categories" on categories;

create policy "Allow public read access on categories"
  on categories for select using (true);
create policy "Allow authenticated users to insert into categories"
  on categories for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update categories"
  on categories for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete from categories"
  on categories for delete using (auth.role() = 'authenticated');

-- Projects Policies
drop policy if exists "Allow public read access on projects" on projects;
drop policy if exists "Allow authenticated users to insert into projects" on projects;
drop policy if exists "Allow authenticated users to update projects" on projects;
drop policy if exists "Allow authenticated users to delete from projects" on projects;

create policy "Allow public read access on projects"
  on projects for select using (true);
create policy "Allow authenticated users to insert into projects"
  on projects for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update projects"
  on projects for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete from projects"
  on projects for delete using (auth.role() = 'authenticated');

-- Blog Posts Policies
drop policy if exists "Allow public read access on blog_posts" on blog_posts;
drop policy if exists "Allow authenticated users to insert into blog_posts" on blog_posts;
drop policy if exists "Allow authenticated users to update blog_posts" on blog_posts;
drop policy if exists "Allow authenticated users to delete from blog_posts" on blog_posts;

create policy "Allow public read access on blog_posts"
  on blog_posts for select using (true);
create policy "Allow authenticated users to insert into blog_posts"
  on blog_posts for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update blog_posts"
  on blog_posts for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete from blog_posts"
  on blog_posts for delete using (auth.role() = 'authenticated');

-- Join Tables Policies
drop policy if exists "Allow public read access on blog_post_categories" on blog_post_categories;
drop policy if exists "Allow authenticated users to insert into blog_post_categories" on blog_post_categories;
drop policy if exists "Allow authenticated users to update blog_post_categories" on blog_post_categories;
drop policy if exists "Allow authenticated users to delete from blog_post_categories" on blog_post_categories;

create policy "Allow public read access on blog_post_categories"
  on blog_post_categories for select using (true);
create policy "Allow authenticated users to insert into blog_post_categories"
  on blog_post_categories for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update blog_post_categories"
  on blog_post_categories for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete from blog_post_categories"
  on blog_post_categories for delete using (auth.role() = 'authenticated');

drop policy if exists "Allow public read access on project_categories" on project_categories;
drop policy if exists "Allow authenticated users to insert into project_categories" on project_categories;
drop policy if exists "Allow authenticated users to update project_categories" on project_categories;
drop policy if exists "Allow authenticated users to delete from project_categories" on project_categories;

create policy "Allow public read access on project_categories"
  on project_categories for select using (true);
create policy "Allow authenticated users to insert into project_categories"
  on project_categories for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update project_categories"
  on project_categories for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete from project_categories"
  on project_categories for delete using (auth.role() = 'authenticated');

-- Profile
drop policy if exists "Profile is viewable by everyone" on profile;
drop policy if exists "Profile is editable by authenticated users" on profile;

create policy "Profile is viewable by everyone"
  on profile for select using (true);
create policy "Profile is editable by authenticated users"
  on profile for update using (auth.role() = 'authenticated');

-- Experiences
drop policy if exists "Experiences are viewable by everyone" on experiences;
drop policy if exists "Experiences are editable by authenticated users" on experiences;

create policy "Experiences are viewable by everyone"
  on experiences for select using (true);
create policy "Experiences are editable by authenticated users"
  on experiences for all using (auth.role() = 'authenticated');

-- Skills
drop policy if exists "Skills are viewable by everyone" on skills;
drop policy if exists "Skills are editable by authenticated users" on skills;

create policy "Skills are viewable by everyone"
  on skills for select using (true);
create policy "Skills are editable by authenticated users"
  on skills for all using (auth.role() = 'authenticated');

-- Storage Buckets
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'project-images') then
    insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true);
  end if;

  if not exists (select 1 from storage.buckets where id = 'blog-images') then
    insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true);
  end if;

  if not exists (select 1 from storage.buckets where id = 'images') then
    insert into storage.buckets (id, name, public) values ('images', 'images', true);
  end if;
end $$;

-- Storage Policies
DO $$ 
BEGIN
    -- Project Images policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow public read access on project-images'
    ) THEN
        create policy "Allow public read access on project-images"
        on storage.objects for select
        using (bucket_id = 'project-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload project-images'
    ) THEN
        create policy "Allow authenticated users to upload project-images"
        on storage.objects for insert
        with check (bucket_id = 'project-images' and auth.role() = 'authenticated');
    END IF;

    -- Blog Images policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow public read access on blog-images'
    ) THEN
        create policy "Allow public read access on blog-images"
        on storage.objects for select
        using (bucket_id = 'blog-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload blog-images'
    ) THEN
        create policy "Allow authenticated users to upload blog-images"
        on storage.objects for insert
        with check (bucket_id = 'blog-images' and auth.role() = 'authenticated');
    END IF;

    -- Profile Images policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow public read access on images'
    ) THEN
        create policy "Allow public read access on images"
        on storage.objects for select
        using (bucket_id = 'images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload images'
    ) THEN
        create policy "Allow authenticated users to upload images"
        on storage.objects for insert
        with check (bucket_id = 'images' and auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to update images'
    ) THEN
        create policy "Allow authenticated users to update images"
        on storage.objects for update
        using (bucket_id = 'images' and auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Allow authenticated users to delete images'
    ) THEN
        create policy "Allow authenticated users to delete images"
        on storage.objects for delete
        using (bucket_id = 'images' and auth.role() = 'authenticated');
    END IF;
END $$;

-- Enable RLS
alter table profile enable row level security;

-- Create policies if they don't exist
DO $$ 
BEGIN
    -- Profile policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile' 
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        create policy "Public profiles are viewable by everyone"
        on profile for select
        to public
        using (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        create policy "Users can insert their own profile"
        on profile for insert
        to authenticated
        with check (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        create policy "Users can update their own profile"
        on profile for update
        to authenticated
        using (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profile' 
        AND policyname = 'Users can delete their own profile'
    ) THEN
        create policy "Users can delete their own profile"
        on profile for delete
        to authenticated
        using (auth.uid() = user_id);
    END IF;

    -- Experiences policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'experiences' 
        AND policyname = 'Public read access on experiences'
    ) THEN
        create policy "Public read access on experiences"
        on experiences for select
        to public
        using (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'experiences' 
        AND policyname = 'Authenticated users can manage experiences'
    ) THEN
        create policy "Authenticated users can manage experiences"
        on experiences for all
        to authenticated
        using (true);
    END IF;

    -- Skills policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'skills' 
        AND policyname = 'Public read access on skills'
    ) THEN
        create policy "Public read access on skills"
        on skills for select
        to public
        using (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'skills' 
        AND policyname = 'Authenticated users can manage skills'
    ) THEN
        create policy "Authenticated users can manage skills"
        on skills for all
        to authenticated
        using (true);
    END IF;
END $$;

-- Create function to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
end;
$$ language plpgsql;

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'set_updated_at' 
        AND tgrelid = 'profile'::regclass
    ) THEN
        create trigger set_updated_at
            before update on profile
            for each row
            execute function handle_updated_at();
    END IF;
END $$;

-- Education table
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies for education table
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on education"
ON education FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert education"
ON education FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update education"
ON education FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete education"
ON education FOR DELETE
USING (auth.role() = 'authenticated');
