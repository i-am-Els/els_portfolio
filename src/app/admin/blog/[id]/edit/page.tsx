'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RichTextEditor, RichTextEditorHandle } from '@/components/editor/RichTextEditor';
import { uploadBlogImageToSupabase } from '@/utils/supabaseUpload';
import React, { useRef } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { useFlashMessage } from '@/components/FlashMessage';

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
  const { showMessage } = useFlashMessage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [usedImages, setUsedImages] = useState<Set<string>>(new Set());
  // Map blob URLs to original Supabase URLs
  const [blobToSupabaseUrl, setBlobToSupabaseUrl] = useState<{ [blobUrl: string]: string }>({});
  // Store the original content as loaded from the DB
  const [originalContent, setOriginalContent] = useState<string>('');
  const editorRef = useRef<RichTextEditorHandle>(null);
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
      showMessage('Error fetching categories', 'error');
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
        setOriginalContent(data.content || '');
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
      showMessage('Failed to load post', 'error');
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!post.tags.includes(tagInput.trim())) {
        setPost((prev: BlogPost) => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost((prev: BlogPost) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  useEffect(() => {
    if (post.content) {
      const urls = extractImageUrls(post.content);
      setUsedImages(urls);
    }
  }, [post.content]);

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

  // Function to extract image URLs from content
  const extractImageUrls = (content: string): Set<string> => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const urls = new Set<string>();
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      urls.add(match[1]);
    }
    return urls;
  };

  // Update used images when content changes
  useEffect(() => {
    if (post.content) {
      const urls = extractImageUrls(post.content);
      setUsedImages(urls);
    }
  }, [post.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate required fields
      if (!post.title || !post.slug || !post.excerpt || !post.content) {
        throw new Error('Please fill in all required fields');
      }

      let imageUrl = post.image_url;
      // Remove previous featured image (thumbnail) from Supabase if changed
      if (imageFile && post.image_url) {
        try {
          const oldPath = post.image_url.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('blog-images')
              .remove([`blog-images/${params.id}/thumbnail/${oldPath}`]);
          }
        } catch (err) {
          // Ignore deletion errors
        }
      }
      // Upload new featured image if selected
      if (imageFile) {
        imageUrl = await uploadBlogImageToSupabase(imageFile, params.id);
      }

      // Prepare post data
      const postData = {
        ...post,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      let blogId = params.id;
      // For new posts, insert first to get the id
      if (params.id === 'new') {
        postData.created_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([postData])
          .select()
          .single();
        if (error || !data) throw error || new Error('Blog not created');
        blogId = data.id?.toString() || data.slug;
        // Insert categories
        if (selectedCategoryIds.length > 0) {
          await supabase
            .from('blog_post_categories')
            .insert(selectedCategoryIds.map((categoryId: string | number) => ({
              blog_post_id: blogId,
              category_id: categoryId
            })));
        }
      } else {
        // For existing posts, update basic fields
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', blogId);
        if (updateError) throw updateError;
        // Remove all previous categories and update
        await supabase
          .from('blog_post_categories')
          .delete()
          .eq('blog_post_id', blogId);
        if (selectedCategoryIds.length > 0) {
          const { error: categoryError } = await supabase
            .from('blog_post_categories')
            .insert(selectedCategoryIds.map((categoryId: string | number) => ({
              blog_post_id: blogId,
              category_id: categoryId
            })));
          if (categoryError) throw categoryError;
        }
      }
      // --- Editor Images: Always upload and replace pending images for both new and existing posts ---
      const pendingImages = editorRef.current?.getPendingImages() || {};
      const replaceMap: { [localUrl: string]: string } = {};
      for (const [localUrl, file] of Object.entries(pendingImages)) {
        const supaUrl = await uploadBlogImageToSupabase(file, blogId);
        replaceMap[localUrl] = supaUrl;
      }
      if (Object.keys(replaceMap).length > 0) {
        editorRef.current?.replaceImageSrcs(replaceMap);
      }
      const updatedContent = editorRef.current?.editor?.getHTML() || post.content;

      if (params.id !== 'new') {
        // --- Robust image deletion logic ---
        // 1. Extract all image URLs before and after editing
        const beforeSet = extractImageUrls(originalContent);
        const afterSet = extractImageUrls(updatedContent);
        const removedImages = Array.from(beforeSet).filter(url => !afterSet.has(url));
        console.log('[DEBUG] Images before edit:', Array.from(beforeSet));
        console.log('[DEBUG] Images after edit:', Array.from(afterSet));
        console.log('[DEBUG] Removed images:', removedImages);

        // 3. Get the latest blob-to-Supabase mapping from the editor
        const blobToSupabaseUrl = editorRef.current?.getBlobToSupabaseUrlMap ? editorRef.current.getBlobToSupabaseUrlMap() : {};

        // 4. For each removed image, resolve to Supabase URL if needed and delete
        for (const removedUrl of removedImages) {
          let supaUrl: string | undefined = removedUrl;
          if (removedUrl.startsWith('blob:')) {
            supaUrl = blobToSupabaseUrl[removedUrl];
            console.log('[DEBUG] Blob removed:', removedUrl, '→ Supabase URL:', supaUrl);
          }
          if (typeof supaUrl === 'string' && supaUrl.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`)) {
            let storagePath = supaUrl.replace(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`, '');
            if (storagePath.startsWith('blog-images/blog-images/')) {
              storagePath = storagePath.replace('blog-images/blog-images/', 'blog-images/');
            }
            console.log('[DEBUG] Deleting from Supabase:', { removedUrl, supaUrl, storagePath });
            // Only delete if path is in the content folder for this blog
            if (
              storagePath.startsWith(`blog-images/${blogId}/content/`) ||
              storagePath.startsWith(`blog-images/blog-images/${blogId}/content/`)
            ) {
              const { error } = await supabase.storage
                .from('blog-images')
                .remove([storagePath]);
              if (error) {
                console.error('Supabase image delete error:', error, 'for', storagePath);
              }
            }
          } else {
            if (removedUrl.startsWith('blob:')) {
              console.log('[DEBUG] Skipped blob, could not resolve Supabase URL:', removedUrl);
            } else {
              console.log('[DEBUG] Skipped non-Supabase image:', removedUrl);
            }
          }
        }
        // --- End robust image deletion logic ---
      }


      // ... (rest of the code remains the same)
      // Save updated content
      const { error: contentUpdateError } = await supabase
        .from('blog_posts')
        .update({ content: updatedContent })
        .eq('id', blogId);
      if (contentUpdateError) throw contentUpdateError;

      router.push('/admin/blog');
    } catch (error: any) {
      showMessage(error.message || 'An error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
        <NextLink
          href="/admin/blog"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Back to Blog Posts
        </NextLink>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={post.title}
              onChange={e => setPost((prev: BlogPost) => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          value={post.slug}
          onChange={e => setPost((prev: BlogPost) => ({ ...prev, slug: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium">
          Excerpt <span className="text-red-500">*</span>
        </label>
        <textarea
          id="excerpt"
          value={post.excerpt}
          onChange={e => setPost((prev: BlogPost) => ({ ...prev, excerpt: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
        />
      </div>
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Categories
        </label>
        <div className="mt-2 space-y-2">
          {categories.map(category => (
            <label key={category.id} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(category.id)}
                onChange={e => {
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
      {/* Tags Input */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="mt-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Type a tag and press Enter"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Press Enter to add a tag</p>
        </div>
      </div>
      {/* Featured Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Featured Image
        </label>
        <div className="mt-1 flex items-center space-x-4">
          <div className="flex-shrink-0">
            {(imagePreview || post.image_url) && (
              <div className="relative h-32 w-32">
                <Image
                  src={imagePreview || post.image_url || ''}
                  alt="Post preview"
                  width={128}
                  height={128}
                  className="object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-white file:text-gray-700
                hover:file:bg-gray-50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended size: 1200x800px. Max file size: 5MB
            </p>
          </div>
        </div>
      </div>
      {/* Read Time */}
      <div>
        <label htmlFor="read_time" className="block text-sm font-medium">
          Read Time (minutes) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="read_time"
          value={post.read_time}
          onChange={e => setPost((prev: BlogPost) => ({ ...prev, read_time: parseInt(e.target.value) || 0 }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
          min="0"
          required
        />
      </div>
      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Content <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          ref={editorRef}
          content={post.content}
          setContent={content => setPost((prev: BlogPost) => ({ ...prev, content }))}
          className="mb-6"
        />
      </div>
      {/* Published Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="published"
          checked={post.published}
          onChange={e => setPost((prev: BlogPost) => ({ ...prev, published: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
        />
        <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
          Publish immediately
        </label>
      </div>
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Post'}
        </button>
      </div>
    </form>
  </div>
);
}