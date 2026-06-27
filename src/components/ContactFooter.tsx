'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clipReveal, staggerContainer, fadeUp, fadeIn } from '@/lib/motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface Profile {
  id: string;
  email: string;
  phone: string;
  location: string;
  github_url: string;
  artstation_url: string;
  linkedin_url: string;
  twitter_url?: string;
}

export default function ContactFooter() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profile').select('*').single();
        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to send message');
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const socialLinks = [
    { url: profile?.github_url, label: 'GitHub', icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    )},
    { url: profile?.artstation_url, label: 'ArtStation', icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 0 0-2.164-1.333H6.369l14.34 24.728 2.836-4.906A2.41 2.41 0 0 0 24 17.748zm-11.209-6.251l-3.019-5.224-7.315 12.648h6.038l4.296-7.424z"/>
      </svg>
    )},
    { url: profile?.linkedin_url, label: 'LinkedIn', icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    )},
    { url: profile?.twitter_url, label: 'Twitter', icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )},
  ].filter(s => s.url);

  return (
    <footer id="contact" className="bg-[#0d0d0d] border-t border-white/5">
      {/* Contact section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-16">
          <span className="section-label text-[#c8ff00]"> Contact</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-hidden mb-6">
              <motion.h2
                variants={clipReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-display leading-[0.9] tracking-tight text-white"
                style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', fontWeight: 900 }}
              >
                Let's build something great.
              </motion.h2>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm">
              Open to full-time roles, contract work, and collaborative projects in the games industry. I respond to all serious inquiries within 48 hours.
            </p>

            <div className="space-y-3 mb-8">
              {profile?.email && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#c8ff00] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${profile.email}`} className="text-white/50 text-sm hover:text-white transition-colors">{profile.email}</a>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#c8ff00] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-white/50 text-sm">{profile.location} — Remote Worldwide</span>
                </div>
              )}
            </div>

            {/* Social icons */}
            <motion.div
              className="flex gap-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {socialLinks.map(s => (
                <motion.a
                  key={s.label}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeIn}
                  className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/50 hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors"
                  aria-label={s.label}
                >
                  {s.icon}
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              <motion.div variants={fadeUp}>
                <label className="section-label text-white/30 block mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full bg-[#141414] border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c8ff00] transition-colors"
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <label className="section-label text-white/30 block mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-[#141414] border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c8ff00] transition-colors"
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <label className="section-label text-white/30 block mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Tell me about the project or role..."
                  className="w-full bg-[#141414] border border-white/10 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c8ff00] transition-colors resize-none"
                />
              </motion.div>

              {status === 'error' && <p className="text-red-400 text-xs">{errorMessage}</p>}
              {status === 'success' && <p className="text-[#c8ff00] text-xs">Message sent successfully!</p>}

              <motion.div variants={fadeUp}>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className={`w-full btn-acid flex items-center justify-center gap-3 text-xs ${status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {status === 'loading' ? 'Sending...' : 'Send Message'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="border-t border-white/5 max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <span className="text-white font-black text-xs tracking-widest">ENIOLA.O</span>
        <span className="section-label text-white/20">© {new Date().getFullYear()} — Game Developer & Artist</span>
        <div className="flex gap-6">
          {socialLinks.map(s => (
            <a key={s.label} href={s.url!} target="_blank" rel="noopener noreferrer" className="section-label text-white/30 hover:text-white transition-colors">{s.label.toUpperCase()}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}