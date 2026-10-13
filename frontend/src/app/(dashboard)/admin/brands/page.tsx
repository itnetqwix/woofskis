'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RemovedBrandsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/contests');
  }, [router]);
  return null;
}
