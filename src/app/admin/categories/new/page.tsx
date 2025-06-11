'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCategoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/categories/new/edit');
  }, [router]);

  return null;
} 