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
  const [usedImages, setUsedImages] = useState<Set<string>>(new Set());
  const [tempUploadedImages, setTempUploadedImages] = useState<Set<string>>(new Set());
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

  // Update editor content when post data is loaded
  useEffect(() => {
    if (editor && post.content) {
      editor.commands.setContent(post.content);
    }
  }, [post.content, editor]);

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

  const uploadImage = async (file: File, isContentImage: boolean = false): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // For new posts, use a temp folder
    const postId = params.id === 'new' ? 'temp' : params.id;
    const folder = isContentImage ? 'content' : 'thumbnail';
    const filePath = `blog-images/${postId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get the full public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    // Track the uploaded image
    setTempUploadedImages(prev => new Set([...prev, publicUrl]));

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
          const url = await uploadImage(file, true);
          editor?.chain().focus().setImage({ src: url }).run();
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }
    };
    
    input.click();
  };

  // Function to clean up unused images
  const cleanupUnusedImages = async () => {
    const postId = params.id === 'new' ? 'temp' : params.id;
    
    // Get all images in the content folder
    const { data: contentImages, error: contentError } = await supabase.storage
      .from('blog-images')
      .list(`blog-images/${postId}/content`);

    if (contentError) {
      console.error('Error listing content images:', contentError);
      return;
    }

    // Delete images that are not in the usedImages set
    for (const image of contentImages) {
      const imagePath = `blog-images/${postId}/content/${image.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(imagePath);

      if (!usedImages.has(publicUrl)) {
        await supabase.storage
          .from('blog-images')
          .remove([imagePath]);
      }
    }
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

        // Move content images from temp to actual post folder and update content
        const { data: tempContentImages, error: tempContentError } = await supabase.storage
          .from('blog-images')
          .list('blog-images/temp/content');

        if (!tempContentError && tempContentImages) {
          let updatedContent = post.content;
          
          for (const image of tempContentImages) {
            const oldPath = `blog-images/temp/content/${image.name}`;
            const newPath = `blog-images/${data.id}/content/${image.name}`;
            
            // Copy the file to the new location
            await supabase.storage
              .from('blog-images')
              .copy(oldPath, newPath);
            
            // Delete the temp file
            await supabase.storage
              .from('blog-images')
              .remove([oldPath]);

            // Get the new URL
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(newPath);

            // Update the content to use the new URL
            const oldUrl = `blog-images/temp/content/${image.name}`;
            updatedContent = updatedContent.replace(new RegExp(oldUrl, 'g'), newPath);
          }

          // Update the post content with the new URLs
          if (updatedContent !== post.content) {
            const { error: contentUpdateError } = await supabase
              .from('blog_posts')
              .update({ content: updatedContent })
              .eq('id', data.id);

            if (contentUpdateError) throw contentUpdateError;
          }
        }

        // Clean up any unused images
        await cleanupUnusedImages();

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
        // For existing posts, ensure we have the full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(imageUrl);
          imageUrl = publicUrl;
        }

        const { error } = await supabase
          .from('blog_posts')
          .update({
            ...postData,
            image_url: imageUrl
          })
          .eq('id', params.id);

        if (error) throw error;

        // Clean up any unused images
        await cleanupUnusedImages();

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

  // Clean up temp images when component unmounts
  useEffect(() => {
    return () => {
      if (params.id === 'new') {
        // Clean up temp folder
        const cleanup = async () => {
          const { data: tempImages } = await supabase.storage
            .from('blog-images')
            .list('blog-images/temp');

          if (tempImages) {
            for (const image of tempImages) {
              await supabase.storage
                .from('blog-images')
                .remove([`blog-images/temp/${image.name}`]);
            }
          }
        };
        cleanup();
      }
    };
  }, [params.id]);

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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Back to Blog Posts
        </NextLink>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
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
            onChange={(e) => setPost({ ...post, title: e.target.value })}
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
            <div className="flex-shrink-0">
              {(imagePreview || post.image_url) && (
                <div className="relative h-32 w-32">
                  <Image
                    src={imagePreview || (post.image_url?.startsWith('http') ? post.image_url : '')}
                    alt="Blog post preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
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

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                title="Heading 1"
              >
                <Heading1 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                title="Heading 2"
              >
                <Heading2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
                title="Heading 3"
              >
                <Heading3 className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                title="Bold"
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                title="Italic"
              >
                <Italic className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('strike') ? 'bg-gray-200' : ''}`}
                title="Strikethrough"
              >
                <Strikethrough className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                title="Bullet List"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                title="Ordered List"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('blockquote') ? 'bg-gray-200' : ''}`}
                title="Blockquote"
              >
                <Quote className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
              <button
                type="button"
                onClick={addImage}
                className="p-2 rounded hover:bg-gray-200"
                title="Insert Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setLink({ href: '' }).run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor?.isActive('link') ? 'bg-gray-200' : ''}`}
                title="Remove Link"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>
            <EditorContent 
              editor={editor} 
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none p-4 min-h-[400px] focus:outline-none" 
            />
          </div>
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