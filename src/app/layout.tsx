import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pesona.io',
  description: 'AI-powered personal beauty & body coach for Indonesia. Skincare routines, progress tracking, and personalized advice.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pesona.io',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFBFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0D12' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${GeistSans.variable} font-sans antialiased bg-bg text-text-primary`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
