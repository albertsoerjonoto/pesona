'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'plus';
  const period = searchParams.get('period') || 'monthly';

  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setError(null);

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, period }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Gagal memproses pembayaran');
      }

      const data = await res.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      throw new Error('URL pembayaran tidak ditemukan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses. Coba lagi.');
    }
  }, [tier, period]);

  useEffect(() => {
    startCheckout();
  }, [startCheckout]);

  if (error) {
    return (
      <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-danger-surface rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-danger-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-lg font-bold text-text-primary mb-2">
          Gagal memproses pembayaran
        </h1>
        <p className="text-sm text-text-secondary mb-6 max-w-xs">
          {error}
        </p>

        <button
          onClick={startCheckout}
          className="w-full max-w-xs py-3 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all active:scale-[0.98]"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin mb-5" />
      <p className="text-base font-semibold text-text-primary mb-1">
        Memproses pembayaran...
      </p>
      <p className="text-sm text-text-secondary">
        Kamu akan diarahkan ke halaman pembayaran.
      </p>
    </div>
  );
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80dvh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
