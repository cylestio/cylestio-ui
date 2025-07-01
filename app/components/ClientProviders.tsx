'use client';

import { ReactNode, useEffect } from 'react';

import { AuthProvider } from '@descope/nextjs-sdk';
import { getSessionToken } from '@descope/nextjs-sdk/client';

interface Props {
  children: ReactNode;
}

export default function ClientProviders({ children }: Props) {
  // Patch global fetch to automatically include the Descope session token
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
      // Retrieve the JWT (undefined if the user is not authenticated)
      const token = getSessionToken();

      // Work with a Headers object so we can safely append / override
      const headers = new Headers(init.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return originalFetch(input, { ...init, headers });
    };

    // Cleanup on unmount – restore original fetch implementation
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID as string | undefined;

  if (!projectId) {
    console.warn('Descope project ID is not defined – make sure NEXT_PUBLIC_DESCOPE_PROJECT_ID is set');
  }

  return (
    <AuthProvider
      projectId={projectId ?? ''}
      persistTokens
      sessionTokenViaCookie
    >
      {children}
    </AuthProvider>
  );
} 