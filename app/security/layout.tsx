import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Explorer | Cylestio',
  description: 'Monitor and investigate security-related issues across your LLM applications'
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 