import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload
 * @param blogId The blog post ID
 * @returns The public URL of the uploaded image
 */
export async function uploadBlogImageToSupabase(file: File, blogId: string): Promise<string> {
  const supabase = createClientComponentClient();
  const randomName = Math.random().toString(36).slice(2, 12);
  const ext = file.name.split('.').pop() || 'png';
  const filePath = `blog-images/${blogId}/content/${randomName}.${ext}`;

  const { error } = await supabase.storage.from('blog-images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  // Get public URL
  const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);
  if (!data || !data.publicUrl) throw new Error('Failed to get public URL');
  return data.publicUrl;
}
