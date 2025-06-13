'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

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
  const [newTech, setNewTech] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Delete old image if it exists
      if (project.image_url) {
        const oldImagePath = project.image_url.split('/').pop();
        if (oldImagePath) {
          const oldPath = `project-images/${params.id}/thumbnail/${oldImagePath}`;
          await supabase.storage
            .from('project-images')
            .remove([oldPath]);
        }
      }

      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // For new projects, use a temporary folder
    const projectId = params.id === 'new' ? 'temp' : params.id;
    const filePath = `project-images/${projectId}/thumbnail/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return publicUrl;
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

      let imageUrl = project.image_url;

      // Upload new image if one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
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

      if (params.id === 'new') {
        const { data, error } = await supabase
          .from('projects')
          .insert([{ ...projectData, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;

        // If we uploaded an image to temp folder, move it to the project's folder
        if (imageFile && imageUrl) {
          const oldPath = `project-images/temp/thumbnail/${imageUrl.split('/').pop()}`;
          const newPath = `project-images/${data.id}/thumbnail/${imageUrl.split('/').pop()}`;
          
          // Copy to new location
          const { error: copyError } = await supabase.storage
            .from('project-images')
            .copy(oldPath, newPath);
          
          if (copyError) throw copyError;

          // Delete from temp location
          await supabase.storage
            .from('project-images')
            .remove([oldPath]);

          // Update the image URL
          const { data: { publicUrl } } = supabase.storage
            .from('project-images')
            .getPublicUrl(newPath);

          await supabase
            .from('projects')
            .update({ image_url: publicUrl })
            .eq('id', data.id);
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

        router.push('/admin/projects');
      } else {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', params.id);

        if (error) throw error;

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

        router.push('/admin/projects');
      }
    } catch (error: any) {
      setError(error.message);
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

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
                      src={imagePreview || project.image_url || ''}
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