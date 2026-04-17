'use client';

import { useState, useRef, useCallback } from 'react';
import type { PhotoProgress } from '@/lib/types';

interface PhotoCompareProps {
  before: PhotoProgress;
  after: PhotoProgress;
  className?: string;
}

interface AnalysisDelta {
  label: string;
  before: number;
  after: number;
  delta: number;
  improved: boolean;
}

export default function PhotoCompare({ before, after, className = '' }: PhotoCompareProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  }, []);

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Calculate deltas from AI analysis
  const getDeltas = (): AnalysisDelta[] => {
    const b = before.ai_analysis as Record<string, unknown> | null;
    const a = after.ai_analysis as Record<string, unknown> | null;
    if (!b || !a) return [];

    const metrics: { key: string; label: string }[] = [
      { key: 'overall_score', label: 'Skor Keseluruhan' },
      { key: 'brightness', label: 'Kecerahan' },
      { key: 'texture', label: 'Tekstur' },
      { key: 'hydration', label: 'Hidrasi' },
    ];

    return metrics
      .filter(m => typeof b[m.key] === 'number' && typeof a[m.key] === 'number')
      .map(m => ({
        label: m.label,
        before: b[m.key] as number,
        after: a[m.key] as number,
        delta: (a[m.key] as number) - (b[m.key] as number),
        improved: (a[m.key] as number) > (b[m.key] as number),
      }));
  };

  const deltas = getDeltas();

  return (
    <div className={className}>
      {/* Slider comparison */}
      <div
        ref={containerRef}
        className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-col-resize select-none bg-surface-secondary"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        {/* After image (full) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={after.photo_url}
          alt="Sesudah"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={before.photo_url}
            alt="Sebelum"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
            draggable={false}
          />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Date labels */}
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full z-20">
          Sebelum: {formatDate(before.taken_at)}
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full z-20">
          Sesudah: {formatDate(after.taken_at)}
        </div>
      </div>

      {/* Analysis deltas */}
      {deltas.length > 0 && (
        <div className="mt-4 bg-surface rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Perbandingan Analisis</h3>
          <div className="space-y-3">
            {deltas.map(d => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">{d.before}</span>
                  <span className="text-xs text-text-tertiary">→</span>
                  <span className="text-xs font-medium text-text-primary">{d.after}</span>
                  <span className={`text-xs font-bold ${d.improved ? 'text-positive-text' : 'text-danger-text'}`}>
                    {d.delta > 0 ? '+' : ''}{d.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
