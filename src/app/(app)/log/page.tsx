'use client';

import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';

export default function LogPage() {
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();

  return (
    <div className={cn('max-w-lg mx-auto px-4', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <h1 className="text-xl font-bold text-text-primary">{t('log.title')}</h1>
      </div>

      {/* Skincare Log */}
      <div className="bg-surface rounded-2xl p-6 mb-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Skincare Log</h2>
        <p className="text-sm text-text-secondary mb-4">
          Catat produk skincare yang kamu pakai hari ini.
        </p>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-sm text-text-tertiary">Belum ada log hari ini</p>
            <p className="text-xs text-text-tertiary mt-1">Chat dengan AI coach untuk mulai logging</p>
          </div>
        </div>
      </div>

      {/* Body Measurements */}
      <div className="bg-surface rounded-2xl p-6 mb-20 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Ukuran Tubuh</h2>
        <p className="text-sm text-text-secondary mb-4">
          Tracking berat badan dan ukuran tubuh kamu.
        </p>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-sm text-text-tertiary">Belum ada pengukuran</p>
          </div>
        </div>
      </div>
    </div>
  );
}
