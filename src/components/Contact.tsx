"use client";

import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const socialLinks = [
  {
    name: 'GitHub',
    url: 'https://github.com/i-am-Els',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    brandColor: '#333333',
  },
  {
    name: 'ArtStation',
    url: 'https://www.artstation.com/eniola-els',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 0 0-2.142-1.289H9.419L21.598 22.54l1.92-3.325c.378-.637.482-.919.482-1.467zm-11.129-3.462L7.428 4.858l-5.444 9.428h10.887z"/>
      </svg>
    ),
    brandColor: '#13AFF0',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/eniola-olawale-669019192/',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    ),
    brandColor: '#0077B5',
  },
  {
    name: 'Twitter',
    url: 'https://x.com/OlawaleEniolaE',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    brandColor: '#000000',
  },
];

export default function Contact() {
  return (
    <footer className="bg-[#121212] w-full border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2"
          >
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Have a project in mind? Let's discuss how we can work together to bring your ideas to life.
            </p>
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-base font-medium text-gray-200">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="input w-full bg-white/5 border-white/10 text-white placeholder-gray-400 h-12"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-base font-medium text-gray-200">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input w-full bg-white/5 border-white/10 text-white placeholder-gray-400 h-12"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="block text-base font-medium text-gray-200">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="input w-full bg-white/5 border-white/10 text-white placeholder-gray-400"
                  placeholder="Tell me about your project..."
                />
              </div>
              <motion.button
                type="submit"
                className="btn-primary w-full md:w-auto px-8 py-4 text-base font-semibold 
                  bg-gradient-to-r from-primary to-primary/90 
                  text-white shadow-lg shadow-primary/30 
                  hover:shadow-xl hover:shadow-primary/40 
                  hover:from-primary/90 hover:to-primary 
                  active:from-primary active:to-primary/90
                  transition-all duration-300
                  border border-primary/20
                  hover:border-primary/30
                  relative overflow-hidden
                  before:absolute before:inset-0 
                  before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0
                  before:translate-x-[-200%] hover:before:translate-x-[200%]
                  before:transition-transform before:duration-1000"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Send Message
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </span>
              </motion.button>
            </form>
          </motion.div>

          {/* Social Links & Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-white">Connect with me</h3>
              <div className="space-y-4">
                {socialLinks.map((link) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-gray-300 hover:text-white transition-all duration-200 group p-2 rounded-lg hover:bg-white/5"
                    whileHover={{ x: 5 }}
                  >
                    <span className={`p-3 rounded-lg transition-all duration-200 ${
                      link.name === 'GitHub' 
                        ? 'bg-[#24292e] group-hover:bg-[#24292e]' 
                        : link.name === 'ArtStation' 
                        ? 'bg-[#13AFF0] group-hover:bg-[#13AFF0]' 
                        : 'bg-[#0077B5] group-hover:bg-[#0077B5]'
                    }`}>
                      {link.icon}
                    </span>
                    <span className="text-lg group-hover:text-white">{link.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-6 text-white">Email</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:eniolaolawale317@gmail.com" className="text-gray-300 hover:text-primary transition-colors">
                    eniolaolawale317@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+2349031141656" className="text-gray-300 hover:text-primary transition-colors">
                    +234 903 114 1656
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-300">Ibadan, Nigeria</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10">
              <p className="text-gray-400 text-base">
                © {new Date().getFullYear()} Eniola Olawale. All rights reserved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
} 