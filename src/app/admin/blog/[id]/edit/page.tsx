'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Image as ImageIcon, Link as LinkIcon, Code, Table, Quote, List, ListOrdered, Heading1, Heading2, Heading3, Bold, Italic, Strikethrough } from 'lucide-react';
import NextLink from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  published: boolean;
  read_time: number;
  category_id: number | null;
  tags: string[];
  created_at?: string;
  updated_at: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditBlogPostPage({ params }: PageProps) {
  const [post, setPost] = useState<BlogPost>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: null,
    published: false,
    read_time: 0,
    category_id: null,
    tags: [],
    updated_at: new Date().toISOString()
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCategories();
    if (params.id !== 'new') {
      fetchPost();
    }
  }, [params.id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (data) {
        setPost(data);
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
        // Fetch selected categories for this blog post
        const { data: categoryData, error: categoryError } = await supabase
          .from('blog_post_categories')
          .select('category_id')
          .eq('blog_post_id', params.id);

        if (categoryError) throw categoryError;
        setSelectedCategoryIds(categoryData.map(c => c.category_id.toString()));
      }
    } catch (error: any) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!post.tags.includes(tagInput.trim())) {
        setPost(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight: createLowlight(common),
        HTMLAttributes: {
          class: 'rounded-md bg-gray-800 p-5 font-mono text-sm text-gray-100',
        },
      }),
    ],
    content: post.content,
    onUpdate: ({ editor }) => {
      setPost(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // If there's an existing image, delete it first
      if (post.image_url) {
        const oldPath = post.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('blog-images')
            .remove([`blog-images/${params.id}/thumbnail/${oldPath}`]);
        }
      }
      
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // For new posts, use a temp folder
    const postId = params.id === 'new' ? 'temp' : params.id;
    const filePath = `blog-images/${postId}/thumbnail/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const url = await uploadImage(file);
          editor?.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    };
    
    input.click();
  };

  const addLink = () => {
    const url = window.prompt('Enter the URL');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setPost(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!post.title || !post.slug || !post.excerpt || !post.content) {
        throw new Error('Please fill in all required fields');
      }

      let imageUrl = post.image_url;

      // Upload new image if one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const postData = {
        ...post,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      if (params.id === 'new') {
        postData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([postData])
          .select()
          .single();

        if (error) throw error;

        // If we uploaded an image to temp folder, move it to the actual post folder
        if (imageFile && imageUrl) {
          const oldPath = `blog-images/temp/thumbnail/${imageUrl.split('/').pop()}`;
          const newPath = `blog-images/${data.id}/thumbnail/${imageUrl.split('/').pop()}`;
          
          // Copy the file to the new location
          const { error: copyError } = await supabase.storage
            .from('blog-images')
            .copy(oldPath, newPath);
          
          if (copyError) throw copyError;
          
          // Delete the temp file
          await supabase.storage
            .from('blog-images')
            .remove([oldPath]);
          
          // Get the new absolute URL
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(newPath);
          
          // Update the image URL in the database with the new absolute URL
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ image_url: publicUrl })
            .eq('id', data.id);
          
          if (updateError) throw updateError;
        }

        // Insert selected categories
        if (selectedCategoryIds.length > 0) {
          const { error: categoryError } = await supabase
            .from('blog_post_categories')
            .insert(selectedCategoryIds.map(categoryId => ({
              blog_post_id: data.id,
              category_id: categoryId
            })));

          if (categoryError) throw categoryError;
        }

        router.push('/admin/blog');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', params.id);

        if (error) throw error;

        // Update categories
        await supabase
          .from('blog_post_categories')
          .delete()
          .eq('blog_post_id', params.id);

        if (selectedCategoryIds.length > 0) {
          const { error: categoryError } = await supabase
            .from('blog_post_categories')
            .insert(selectedCategoryIds.map(categoryId => ({
              blog_post_id: params.id,
              category_id: categoryId
            })));

          if (categoryError) throw categoryError;
        }

        router.push('/admin/blog');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    // If the path is already an absolute URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, construct the absolute URL
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {params.id === 'new' ? 'New Blog Post' : 'Edit Blog Post'}
        </h1>
        <NextLink
          href="/admin/blog"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
        >
          Back to Posts
        </NextLink>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={post.title}
            onChange={handleTitleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            type="text"
            id="slug"
            value={post.slug}
            onChange={(e) => setPost({ ...post, slug: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={post.excerpt}
            onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            value={post.content}
            onChange={(e) => setPost({ ...post, content: e.target.value })}
            rows={10}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="read_time" className="block text-sm font-medium text-gray-700">
            Read Time (minutes)
          </label>
          <input
            type="number"
            id="read_time"
            value={post.read_time}
            onChange={(e) => setPost({ ...post, read_time: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Categories</label>
          <div className="mt-2 space-y-2">
            {categories.map((category) => (
              <label key={category.id} className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                    } else {
                      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                    }
                  }}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Thumbnail Image</label>
          <div className="mt-2 flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
            {(imagePreview || post.image_url) && (
              <div className="relative w-20 h-20">
                <Image
                  src={imagePreview || (post.image_url ? getImageUrl(post.image_url) : '')}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="published"
            checked={post.published}
            onChange={(e) => setPost({ ...post, published: e.target.checked })}
            className="rounded border-gray-300 text-black focus:ring-black"
          />
          <label htmlFor="published" className="ml-2 text-sm text-gray-700">
            Published
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Post'}
          </button>
        </div>
      </form>
    </div>
  );
} 