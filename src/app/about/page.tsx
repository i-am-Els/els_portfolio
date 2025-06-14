'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import ContactFooter from '@/components/ContactFooter';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

export default function AboutPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProfile();
    fetchExperiences();
    fetchSkills();
    fetchEducation();
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

  const fetchEducation = async () => {
    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setEducation(data || []);
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
    <main className="min-h-screen relative">
      <Image
        src="/contact-page-bg.jpg"
        alt="Contact Page Background"
        fill
        className="object-cover -z-10"
        priority
      />
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Who Am I</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {profile?.short_bio}
            </p>
          </div>

          {/* About Section */}
          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-6">Who I Am</h2>
                <div className="prose prose-lg">
                  {profile?.bio?.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-600 mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="relative h-[400px] rounded-xl overflow-hidden"
              >
                <Image
                  src={profile?.image_url || '/profile.jpg'}
                  alt="Eniola Olawale"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">Experience</h2>
            <div className="space-y-8">
              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{exp.title}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                    </div>
                    <span className="text-sm text-gray-500">{exp.period}</span>
                  </div>
                  <p className="text-gray-600 mb-4">{exp.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {exp.skills.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Skills Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">Skills</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {skills.map((skillGroup, index) => (
                <motion.div
                  key={skillGroup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <h3 className="text-xl font-semibold mb-4">{skillGroup.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.items.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Education Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">Education</h2>
            <div className="space-y-8">
              {education.map((edu) => (
                <motion.div
                  key={edu.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-6 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{edu.institution}</h3>
                      <p className="text-gray-600 mb-2">{edu.degree} in {edu.field_of_study}</p>
                      <p className="text-gray-500 text-sm mb-4">
                        {new Date(edu.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {edu.end_date ? new Date(edu.end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Present'}
                      </p>
                      {edu.description && (
                        <p className="text-gray-600">{edu.description}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <ContactFooter />
    </main>
  );
} 