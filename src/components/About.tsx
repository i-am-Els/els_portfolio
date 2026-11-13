"use client";

import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, lineGrow } from '@/lib/motion';
import { aboutContent } from '@/data/about';

// The stats grid ("3+ Years of Experience", "4+ Mastered DCC Tools", …) was
// removed: the published projects did not back those numbers up. Bring a stats
// block back only with facts the portfolio can prove (named tools, named
// shipped projects).

export default function About() {
  return (
    <section id="about" className="py-32 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-16 pb-4 relative">
          <span className="section-label text-[#c8ff00]"> About</span>
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
            variants={lineGrow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          />
        </div>

        <div className="max-w-3xl">
          {/* Headline + bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display leading-[0.9] tracking-tight text-white mb-8"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900 }}
            >
              Building worlds, pixel by pixel.
            </motion.h2>
            <p className="text-white/40 text-sm leading-relaxed">
              {aboutContent.summary}
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <a href="/about" className="btn-ghost text-xs">Full Bio →</a>
            </div>
          </motion.div>
        </div>

        {/* Skills */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {aboutContent.skills.map((skill) => (
            <motion.div key={skill.title} variants={fadeUp} className="border-t border-white/10 pt-6">
              <h3 className="text-white font-bold mb-4">{skill.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{skill.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}