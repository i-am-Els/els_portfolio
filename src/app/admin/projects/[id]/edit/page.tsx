'use client';

import { useState, useEffect } from 'react';
import { useFlashMessage } from '@/components/FlashMessage';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { uploadProjectImage, uploadProjectGalleryImage, deleteMedia, keyFromUrl } from '@/utils/mediaUpload';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string[];
  published: boolean;
  featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * One gallery slot in the editor.
 *
 * `id` is empty and `file` set until the image has actually been written to B2,
 * so nothing reaches storage unless the user saves. `url` doubles as the preview
 * (a blob: URL while unsaved, the B2 URL afterwards) and, for existing images,
 * as the value that gets retired if the user removes it.
 */
interface GalleryEntry {
  id: string;
  url: string;
  file?: File;
  alt: string;
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [project, setProject] = useState<Project>({
    id: '',
    title: '',
    slug: '',
    description: '',
    image_url: null,
    project_url: null,
    github_url: null,
    technologies: [],
    published: false,
    featured: false,
    order_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showMessage } = useFlashMessage();
  const [newTech, setNewTech] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  // Removed gallery images are held until Save, then retired together.
  const [removedImages, setRemovedImages] = useState<GalleryEntry[]>([]);

  useEffect(() => {
    if (params.id !== 'new') {
      fetchProject();
    } else {
      setLoading(false);
    }
    fetchCategories();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (data) {
        setProject(data);
        // Fetch selected categories for this project
        const { data: categoryData, error: categoryError } = await supabase
          .from('project_categories')
          .select('category_id')
          .eq('project_id', params.id);

        if (categoryError) throw categoryError;
        setSelectedCategories(categoryData.map(c => c.category_id));

        // A failed gallery read must not block editing the rest of the project.
        const { data: galleryData, error: galleryError } = await supabase
          .from('project_images')
          .select('id, image_url, alt, order_index')
          .eq('project_id', params.id)
          .order('order_index', { ascending: true });

        if (galleryError) {
          console.error('Error fetching gallery:', galleryError);
        } else {
          setGallery((galleryData || []).map(row => ({
            id: row.id,
            url: row.image_url,
            alt: row.alt || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .order('name');

      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
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
    setProject(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProject(prev => ({
      ...prev,
      slug: e.target.value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview only — the old image is retired in handleSubmit, once the
      // replacement has actually uploaded.
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  /* ---------------------------------------------------------------- *
   * Gallery — preview now, upload on Save
   * ---------------------------------------------------------------- */

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Clear so the same file can be re-added after being removed.
    e.target.value = '';
    if (!files.length) return;

    setGallery(prev => [
      ...prev,
      ...files.map(file => ({ id: '', url: URL.createObjectURL(file), file, alt: '' }))
    ]);
  };

  const handleGalleryRemove = (index: number) => {
    const entry = gallery[index];
    if (!entry) return;

    if (entry.id) {
      setRemovedImages(prev => [...prev, entry]);
    } else {
      URL.revokeObjectURL(entry.url);
    }
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const handleGalleryMove = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    setGallery(next);
  };

  const handleGalleryAlt = (index: number, alt: string) => {
    setGallery(gallery.map((entry, i) => (i === index ? { ...entry, alt } : entry)));
  };

  /**
   * The gallery table only exists once the migration has been applied, and
   * there's no Supabase CLI on this project — say so plainly instead of
   * surfacing a bare Postgres error.
   */
  const requireGalleryTable = (error: { code?: string } & Error) => {
    if (error?.code === '42P01') {
      throw new Error(
        'Gallery images need the project_images table. Run ' +
          'supabase/migrations/20261011000000_project_gallery.sql in the Supabase SQL editor, then save again.'
      );
    }
    throw error;
  };

  /**
   * Make the gallery match the editor.
   *
   * Uploads happen before a single row is touched — the same rule the featured
   * image follows — so a failed upload never costs the gallery that already
   * exists. Objects whose row is dropped are retired only once that drop
   * succeeded, and both steps are safe to repeat if an earlier attempt died
   * halfway.
   */
  const persistGallery = async (projectId: string) => {
    // 1. Upload the new images so every entry has a real URL to write.
    const written: GalleryEntry[] = [];
    for (const entry of gallery) {
      if (entry.file) {
        const url = await uploadProjectGalleryImage(entry.file, projectId);
        written.push({ id: '', url, alt: entry.alt });
      } else {
        written.push(entry);
      }
    }

    // 2. Drop the rows the user removed, then the objects behind them.
    for (const entry of removedImages) {
      const { error } = await supabase
        .from('project_images')
        .delete()
        .eq('id', entry.id);
      if (error) requireGalleryTable(error);

      const key = keyFromUrl(entry.url);
      if (key) await deleteMedia(key);
    }

    // 3. Insert the new rows, and refresh order/alt on the ones we kept.
    for (let i = 0; i < written.length; i++) {
      const entry = written[i];
      if (entry.id) {
        const { error } = await supabase
          .from('project_images')
          .update({ alt: entry.alt || null, order_index: i, updated_at: new Date().toISOString() })
          .eq('id', entry.id);
        if (error) requireGalleryTable(error);
      } else {
        const { error } = await supabase
          .from('project_images')
          .insert({
            project_id: projectId,
            image_url: entry.url,
            alt: entry.alt || null,
            order_index: i
          });
        if (error) requireGalleryTable(error);
      }
    }

    for (const entry of gallery) {
      if (entry.file) URL.revokeObjectURL(entry.url);
    }
    setGallery(written);
    setRemovedImages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!project.title || !project.slug || !project.description) {
        throw new Error('Please fill in all required fields');
      }

      const isCreating = params.id === 'new';
      let imageUrl = project.image_url;

      // For an existing project, upload the replacement BEFORE touching the row,
      // so a failed upload never costs the old image.
      if (!isCreating && imageFile) {
        imageUrl = await uploadProjectImage(imageFile, params.id);
      }

      const projectData = {
        title: project.title,
        slug: project.slug,
        description: project.description,
        image_url: imageUrl,
        project_url: project.project_url || null,
        github_url: project.github_url || null,
        technologies: project.technologies,
        published: project.published,
        featured: project.featured,
        order_index: project.order_index,
        updated_at: new Date().toISOString()
      };

      if (isCreating) {
        // The row has to exist before its image can have a home. This replaces
        // the old upload-to-temp-then-copy dance, which needed a B2 "copyFiles"
        // capability the application key doesn't have.
        const { data, error } = await supabase
          .from('projects')
          .insert([{ ...projectData, image_url: null, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;

        if (imageFile) {
          const finalUrl = await uploadProjectImage(imageFile, data.id);
          const { error: imageError } = await supabase
            .from('projects')
            .update({ image_url: finalUrl })
            .eq('id', data.id);

          if (imageError) throw imageError;
        }

        // Insert selected categories
        if (selectedCategories.length > 0) {
          const { error: categoryError } = await supabase
            .from('project_categories')
            .insert(selectedCategories.map(categoryId => ({
              project_id: data.id,
              category_id: categoryId
            })));

          if (categoryError) throw categoryError;
        }

        await persistGallery(data.id);

        router.push('/admin/projects');
      } else {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', params.id);

        if (error) throw error;

        // Retire the replaced image only now that the row points at the new one.
        if (imageFile) {
          const newKey = keyFromUrl(imageUrl);
          const oldKey = keyFromUrl(project.image_url);
          if (oldKey && oldKey !== newKey) {
            await deleteMedia(oldKey);
          }
        }

        // Update categories
        await supabase
          .from('project_categories')
          .delete()
          .eq('project_id', params.id);

        if (selectedCategories.length > 0) {
          const { error: categoryError } = await supabase
            .from('project_categories')
            .insert(selectedCategories.map(categoryId => ({
              project_id: params.id,
              category_id: categoryId
            })));

          if (categoryError) throw categoryError;
        }

        await persistGallery(params.id);

        router.push('/admin/projects');
      }
    } catch (error: any) {
      showMessage(error.message || 'An error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTech = () => {
    if (newTech.trim()) {
      setProject(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTech.trim()]
      }));
      setNewTech('');
    }
  };

  const handleRemoveTech = (index: number) => {
    setProject(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {params.id === 'new' ? 'New Project' : 'Edit Project'}
          </h1>
          <Link
            href="/admin/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Back to Projects
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.title}
              onChange={handleTitleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.slug}
              onChange={handleSlugChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={project.description}
              onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Featured Image
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <div className="flex-shrink-0">
                {(imagePreview || project.image_url) && (
                  <div className="relative h-32 w-32">
                    <Image
                      src={resolveMediaUrl(imagePreview || project.image_url) || ''}
                      alt="Project preview"
                      fill
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
                    file:bg-black file:text-white
                    hover:file:bg-gray-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gallery
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Extra images for the project page, shown in this order. Nothing is uploaded until you save.
            </p>

            {gallery.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {gallery.map((entry, index) => (
                  <li key={entry.id || entry.url} className="rounded-lg border border-gray-200 bg-white p-2">
                    <div className="relative aspect-[3/2] w-full overflow-hidden rounded bg-gray-100">
                      <Image
                        src={resolveMediaUrl(entry.url) || ''}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                      {!entry.id && (
                        <span className="absolute top-1 left-1 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-gray-900">
                          Not saved yet
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={entry.alt}
                      onChange={(e) => handleGalleryAlt(index, e.target.value)}
                      placeholder="Alt text (describe the image)"
                      className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                    />

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleGalleryMove(index, -1)}
                          disabled={index === 0}
                          className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGalleryMove(index, 1)}
                          disabled={index === gallery.length - 1}
                          className="rounded border border-gray-300 px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGalleryRemove(index)}
                        className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryAdd}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-black file:text-white
                hover:file:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project URL
            </label>
            <input
              type="url"
              value={project.project_url || ''}
              onChange={(e) => setProject(prev => ({ ...prev, project_url: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub URL
            </label>
            <input
              type="url"
              value={project.github_url || ''}
              onChange={(e) => setProject(prev => ({ ...prev, github_url: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technologies
            </label>
            <div className="mt-1 flex items-center space-x-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                placeholder="Add a technology and press Enter or click Add"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Add
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Press Enter or click Add to add a technology. Click the X to remove a technology.
            </p>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {project.technologies.map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => handleRemoveTech(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <div className="mt-2 space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Index
            </label>
            <input
              type="number"
              value={project.order_index}
              onChange={(e) => setProject(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Controls the display order of projects. Lower numbers appear first. Use this to manually sort your projects in the desired order.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={project.published}
                onChange={(e) => setProject(prev => ({ ...prev, published: e.target.checked }))}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="ml-2 text-sm text-gray-700">Published</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={project.featured}
                onChange={(e) => setProject(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="ml-2 text-sm text-gray-700">Featured</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/admin/projects')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}