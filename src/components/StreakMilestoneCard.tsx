'use client';

import { useRef, useState } from 'react';
import { MILESTONE_MESSAGES } from '@/lib/celebration';

interface StreakMilestoneCardProps {
  streak: number;
  userName?: string;
  onClose: () => void;
}

/**
 * Celebration modal for streak milestones (3/7/14/30/60/90 days).
 * Includes a shareable card that can be exported as PNG.
 */
export default function StreakMilestoneCard({ streak, userName, onClose }: StreakMilestoneCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const message = MILESTONE_MESSAGES[streak] || {
    title: `${streak} hari streak!`,
    subtitle: 'Konsistensi kamu luar biasa',
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Use html-to-image if available, fallback to canvas snapshot
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#CE3D66',
      });

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `pesona-streak-${streak}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${streak} hari streak Pesona!`,
            text: message.subtitle,
          });
          setDownloading(false);
          return;
        }
      }

      // Fallback: download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `pesona-streak-${streak}.png`;
      a.click();
    } catch {
      // If html-to-image fails, show message
      alert('Screenshot gagal — coba screenshot manual ya');
    }
    setDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-bg rounded-3xl max-w-sm w-full overflow-hidden animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shareable card */}
        <div
          ref={cardRef}
          className="relative p-8 text-center text-white"
          style={{
            background: 'linear-gradient(135deg, #CE3D66 0%, #E0527A 50%, #F59FBE 100%)',
          }}
        >
          <div className="text-6xl mb-2">🔥</div>
          <div className="text-7xl font-black mb-1 leading-none">{streak}</div>
          <div className="text-sm font-medium opacity-90 mb-4">HARI STREAK</div>
          <div className="text-lg font-bold mb-1">{message.title}</div>
          <div className="text-sm opacity-90">{message.subtitle}</div>
          {userName && (
            <div className="text-xs opacity-75 mt-6">— {userName}</div>
          )}
          <div className="text-[10px] opacity-60 mt-3">pesona.io</div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleShare}
            disabled={downloading}
            className="w-full py-3 bg-accent text-accent-fg font-semibold rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? 'Membuat gambar...' : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Bagikan Streak
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-text-tertiary text-sm font-medium hover:text-text-muted"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
