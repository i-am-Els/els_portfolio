"use client";

import { motion } from 'framer-motion';
import { aboutContent } from '@/data/about';

const defaultStats = [
  { value: '5+', label: 'Years of Experience' },
  { value: '12', label: 'Shipped Titles' },
  { value: '8', label: 'Game Jam Wins' },
  { value: '3', label: 'Engines Mastered' },
];

export default function About() {
  return (
    <section id="about" className="py-32 bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-16 border-b border-white/10 pb-4">
          <span className="section-label text-[#c8ff00]">02 / About</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: Headline + bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-8">
              Building worlds, pixel by pixel.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              {aboutContent.summary}
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <a href="/about" className="btn-ghost text-xs">Full Bio →</a>
            </div>
          </motion.div>

          {/* Right: Stats grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-2 divide-x divide-y divide-white/10 border border-white/10"
          >
            {defaultStats.map((stat, i) => (
              <div key={i} className="p-8">
                <div className="text-5xl font-black text-[#c8ff00] mb-2">{stat.value}</div>
                <div className="section-label text-white/40">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {aboutContent.skills.map((skill) => (
            <div key={skill.title} className="border-t border-white/10 pt-6">
              <h3 className="text-white font-bold mb-4">{skill.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{skill.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}