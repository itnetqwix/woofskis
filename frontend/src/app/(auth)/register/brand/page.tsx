'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Brand registration is not part of a single-organization deployment. */
export default function RegisterBrandPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
