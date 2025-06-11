'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import NextLink from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditBlogPostPage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {params.id === 'new' ? 'New Blog Post' : 'Edit Blog Post'}
        </h1>
        <NextLink
          href="/admin/blog"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Back to Blog Posts
        </NextLink>
      </div>
    </div>
  );
} 