-- Create storage bucket for project images
insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true);

-- Set up storage policies
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'project-images' );

create policy "Authenticated users can upload project images"
on storage.objects for insert
with check (
  bucket_id = 'project-images'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can update project images"
on storage.objects for update
using (
  bucket_id = 'project-images'
  and auth.role() = 'authenticated'
);

create policy "Authenticated users can delete project images"
on storage.objects for delete
using (
  bucket_id = 'project-images'
  and auth.role() = 'authenticated'
); 