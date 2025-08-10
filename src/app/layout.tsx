import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Web App for children stats',
  description: 'Web App for managing children data an visualisation of their stats',
  icons: {
    icon: '/logo-webapp-fix.png',
    other: [
      {
        rel: 'icon',
        url: '/logo-webapp-fix.png',
        sizes: '32x32',
      },
      {
        rel: 'icon',
        url: '/logo-webapp-fix.png',
        sizes: '16x16',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
