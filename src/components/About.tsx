"use client";

import { motion } from 'framer-motion';
import { CodeBracketIcon, PaintBrushIcon, CubeIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const skills = [
  {
    icon: CodeBracketIcon,
    title: 'Game Development',
    description: 'Unreal Engine expertise with focus on gameplay systems and optimization'
  },
  {
    icon: PaintBrushIcon,
    title: 'Technical Art',
    description: 'Shader development, procedural generation, and art pipeline optimization'
  },
  {
    icon: CubeIcon,
    title: '3D Modeling',
    description: 'Blender workflow mastery for game-ready assets and environments'
  },
  {
    icon: CommandLineIcon,
    title: 'Tool Development',
    description: 'Custom C++ tools and scripts to streamline development pipelines'
  }
];

export default function About() {
  return (
    <section id="about" className="py-24 relative w-full">

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 tracking-tight">
            About Me
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium">
          I am a game developer and technical artist, passionate about the intersection of code and creativity. 
            My work spans Unreal Engine, C++ tools, Blender, and digital art, always seeking to blend technical 
            precision with artistic vision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <skill.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">{skill.title}</h3>
              <p className="text-foreground/70">{skill.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 