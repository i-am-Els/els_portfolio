'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  bio: string;
  short_bio: string;
  email: string;
  phone: string;
  location: string;
  github_url: string;
  artstation_url: string;
  linkedin_url: string;
  image_url?: string;
  user_id: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  skills: string[];
  order_index: number;
}

interface Skill {
  id: string;
  category: string;
  items: string[];
  order_index: number;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  order_index: number;
}

export default function ProfileAdmin() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savedExperiences, setSavedExperiences] = useState<Experience[]>([]);
  const [formExperience, setFormExperience] = useState<Experience | null>(null);
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [savedSkills, setSavedSkills] = useState<Skill[]>([]);
  const [formSkill, setFormSkill] = useState<Skill | null>(null);
  const [isEditingSkill, setIsEditingSkill] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadMessage, setImageUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Separate states for experiences
  const [isSavingExperiences, setIsSavingExperiences] = useState(false);
  const [experienceSaveMessage, setExperienceSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Separate states for skills
  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [skillSaveMessage, setSkillSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [savedEducation, setSavedEducation] = useState<Education[]>([]);
  const [formEducation, setFormEducation] = useState<Education | null>(null);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [isSavingEducation, setIsSavingEducation] = useState(false);
  const [educationSaveMessage, setEducationSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProfile();
    fetchExperiences();
    fetchSkills();
    fetchEducation();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        console.log('Fetched profile data:', data); // Debug log
        setProfile(data);
      } else {
        // Create a new profile if none exists
        const newProfile: Profile = {
          id: crypto.randomUUID(),
          bio: '',
          short_bio: '',
          email: '',
          phone: '',
          location: '',
          github_url: '',
          artstation_url: '',
          linkedin_url: '',
          image_url: '',
          user_id: user.id
        };
        
        const { error: insertError } = await supabase
          .from('profile')
          .insert([newProfile]);

        if (insertError) throw insertError;
        
        setProfile(newProfile);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error); // Debug log
      setError(error.message);
    }
  };

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSavedExperiences(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSavedSkills(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEducation = async () => {
    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSavedEducation(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const { error } = await supabase
        .from('profile')
        .update({
          ...profile,
          user_id: user.id
        })
        .eq('id', profile.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const startNewExperience = () => {
    setFormExperience({
      id: crypto.randomUUID(),
      title: '',
      company: '',
      period: '',
      description: '',
      skills: [],
      order_index: savedExperiences.length
    });
    setIsEditingExperience(false);
  };

  const startEditingExperience = (experience: Experience) => {
    setFormExperience({ ...experience });
    setIsEditingExperience(true);
  };

  const cancelForm = () => {
    setFormExperience(null);
    setIsEditingExperience(false);
  };

  const saveExperience = async () => {
    if (!formExperience) return;

    setIsSavingExperiences(true);
    setExperienceSaveMessage(null);
    try {
      if (isEditingExperience) {
        // Update existing experience
        const { error: updateError } = await supabase
          .from('experiences')
          .update({
            title: formExperience.title,
            company: formExperience.company,
            period: formExperience.period,
            description: formExperience.description,
            skills: formExperience.skills,
            order_index: formExperience.order_index
          })
          .eq('id', formExperience.id);

        if (updateError) throw updateError;
      } else {
        // Insert new experience
        const { error: insertError } = await supabase
          .from('experiences')
          .insert([{
            ...formExperience,
            order_index: savedExperiences.length
          }]);

        if (insertError) throw insertError;
      }

      setExperienceSaveMessage({ type: 'success', text: `Experience ${isEditingExperience ? 'updated' : 'saved'} successfully!` });
      await fetchExperiences(); // Refresh the list
      cancelForm(); // Clear the form
    } catch (error: any) {
      console.error('Error saving experience:', error);
      setExperienceSaveMessage({ type: 'error', text: `Error saving experience: ${error.message}` });
    } finally {
      setIsSavingExperiences(false);
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchExperiences(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting experience:', error);
      setExperienceSaveMessage({ type: 'error', text: `Error deleting experience: ${error.message}` });
    }
  };

  const reorderExperience = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === savedExperiences.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const experiences = [...savedExperiences];
    [experiences[index], experiences[newIndex]] = [experiences[newIndex], experiences[index]];

    try {
      // Update order_index for both experiences while preserving all fields
      const { error } = await supabase
        .from('experiences')
        .upsert([
          { 
            ...experiences[index],
            order_index: index 
          },
          { 
            ...experiences[newIndex],
            order_index: newIndex 
          }
        ]);

      if (error) throw error;
      await fetchExperiences(); // Refresh the list
    } catch (error: any) {
      console.error('Error reordering experiences:', error);
      setExperienceSaveMessage({ type: 'error', text: `Error reordering experiences: ${error.message}` });
    }
  };

  const startNewSkill = () => {
    setFormSkill({
      id: crypto.randomUUID(),
      category: '',
      items: [],
      order_index: savedSkills.length
    });
    setIsEditingSkill(false);
  };

  const startEditingSkill = (skill: Skill) => {
    setFormSkill({ ...skill });
    setIsEditingSkill(true);
  };

  const cancelSkillForm = () => {
    setFormSkill(null);
    setIsEditingSkill(false);
  };

  const saveSkill = async () => {
    if (!formSkill) return;

    setIsSavingSkills(true);
    setSkillSaveMessage(null);
    try {
      if (isEditingSkill) {
        // Update existing skill
        const { error: updateError } = await supabase
          .from('skills')
          .update({
            category: formSkill.category,
            items: formSkill.items,
            order_index: formSkill.order_index
          })
          .eq('id', formSkill.id);

        if (updateError) throw updateError;
      } else {
        // Insert new skill
        const { error: insertError } = await supabase
          .from('skills')
          .insert([{
            ...formSkill,
            order_index: savedSkills.length
          }]);

        if (insertError) throw insertError;
      }

      setSkillSaveMessage({ type: 'success', text: `Skill category ${isEditingSkill ? 'updated' : 'saved'} successfully!` });
      await fetchSkills(); // Refresh the list
      cancelSkillForm(); // Clear the form
    } catch (error: any) {
      console.error('Error saving skill:', error);
      setSkillSaveMessage({ type: 'error', text: `Error saving skill: ${error.message}` });
    } finally {
      setIsSavingSkills(false);
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSkills(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      setSkillSaveMessage({ type: 'error', text: `Error deleting skill: ${error.message}` });
    }
  };

  const reorderSkill = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === savedSkills.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const skills = [...savedSkills];
    [skills[index], skills[newIndex]] = [skills[newIndex], skills[index]];

    try {
      // Update order_index for both skills while preserving all fields
      const { error } = await supabase
        .from('skills')
        .upsert([
          { 
            ...skills[index],
            order_index: index 
          },
          { 
            ...skills[newIndex],
            order_index: newIndex 
          }
        ]);

      if (error) throw error;
      await fetchSkills(); // Refresh the list
    } catch (error: any) {
      console.error('Error reordering skills:', error);
      setSkillSaveMessage({ type: 'error', text: `Error reordering skills: ${error.message}` });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setImageUploadMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    setIsUploadingImage(true);
    setImageUploadMessage(null);

    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id || crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profile')
        .update({ 
          image_url: data.publicUrl,
          user_id: profile?.user_id 
        })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, image_url: data.publicUrl } : null);
      setImageUploadMessage({ type: 'success', text: 'Profile image updated successfully!' });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setImageUploadMessage({ type: 'error', text: `Error uploading image: ${error.message}` });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddEducation = () => {
    setFormEducation({
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: null,
      description: null,
      order_index: savedEducation.length
    });
    setIsEditingEducation(true);
  };

  const handleEditEducation = (education: Education) => {
    setFormEducation(education);
    setIsEditingEducation(true);
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('education')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchEducation();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSaveEducation = async () => {
    if (!formEducation) return;

    setIsSavingEducation(true);
    setEducationSaveMessage(null);

    try {
      const { error } = await supabase
        .from('education')
        .upsert([formEducation]);

      if (error) throw error;

      setEducationSaveMessage({ type: 'success', text: 'Education saved successfully!' });
      setIsEditingEducation(false);
      setFormEducation(null);
      await fetchEducation();
    } catch (error: any) {
      setEducationSaveMessage({ type: 'error', text: error.message });
    } finally {
      setIsSavingEducation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {isUploadingImage && (
          <div className="bg-blue-50 text-blue-600 p-4 rounded-md mb-6 flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Please wait while your image is uploading. Do not click "Save Changes" until the upload is complete.
          </div>
        )}

        {/* Profile Image Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {(imagePreview || profile?.image_url) ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreview || profile?.image_url || ''}
                      alt="Profile"
                      fill
                      sizes="128px"
                      className="object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', profile?.image_url);
                        // Remove the src to show the fallback SVG
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <label
                htmlFor="image-upload"
                className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
                title="Change profile image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">Profile Image</h3>
              <p className="text-sm text-gray-500 mt-1">
                Upload a profile image. The image should be square (1:1 aspect ratio). Max file size: 5MB.
              </p>
              {imageUploadMessage && (
                <div className={`mt-2 p-2 rounded-md ${
                  imageUploadMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {imageUploadMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={updateProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={profile?.bio || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Bio
            </label>
            <textarea
              value={profile?.short_bio || ''}
              onChange={(e) => setProfile(prev => prev ? { ...prev, short_bio: e.target.value } : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={profile?.phone || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={profile?.location || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, location: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                value={profile?.github_url || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, github_url: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ArtStation URL
              </label>
              <input
                type="url"
                value={profile?.artstation_url || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, artstation_url: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={profile?.linkedin_url || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, linkedin_url: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploadingImage}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                isUploadingImage 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {isUploadingImage ? 'Uploading Image...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Experiences Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
          <button
            onClick={startNewExperience}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black text-sm"
          >
            Add New Experience
          </button>
        </div>

        {experienceSaveMessage && (
          <div className={`mb-4 p-4 rounded-md ${
            experienceSaveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {experienceSaveMessage.text}
          </div>
        )}

        {/* Display saved experiences */}
        <div className="space-y-6 mb-8">
          {savedExperiences.map((experience, index) => (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{experience.title}</h3>
                  <p className="text-gray-600">{experience.company}</p>
                  <p className="text-sm text-gray-500 mt-1">{experience.period}</p>
                  <p className="text-gray-600 mt-4">{experience.description}</p>
                  {experience.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {experience.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => reorderExperience(index, 'up')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => reorderExperience(index, 'down')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    disabled={index === savedExperiences.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => startEditingExperience(experience)}
                    className="p-2 text-blue-500 hover:text-blue-700"
                    title="Edit experience"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteExperience(experience.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Delete experience"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form for new/edit experience */}
        {formExperience && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {isEditingExperience ? 'Edit Experience' : 'Add New Experience'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formExperience.title}
                  onChange={(e) => setFormExperience({ ...formExperience, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formExperience.company}
                  onChange={(e) => setFormExperience({ ...formExperience, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. Tech Company Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <input
                  type="text"
                  value={formExperience.period}
                  onChange={(e) => setFormExperience({ ...formExperience, period: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. Jan 2020 - Present"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formExperience.description}
                  onChange={(e) => setFormExperience({ ...formExperience, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  rows={4}
                  placeholder="Describe your responsibilities and achievements..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formExperience.skills.join(', ')}
                  onChange={(e) => setFormExperience({ 
                    ...formExperience, 
                    skills: e.target.value.split(',').map(s => s.trim())
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. React, TypeScript, Node.js"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveExperience}
                  disabled={isSavingExperiences}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                >
                  {isSavingExperiences ? 'Saving...' : isEditingExperience ? 'Update Experience' : 'Save Experience'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
          <button
            onClick={startNewSkill}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black text-sm"
          >
            Add Skill Category
          </button>
        </div>

        {skillSaveMessage && (
          <div className={`mb-4 p-4 rounded-md ${
            skillSaveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {skillSaveMessage.text}
          </div>
        )}

        {/* Display saved skills */}
        <div className="space-y-6 mb-8">
          {savedSkills.map((skill, index) => (
            <div key={skill.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{skill.category}</h3>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {skill.items.map((skillName, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {skillName}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <button
                    onClick={() => reorderSkill(index, 'up')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => reorderSkill(index, 'down')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    disabled={index === savedSkills.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => startEditingSkill(skill)}
                    className="p-2 text-blue-500 hover:text-blue-700"
                    title="Edit skill category"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteSkill(skill.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Delete skill category"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form for new/edit skill */}
        {formSkill && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {isEditingSkill ? 'Edit Skill Category' : 'Add New Skill Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formSkill.category}
                  onChange={(e) => setFormSkill({ ...formSkill, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. Programming Languages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formSkill.items.join(', ')}
                  onChange={(e) => setFormSkill({ 
                    ...formSkill, 
                    items: e.target.value.split(',').map(s => s.trim())
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="e.g. JavaScript, TypeScript, React"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelSkillForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSkill}
                  disabled={isSavingSkills}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50"
                >
                  {isSavingSkills ? 'Saving...' : isEditingSkill ? 'Update Skill Category' : 'Save Skill Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Education Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Education</h2>
          {!isEditingEducation && (
            <button
              onClick={handleAddEducation}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Education
            </button>
          )}
        </div>

        {isEditingEducation && formEducation && (
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                Institution
              </label>
              <input
                type="text"
                id="institution"
                value={formEducation.institution}
                onChange={(e) => setFormEducation({ ...formEducation, institution: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700">
                Degree
              </label>
              <input
                type="text"
                id="degree"
                value={formEducation.degree}
                onChange={(e) => setFormEducation({ ...formEducation, degree: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="field_of_study" className="block text-sm font-medium text-gray-700">
                Field of Study
              </label>
              <input
                type="text"
                id="field_of_study"
                value={formEducation.field_of_study}
                onChange={(e) => setFormEducation({ ...formEducation, field_of_study: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="month"
                  value={formEducation.start_date}
                  onChange={(e) => setFormEducation({ ...formEducation, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="month"
                  value={formEducation.end_date || ''}
                  onChange={(e) => setFormEducation({ ...formEducation, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formEducation.description || ''}
                onChange={(e) => setFormEducation({ ...formEducation, description: e.target.value || null })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>

            {educationSaveMessage && (
              <div className={`p-4 rounded-md ${
                educationSaveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {educationSaveMessage.text}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingEducation(false);
                  setFormEducation(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEducation}
                disabled={isSavingEducation}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                {isSavingEducation ? 'Saving...' : 'Save Education'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {savedEducation.map((education) => (
            <div key={education.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{education.institution}</h3>
                <p className="text-gray-600">{education.degree} in {education.field_of_study}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(education.start_date).toLocaleDateString()} - {education.end_date ? new Date(education.end_date).toLocaleDateString() : 'Present'}
                </p>
                {education.description && (
                  <p className="mt-2 text-gray-600">{education.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditEducation(education)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteEducation(education.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 