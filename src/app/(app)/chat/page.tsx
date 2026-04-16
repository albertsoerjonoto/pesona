'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={cn('flex flex-col h-dvh', isExpanded && 'sm:h-screen')}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary text-center">{t('chat.title')}</h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Welcome message */}
          <div className="bg-surface rounded-2xl p-5 mb-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              Halo! Aku Pesona, AI beauty coach kamu. Aku bisa bantu:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-0.5">&#x2022;</span>
                Membuat skincare routine pagi & malam
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-0.5">&#x2022;</span>
                Rekomendasi produk sesuai jenis kulit kamu
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-0.5">&#x2022;</span>
                Analisis kondisi kulit dari foto
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-500 mt-0.5">&#x2022;</span>
                Tips perawatan untuk iklim tropis Indonesia
              </li>
            </ul>
            <p className="mt-4 text-sm text-text-secondary">
              Coba tanya: &ldquo;Kulit aku berminyak dan sering jerawatan, skincare routine apa yang cocok?&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-bg px-4 py-3 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya soal skincare..."
            rows={1}
            className="flex-1 resize-none bg-surface rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-input-ring border border-border-strong"
            style={{ maxHeight: '120px' }}
          />
          <button
            disabled={!input.trim()}
            className="shrink-0 w-10 h-10 bg-accent text-accent-fg rounded-xl flex items-center justify-center hover:bg-accent-hover transition-all active:scale-95 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
