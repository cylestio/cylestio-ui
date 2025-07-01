import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';
import ClientProviders from './components/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cylestio Monitor Dashboard',
  description: 'AI Agent Monitoring and Security Dashboard',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto p-4">
              <div className="w-full max-w-full">
                {children}
              </div>
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
} 