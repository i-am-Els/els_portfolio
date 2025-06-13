'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Profile {
  id: string;
  bio: string;
  short_bio: string;
  profile_image_url: string;
  email: string;
  phone: string;
  location: string;
  github_url: string;
  artstation_url: string;
  linkedin_url: string;
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

export default function ProfileAdmin() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProfile();
    fetchExperiences();
    fetchSkills();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
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
      setExperiences(data || []);
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
      setSkills(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profile')
        .update(profile)
        .eq('id', profile.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateExperience = async (experience: Experience) => {
    try {
      const { error } = await supabase
        .from('experiences')
        .update(experience)
        .eq('id', experience.id);

      if (error) throw error;
      alert('Experience updated successfully!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateSkill = async (skill: Skill) => {
    try {
      const { error } = await supabase
        .from('skills')
        .update(skill)
        .eq('id', skill.id);

      if (error) throw error;
      alert('Skill updated successfully!');
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f3f0]">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Profile Management</h1>

        {/* Profile Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
          {profile && (
            <form onSubmit={updateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Bio
                </label>
                <textarea
                  value={profile.short_bio}
                  onChange={(e) => setProfile({ ...profile, short_bio: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="text"
                    value={profile.profile_image_url}
                    onChange={(e) => setProfile({ ...profile, profile_image_url: e.target.value })}
                    className="w-full p-2 border rounded-md"
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
                    value={profile.github_url}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ArtStation URL
                  </label>
                  <input
                    type="url"
                    value={profile.artstation_url}
                    onChange={(e) => setProfile({ ...profile, artstation_url: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={profile.linkedin_url}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Update Profile
              </button>
            </form>
          )}
        </section>

        {/* Experiences Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Experiences</h2>
          <div className="space-y-6">
            {experiences.map((experience) => (
              <div key={experience.id} className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={experience.title}
                      onChange={(e) => {
                        const updated = { ...experience, title: e.target.value };
                        setExperiences(experiences.map(exp => 
                          exp.id === experience.id ? updated : exp
                        ));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={experience.company}
                      onChange={(e) => {
                        const updated = { ...experience, company: e.target.value };
                        setExperiences(experiences.map(exp => 
                          exp.id === experience.id ? updated : exp
                        ));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period
                    </label>
                    <input
                      type="text"
                      value={experience.period}
                      onChange={(e) => {
                        const updated = { ...experience, period: e.target.value };
                        setExperiences(experiences.map(exp => 
                          exp.id === experience.id ? updated : exp
                        ));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={experience.order_index}
                      onChange={(e) => {
                        const updated = { ...experience, order_index: parseInt(e.target.value) };
                        setExperiences(experiences.map(exp => 
                          exp.id === experience.id ? updated : exp
                        ));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={experience.description}
                    onChange={(e) => {
                      const updated = { ...experience, description: e.target.value };
                      setExperiences(experiences.map(exp => 
                        exp.id === experience.id ? updated : exp
                      ));
                    }}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={experience.skills.join(', ')}
                    onChange={(e) => {
                      const updated = { 
                        ...experience, 
                        skills: e.target.value.split(',').map(s => s.trim())
                      };
                      setExperiences(experiences.map(exp => 
                        exp.id === experience.id ? updated : exp
                      ));
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => updateExperience(experience)}
                  className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Update Experience
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Skills Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Skills</h2>
          <div className="space-y-6">
            {skills.map((skill) => (
              <div key={skill.id} className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={skill.category}
                      onChange={(e) => {
                        const updated = { ...skill, category: e.target.value };
                        setSkills(skills.map(s => 
                          s.id === skill.id ? updated : s
                        ));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={skill.order_index}
                      onChange={(e) => {
                        const updated = { ...skill, order_index: parseInt(e.target.value) };
                        setSkills(skills.map(s => 
                          s.id === skill.id ? updated : s
                        ));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={skill.items.join(', ')}
                    onChange={(e) => {
                      const updated = { 
                        ...skill, 
                        items: e.target.value.split(',').map(s => s.trim())
                      };
                      setSkills(skills.map(s => 
                        s.id === skill.id ? updated : s
                      ));
                    }}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <button
                  onClick={() => updateSkill(skill)}
                  className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Update Skill
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
} 