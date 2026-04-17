'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'Plus';
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
      {/* Checkmark icon */}
      <div className="w-20 h-20 bg-positive/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-positive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Selamat! 🎉
      </h1>
      <p className="text-lg font-semibold text-text-primary mb-1">
        Kamu sekarang Pesona {tierLabel}
      </p>
      <p className="text-sm text-text-secondary max-w-xs mb-8">
        Semua fitur premium udah aktif. Yuk lanjut skincare journey kamu!
      </p>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full max-w-xs py-3 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all active:scale-[0.98]"
      >
        Ke Dashboard
      </button>

      {/* Disclaimer */}
      <p className="text-[10px] text-text-tertiary text-center mt-8 max-w-xs leading-relaxed">
        Pesona adalah produk wellness & edukasi kecantikan, bukan layanan medis.
        Untuk masalah kulit serius, konsultasikan ke dokter kulit.
      </p>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80dvh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
