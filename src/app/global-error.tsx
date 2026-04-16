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
      <body className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Ups, ada yang salah!
          </h1>
          <p className="mt-3 text-gray-600">
            Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau kembali
            ke beranda.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="rounded-lg bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            >
              Coba lagi
            </button>
            <a
              href="/dashboard"
              className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Ke beranda
            </a>
          </div>
          <p className="mt-8 text-xs text-gray-400">
            Pesona adalah produk wellness &amp; coaching, bukan layanan
            medis/telehealth. Untuk masalah kulit yang serius, silakan
            konsultasi ke dokter kulit.
          </p>
        </div>
      </body>
    </html>
  );
}
