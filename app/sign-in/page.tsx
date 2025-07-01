'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@descope/nextjs-sdk/client';

// Dynamically import Descope component (client only)
const Descope = dynamic<any>(() => import('@descope/nextjs-sdk').then(mod => mod.Descope as any), { ssr: false }) as any;

export default function SignInPage() {
  const { isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-4/5 max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <Descope
          flowId="sign-up-or-in-magic-link-or-social"
          theme="light"
          onSuccess={() => router.replace('/')}
          onError={(e: any) => console.error('Login error', e)}
        />
      </div>
    </div>
  );
} 