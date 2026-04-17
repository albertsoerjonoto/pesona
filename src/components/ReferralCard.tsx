'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

/**
 * Referral card — fetches the user's referral code lazily on mount,
 * shows the share-able URL, and offers copy/share actions.
 * Surfaced on the profile page.
 */
export default function ReferralCard() {
  const [code, setCode] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/referral', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch referral');
        const data = await res.json();
        if (cancelled) return;
        setCode(data.referral_code || null);
        setUrl(data.referral_url || null);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('success', 'Link disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('error', 'Gagal menyalin');
    }
  };

  const handleShare = async () => {
    if (!url) return;
    const shareText = `Pakai Pesona yuk — AI beauty coach yang ngerti kulit kamu. Aku recommend banget! ✨\n\n${url}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Pesona — AI Beauty Coach',
          text: shareText,
          url,
        });
      } catch {
        // User canceled — fall through silently
      }
    } else {
      // Fallback: copy + toast
      await handleCopy();
    }
  };

  if (error) {
    return null; // Fail silently — referral is not critical to profile UX
  }

  return (
    <>
      {ToastContainer}
      <div className="bg-surface rounded-2xl overflow-hidden border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent-surface rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg">🎁</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-text-primary">Ajak teman</h3>
            <p className="text-xs text-text-tertiary">
              Share Pesona ke temen — biar sama-sama glowing!
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-10 bg-bg rounded-lg animate-pulse" />
        ) : code && url ? (
          <>
            <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2 mb-3">
              <span className="text-xs text-text-tertiary shrink-0">Kode kamu:</span>
              <code className="text-sm font-mono font-semibold text-text-primary truncate">
                {code}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 text-sm font-medium bg-accent-surface text-accent-text rounded-lg hover:bg-accent-surface/70 transition-all active:scale-[0.98]"
                disabled={copied}
              >
                {copied ? '✓ Tersalin' : 'Salin link'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 text-sm font-medium bg-accent text-accent-fg rounded-lg hover:bg-accent-hover transition-all active:scale-[0.98]"
              >
                Share
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs text-text-tertiary">Kode referral belum tersedia.</p>
        )}
      </div>
    </>
  );
}
