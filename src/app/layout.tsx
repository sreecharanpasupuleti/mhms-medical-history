import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProviderWrapper } from '@/components/providers/SessionProviderWrapper';

const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const sansFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'MHMS — Medical History Management System',
  description:
    'Role-based clinical records, appointments, allergies, prescriptions, and lab diagnostics management platform.',
  openGraph: {
    title: 'MHMS — Medical History Management System',
    description:
      'Role-based clinical records, appointments, allergies, prescriptions, and lab diagnostics management platform.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
