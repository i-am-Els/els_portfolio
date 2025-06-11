import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

// Types for our database tables
export type Project = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  tags: string[];
  demo_url?: string;
  github_url?: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  tags: string[];
  date: string;
  read_time: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  tags: string[];
  created_at: string;
}; 