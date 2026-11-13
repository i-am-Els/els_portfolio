'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import type { Education, Experience, Profile, SkillGroup } from '@/lib/content';

interface AboutProfileProps {
  profile: Profile | null;
  experiences: Experience[];
  skills: SkillGroup[];
  education: Education[];
}

/**
 * Decorative bar width for a skill, 70–94%.
 *
 * Derived from the skill name rather than Math.random() so the server render
 * and the browser render agree (a random value differs between the two and
 * breaks hydration), and the bars stop changing on every visit.
 */
function skillBarWidth(item: string): number {
  let hash = 0;
  for (const ch of item) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return 70 + (hash % 25);
}

/** Body of /about. Data is fetched by the page on the server. */
export default function AboutProfile({ profile, experiences, skills, education }: AboutProfileProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-28 pb-24 space-y-24">

      {/* About */}
      <section>
        <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-16">
          <span className="section-label text-[#c8ff00]"> About</span>
        </div>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl font-black text-white leading-tight mb-8">Building worlds, pixel by pixel.</h1>
            <div className="space-y-4 text-white/40 text-sm leading-relaxed">
              {profile?.bio?.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative overflow-hidden" style={{ height: '420px' }}>
            <Image src={resolveMediaUrl(profile?.image_url) || '/profile.jpg'} alt="Eniola Olawale" fill className="object-cover" />
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

      {/* Skills — Skills & Tools style */}
      {skills.length > 0 && (
        <section>
          <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-12">
            <span className="section-label text-[#c8ff00]"> Skills & Tools</span>
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
                        <div className="skill-bar-fill" style={{ width: `${skillBarWidth(item)}%` }} />
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
                    {new Date(edu.start_date).getUTCFullYear()} – {edu.end_date ? new Date(edu.end_date).getUTCFullYear() : 'Present'}
                  </span>
                </div>
                {edu.description && <p className="text-white/40 text-sm leading-relaxed mt-4">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
