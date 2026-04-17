import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pesona — AI Beauty Coach Kamu',
    template: '%s | Pesona',
  },
  description: 'AI personal beauty coach kamu dalam bahasa kamu. Skincare routine, progress tracking, dan rekomendasi produk Indonesia.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://pesona.io'),
  openGraph: {
    title: 'Pesona — AI Beauty Coach Kamu',
    description: 'AI personal beauty coach kamu dalam bahasa kamu. Skincare routine, progress tracking, dan rekomendasi produk Indonesia.',
    url: 'https://pesona.io',
    siteName: 'Pesona',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pesona — AI Beauty Coach Kamu',
    description: 'AI personal beauty coach kamu dalam bahasa kamu.',
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pesona',
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
