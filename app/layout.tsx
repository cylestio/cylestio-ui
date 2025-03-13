import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cylestio Monitor - Minimal Dashboard',
  description: 'A minimal dashboard for monitoring AI agents and events',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-semibold text-gray-900">Cylestio Monitor</h1>
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
} 