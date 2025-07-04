'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/projects/new/edit');
  }, [router]);

  return null;
} 