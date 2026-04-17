'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TIER_CONFIG, formatPriceIDR } from '@/lib/payments/tiers';
import { trackEvent } from '@/lib/analytics/posthog-client';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  trigger: 'chat_limit' | 'weekly_report' | 'feature_gate' | 'photo_limit';
}

const PLUS = TIER_CONFIG.plus;
const PRO = TIER_CONFIG.pro;

const PLUS_FEATURES = [
  'Unlimited chat AI coach',
  '3 foto analisis/hari',
  'Laporan mingguan lengkap',
];

const PRO_FEATURES = [
  'Semua fitur Plus +',
  'Analisis kulit advanced',
  'Prioritas respons',
  'Beauty lengkap (rambut, makeup, tubuh)',
];

export default function PaywallModal({ open, onClose, trigger }: PaywallModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (open) {
      trackEvent('paywall_shown', { trigger });
    }
  }, [open, trigger]);

  if (!open) return null;

  const handleDismiss = () => {
    trackEvent('paywall_dismissed', { dismissed_at_tier: 'free' });
    onClose();
  };

  const handleSelect = (tier: 'plus' | 'pro') => {
    router.push(`/subscription/checkout?tier=${tier}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Bottom sheet */}
      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl p-6 pb-8 safe-area-bottom animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center mb-4 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Tutup"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-text-primary mb-1">
          Upgrade Pesona kamu
        </h2>
        <p className="text-sm text-text-secondary mb-5">
          Buka semua fitur buat skincare journey yang lebih maksimal.
        </p>

        {/* Tier cards */}
        <div className="space-y-3">
          {/* Plus card */}
          <div className="border border-border rounded-2xl p-4 bg-bg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{PLUS.nameBahasa}</h3>
                <p className="text-sm text-accent font-bold">
                  {formatPriceIDR(PLUS.price_idr)}<span className="text-xs text-text-tertiary font-normal">/bln</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-accent-surface rounded-xl flex items-center justify-center">
                <span className="text-lg">✨</span>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                  <svg className="w-4 h-4 text-positive mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelect('plus')}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              Pilih Plus
            </button>
          </div>

          {/* Pro card */}
          <div className="border-2 border-accent rounded-2xl p-4 bg-bg relative">
            <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-accent text-accent-fg text-xs font-semibold rounded-full">
              Paling Populer
            </div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{PRO.nameBahasa}</h3>
                <p className="text-sm text-accent font-bold">
                  {formatPriceIDR(PRO.price_idr)}<span className="text-xs text-text-tertiary font-normal">/bln</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-accent-surface rounded-xl flex items-center justify-center">
                <span className="text-lg">💎</span>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                  <svg className="w-4 h-4 text-positive mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelect('pro')}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              Pilih Pro
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-text-tertiary text-center mt-4 leading-relaxed">
          Pesona adalah produk wellness & edukasi kecantikan, bukan layanan medis.
          Untuk masalah kulit serius, konsultasikan ke dokter kulit.
        </p>
      </div>
    </div>
  );
}
