'use client';

import { useRouter } from 'next/navigation';

export default function SubscriptionFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
      {/* X icon */}
      <div className="w-20 h-20 bg-danger-surface rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-danger-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Pembayaran belum berhasil
      </h1>
      <p className="text-sm text-text-secondary max-w-xs mb-8">
        Nggak apa-apa, kamu bisa coba lagi kapan aja. Pastikan saldo atau limit
        kartu kamu mencukupi.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => router.push('/profile')}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all active:scale-[0.98]"
        >
          Coba Lagi
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-surface hover:bg-surface-hover text-text-secondary font-medium rounded-xl border border-border transition-all active:scale-[0.98]"
        >
          Ke Dashboard
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-text-tertiary text-center mt-8 max-w-xs leading-relaxed">
        Pesona adalah produk wellness & edukasi kecantikan, bukan layanan medis.
        Untuk masalah kulit serius, konsultasikan ke dokter kulit.
      </p>
    </div>
  );
}
