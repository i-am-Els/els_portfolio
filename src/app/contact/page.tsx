'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import ContactFooter from '@/components/ContactFooter';

const experiences = [
  {
    title: 'Technical Artist',
    company: 'Game Studio X',
    period: '2022 - Present',
    description: 'Developing shaders and tools for game development, optimizing art pipelines, and creating technical documentation.',
    skills: ['Unreal Engine', 'HLSL', 'Python', 'Blender', 'Substance Designer']
  },
  {
    title: 'Game Developer',
    company: 'Indie Game Studio',
    period: '2020 - 2022',
    description: 'Worked on game mechanics, UI implementation, and performance optimization for mobile games.',
    skills: ['Unity', 'C#', 'Game Design', 'UI/UX', 'Performance Optimization']
  },
  // Add more experiences as needed
];

const skills = [
  {
    category: 'Game Development',
    items: ['Unreal Engine', 'Unity', 'C++', 'C#', 'Blueprints', 'Game Design']
  },
  {
    category: 'Technical Art',
    items: ['HLSL', 'Shader Development', 'Material Creation', 'Performance Optimization', 'Pipeline Development']
  },
  {
    category: '3D & Art',
    items: ['Blender', 'Substance Designer', 'Texturing', 'Modeling', 'Animation']
  },
  {
    category: 'Tools & Scripting',
    items: ['Python', 'MEL Script', 'MaxScript', 'Tool Development', 'Automation']
  }
];

export default function ContactPage() {
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
              Game Developer & Technical Artist passionate about creating immersive experiences
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
                <p className="text-gray-600 mb-4">
                  I'm a passionate game developer and technical artist with a strong focus on creating
                  immersive gaming experiences. My expertise lies in bridging the gap between art and
                  technology, ensuring both visual quality and technical performance.
                </p>
                <p className="text-gray-600 mb-4">
                  With a background in both game development and technical art, I bring a unique
                  perspective to projects, combining creative vision with technical expertise.
                </p>
                <p className="text-gray-600">
                  I'm constantly learning and exploring new technologies to push the boundaries
                  of what's possible in game development.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="relative h-[400px] rounded-xl overflow-hidden"
              >
                <Image
                  src="/profile.jpg"
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
                  key={index}
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
                  key={index}
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
        </div>
      </div>

      <ContactFooter />
    </main>
  );
} 