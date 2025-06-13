import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function getRecentProjects() {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching recent projects:', error);
    return [];
  }

  return data || [];
}

export async function getRecentBlogPosts() {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching recent blog posts:', error);
    return [];
  }

  return data || [];
} 