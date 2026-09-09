import type { Metadata } from 'next';
import './globals.css';
import { RoleProvider } from '@/lib/context/RoleContext';

export const metadata: Metadata = {
  title: 'ORCA — Marine Ecosystem Reasoning with Collaborative Agents',
  description:
    'AI-powered marine intelligence and decision-support platform for fishermen, maritime operators, and coastal authorities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white font-sans">
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
