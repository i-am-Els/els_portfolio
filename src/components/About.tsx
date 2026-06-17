"use client";

import { motion } from 'framer-motion';
import { clipReveal, fadeUp, staggerContainer, lineGrow } from '@/lib/motion';
import { aboutContent } from '@/data/about';

const defaultStats = [
  { value: '3+', label: 'Years of Experience' },
  { value: '4+', label: 'Mastered DCC Tools' },
  { value: '3+', label: 'Industrial Standard Projects' },
  { value: '3', label: 'Engines Mastered' },
];

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

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: Headline + bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="overflow-hidden mb-8">
              <motion.h2
                variants={clipReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-5xl md:text-6xl font-black text-white leading-tight"
              >
                Building worlds, pixel by pixel.
              </motion.h2>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              {aboutContent.summary}
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <a href="/about" className="btn-ghost text-xs">Full Bio →</a>
            </div>
          </motion.div>

          {/* Right: Stats grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 divide-x divide-y divide-white/10 border border-white/10"
          >
            {defaultStats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="p-8">
                <div className="text-5xl font-black text-[#c8ff00] mb-2">{stat.value}</div>
                <div className="section-label text-white/40">{stat.label}</div>
              </motion.div>
            ))}
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