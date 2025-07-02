'use client';

import { ReactNode, useEffect } from 'react';

import { AuthProvider } from '@descope/nextjs-sdk';
import { getSessionToken } from '@descope/nextjs-sdk/client';

interface Props {
  children: ReactNode;
}

export default function ClientProviders({ children }: Props) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID as string | undefined;

  if (!projectId) {
    console.warn('Descope project ID is not defined – make sure NEXT_PUBLIC_DESCOPE_PROJECT_ID is set');
  }

  return (
    <AuthProvider
      projectId={projectId ?? ''}
      persistTokens
    >
      {children}
    </AuthProvider>
  );
} 