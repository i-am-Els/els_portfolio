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
    Promise.all([fetchProfile(), fetchExperiences(), fetchSkills(), fetchEducation()]);
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profile').select('*').single();
      if (error) throw error;
      setProfile(data);
    } catch (error: any) { setError(error.message); }
  };

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase.from('experiences').select('*').order('order_index', { ascending: true });
      if (error) throw error;
      setExperiences(data || []);
    } catch (error: any) { setError(error.message); }
  };

  const fetchSkills = async () => {
    try {
      const { data, error } = await supabase.from('skills').select('*').order('order_index', { ascending: true });
      if (error) throw error;
      setSkills(data || []);
    } catch (error: any) { setError(error.message); }
    finally { setIsLoading(false); }
  };

  const fetchEducation = async () => {
    try {
      const { data, error } = await supabase.from('education').select('*').order('order_index', { ascending: true });
      if (error) throw error;
      setEducation(data || []);
    } catch (error: any) { setError(error.message); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <p className="text-white/40 text-sm">Error: {error}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24 space-y-24">

        {/* 02 / About */}
        <section>
          <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-16">
            <span className="section-label text-[#c8ff00]">02 / About</span>
          </div>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-5xl font-black text-white leading-tight mb-8">Building worlds, pixel by pixel.</h1>
              <div className="space-y-4 text-white/40 text-sm leading-relaxed">
                {profile?.bio?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative overflow-hidden" style={{ height: '420px' }}>
              <Image src={profile?.image_url || '/profile.jpg'} alt="Eniola Olawale" fill className="object-cover" />
            </motion.div>
          </div>
        </section>

        {/* Experience */}
        {experiences.length > 0 && (
          <section>
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-12">
              <span className="section-label text-[#c8ff00]">Experience</span>
            </div>
            <div className="space-y-px bg-white/5">
              {experiences.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                  className="bg-[#0d0d0d] p-8"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-white">{exp.title}</h3>
                      <p className="text-[#c8ff00] text-sm font-semibold">{exp.company}</p>
                    </div>
                    <span className="section-label text-white/30 shrink-0">{exp.period}</span>
                  </div>
                  <p className="text-white/40 text-sm leading-relaxed mb-5">{exp.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {exp.skills.map((skill, i) => <span key={i} className="tag-pill">{skill}</span>)}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Skills — 03 / Skills & Tools style */}
        {skills.length > 0 && (
          <section>
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-12">
              <span className="section-label text-[#c8ff00]">03 / Skills & Tools</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
              {skills.map((skillGroup, index) => (
                <motion.div
                  key={skillGroup.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                >
                  <h3 className="text-white font-black mb-6">{skillGroup.category}</h3>
                  <div className="space-y-4">
                    {skillGroup.items.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="section-label text-[#c8ff00]">{item}</span>
                        </div>
                        <div className="skill-bar">
                          <div className="skill-bar-fill" style={{ width: `${70 + Math.random() * 25}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-12">
              <span className="section-label text-[#c8ff00]">Education</span>
            </div>
            <div className="space-y-px bg-white/5">
              {education.map((edu) => (
                <div key={edu.id} className="bg-[#0d0d0d] p-8">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-lg font-black text-white">{edu.institution}</h3>
                      <p className="text-white/50 text-sm">{edu.degree} in {edu.field_of_study}</p>
                    </div>
                    <span className="section-label text-white/30 shrink-0">
                      {new Date(edu.start_date).getFullYear()} – {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}
                    </span>
                  </div>
                  {edu.description && <p className="text-white/40 text-sm leading-relaxed mt-4">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ContactFooter />
    </main>
  );
}
