'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent-surface rounded-full flex items-center justify-center">
          <span className="text-3xl">🥺</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Ups, ada yang salah!
        </h1>
        <p className="mt-3 text-text-secondary">
          Terjadi kesalahan yang nggak terduga. Coba lagi atau balik ke beranda ya.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg shadow-sm hover:bg-accent-hover active:scale-[0.98] transition-all"
          >
            Coba lagi
          </button>
          <a
            href="/dashboard"
            className="rounded-xl bg-surface px-6 py-2.5 text-sm font-semibold text-text-primary border border-border hover:bg-surface-hover transition-all"
          >
            Ke beranda
          </a>
        </div>
        <div className="mt-8 p-3 bg-surface rounded-xl">
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            Pesona adalah AI personal coach untuk wellness dan edukasi.
            Pesona bukan dokter, bukan dermatologist, dan tidak menggantikan konsultasi medis.
            Untuk kondisi kulit atau kesehatan yang serius, silakan konsultasi dengan dokter atau dermatologist.
          </p>
        </div>
      </div>
    </div>
  );
}
