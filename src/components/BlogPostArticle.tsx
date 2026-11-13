'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { resolveHtmlImages, resolveMediaUrl } from '@/utils/mediaUrl';
import { formatDate } from '@/utils/formatDate';
import type { BlogPost } from '@/lib/content';

/** Body of /blog/[slug]. Data is fetched by the page on the server. */
export default function BlogPostArticle({ post }: { post: BlogPost }) {
  const getImageUrl = (path: string) => resolveMediaUrl(path);

  return (
    <>
      {/* Hero image */}
      {post.image_url && (
        <div className="relative w-full" style={{ height: '55vh', minHeight: '340px' }}>
          <Image
            src={getImageUrl(post.image_url)}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/30 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="mb-12">
          <Link href="/blog" className="section-label text-white/30 hover:text-[#c8ff00] transition-colors inline-flex items-center gap-2">
            ← Back to Blog
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 border-b border-white/10 pb-12"
        >
          {/* Category */}
          <div className="flex flex-wrap gap-2 mb-5">
            {post.blog_post_categories?.map(({ categories }) => (
              categories && (
                <span key={categories.id} className="section-label text-[#c8ff00]">
                  {categories.name}
                </span>
              )
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-4">
            <span className="section-label text-white/30">
              {formatDate(post.created_at, 'long')}
            </span>
            <span className="text-white/20">—</span>
            <span className="section-label text-white/30">{post.read_time} min read</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div
            className="prose prose-invert max-w-none
              text-white/60 leading-relaxed
              [&_h2]:text-white [&_h2]:font-black [&_h2]:text-3xl [&_h2]:mt-12 [&_h2]:mb-4
              [&_h3]:text-white [&_h3]:font-bold [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-6 [&_p]:text-white/60
              [&_strong]:text-white/80
              [&_a]:text-[#c8ff00] [&_a]:no-underline [&_a:hover]:underline
              [&_blockquote]:border-l-2 [&_blockquote]:border-[#c8ff00] [&_blockquote]:pl-6 [&_blockquote]:text-white/40 [&_blockquote]:italic
              [&_code]:bg-[#141414] [&_code]:text-[#c8ff00] [&_code]:px-2 [&_code]:py-0.5 [&_code]:text-xs
              [&_pre]:bg-[#141414] [&_pre]:border [&_pre]:border-white/10 [&_pre]:p-6
              [&_ul]:text-white/60 [&_ol]:text-white/60 [&_li]:mb-2
              [&_img]:w-full [&_img]:my-8"
            dangerouslySetInnerHTML={{ __html: resolveHtmlImages(post.content) }}
          />
        </motion.div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 pt-8 border-t border-white/10"
          >
            <span className="section-label text-white/30 block mb-4">Tags</span>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}