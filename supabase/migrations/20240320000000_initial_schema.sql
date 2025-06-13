-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create categories table with parent_id for hierarchical structure
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

-- Create blog_post_categories join table
create table if not exists blog_post_categories (
  blog_post_id uuid references blog_posts(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (blog_post_id, category_id)
);

-- Create project_categories join table
create table if not exists project_categories (
  project_id uuid references projects(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (project_id, category_id)
);

-- Enable RLS on all tables
alter table categories enable row level security;
alter table projects enable row level security;
alter table blog_posts enable row level security;
alter table blog_post_categories enable row level security;
alter table project_categories enable row level security;

-- Add read_time column to blog_posts table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'read_time') THEN
    ALTER TABLE blog_posts ADD COLUMN read_time integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add published column if it doesn't exist
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

-- Drop existing policies if they exist
do $$ 
begin
  -- Categories policies
  drop policy if exists "Allow public read access on categories" on categories;
  drop policy if exists "Allow authenticated users to insert into categories" on categories;
  drop policy if exists "Allow authenticated users to update categories" on categories;
  drop policy if exists "Allow authenticated users to delete from categories" on categories;

  -- Projects policies
  drop policy if exists "Allow public read access on projects" on projects;
  drop policy if exists "Allow authenticated users to insert into projects" on projects;
  drop policy if exists "Allow authenticated users to update projects" on projects;
  drop policy if exists "Allow authenticated users to delete from projects" on projects;

  -- Blog posts policies
  drop policy if exists "Allow public read access on blog_posts" on blog_posts;
  drop policy if exists "Allow authenticated users to insert into blog_posts" on blog_posts;
  drop policy if exists "Allow authenticated users to update blog_posts" on blog_posts;
  drop policy if exists "Allow authenticated users to delete from blog_posts" on blog_posts;

  -- Blog post categories policies
  drop policy if exists "Allow public read access on blog_post_categories" on blog_post_categories;
  drop policy if exists "Allow authenticated users to insert into blog_post_categories" on blog_post_categories;
  drop policy if exists "Allow authenticated users to update blog_post_categories" on blog_post_categories;
  drop policy if exists "Allow authenticated users to delete from blog_post_categories" on blog_post_categories;

  -- Project categories policies
  drop policy if exists "Allow public read access on project_categories" on project_categories;
  drop policy if exists "Allow authenticated users to insert into project_categories" on project_categories;
  drop policy if exists "Allow authenticated users to update project_categories" on project_categories;
  drop policy if exists "Allow authenticated users to delete from project_categories" on project_categories;

  -- Storage policies
  drop policy if exists "Allow public read access on project-images" on storage.objects;
  drop policy if exists "Allow authenticated users to upload project-images" on storage.objects;
  drop policy if exists "Allow public read access on blog-images" on storage.objects;
  drop policy if exists "Allow authenticated users to upload blog-images" on storage.objects;
end $$;

-- Create policies for categories
create policy "Allow public read access on categories"
  on categories for select
  using (true);

create policy "Allow authenticated users to insert into categories"
  on categories for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update categories"
  on categories for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete from categories"
  on categories for delete
  using (auth.role() = 'authenticated');

-- Create policies for projects
create policy "Allow public read access on projects"
  on projects for select
  using (true);

create policy "Allow authenticated users to insert into projects"
  on projects for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update projects"
  on projects for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete from projects"
  on projects for delete
  using (auth.role() = 'authenticated');

-- Create policies for blog_posts
create policy "Allow public read access on blog_posts"
  on blog_posts for select
  using (true);

create policy "Allow authenticated users to insert into blog_posts"
  on blog_posts for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update blog_posts"
  on blog_posts for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete from blog_posts"
  on blog_posts for delete
  using (auth.role() = 'authenticated');

-- Create policies for blog_post_categories
create policy "Allow public read access on blog_post_categories"
  on blog_post_categories for select
  using (true);

create policy "Allow authenticated users to insert into blog_post_categories"
  on blog_post_categories for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update blog_post_categories"
  on blog_post_categories for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete from blog_post_categories"
  on blog_post_categories for delete
  using (auth.role() = 'authenticated');

-- Create policies for project_categories
create policy "Allow public read access on project_categories"
  on project_categories for select
  using (true);

create policy "Allow authenticated users to insert into project_categories"
  on project_categories for insert
  with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update project_categories"
  on project_categories for update
  using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete from project_categories"
  on project_categories for delete
  using (auth.role() = 'authenticated');

-- Create storage buckets for images
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'project-images') then
    insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true);
  end if;
  if not exists (select 1 from storage.buckets where id = 'blog-images') then
    insert into storage.buckets (id, name, public) values ('blog-images', 'blog-images', true);
  end if;
end $$;

-- Create storage policies
create policy "Allow public read access on project-images"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "Allow authenticated users to upload project-images"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

create policy "Allow public read access on blog-images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

create policy "Allow authenticated users to upload blog-images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_categories_updated_at
  before update on categories
  for each row
  execute function update_updated_at_column();

create trigger update_projects_updated_at
  before update on projects
  for each row
  execute function update_updated_at_column();

create trigger update_blog_posts_updated_at
  before update on blog_posts
  for each row
  execute function update_updated_at_column();