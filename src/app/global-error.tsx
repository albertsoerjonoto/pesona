'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{
        margin: 0,
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#FFFBFC',
        color: '#1A1A2E',
      }}>
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1rem',
            background: '#FFF0F3',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}>🥺</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            Ups, ada yang salah!
          </h1>
          <p style={{ marginTop: '0.75rem', color: '#5C5470' }}>
            Terjadi kesalahan yang nggak terduga. Coba lagi atau balik ke beranda ya.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                background: '#CE3D66',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Coba lagi
            </button>
            <a
              href="/dashboard"
              style={{
                background: '#FFF5F7',
                color: '#1A1A2E',
                padding: '0.625rem 1.5rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(206, 61, 102, 0.08)',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Ke beranda
            </a>
          </div>
          <div style={{
            marginTop: '2rem',
            padding: '0.75rem',
            background: '#FFF5F7',
            borderRadius: '0.75rem',
          }}>
            <p style={{ fontSize: '0.625rem', color: '#8E8AA0', lineHeight: 1.5, margin: 0 }}>
              Pesona adalah AI personal coach untuk wellness dan edukasi.
              Pesona bukan dokter, bukan dermatologist, dan tidak menggantikan konsultasi medis.
              Untuk kondisi kulit atau kesehatan yang serius, silakan konsultasi dengan dokter atau dermatologist.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
