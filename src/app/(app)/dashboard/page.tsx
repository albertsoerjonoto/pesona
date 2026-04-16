'use client';

import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();

  return (
    <div className={cn('max-w-lg mx-auto px-4', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <h1 className="text-xl font-bold text-text-primary">{t('nav.overview')}</h1>
      </div>

      {/* Skin Profile Summary */}
      <div className="bg-surface rounded-2xl p-6 mb-4 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Profil Kulit</h2>
            <p className="text-xs text-text-tertiary">Belum ada profil kulit. Mulai skin quiz!</p>
          </div>
        </div>
        <button className="w-full py-2.5 bg-accent text-accent-fg font-medium rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] text-sm">
          Mulai Skin Quiz
        </button>
      </div>

      {/* Today's Routine */}
      <div className="bg-surface rounded-2xl p-6 mb-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Rutinitas Hari Ini</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-bg rounded-xl">
            <span className="text-lg">🌅</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Rutinitas Pagi</p>
              <p className="text-xs text-text-tertiary">Belum ada rutinitas. Chat dengan AI coach untuk membuat!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-bg rounded-xl">
            <span className="text-lg">🌙</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Rutinitas Malam</p>
              <p className="text-xs text-text-tertiary">Belum ada rutinitas. Chat dengan AI coach untuk membuat!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Progress */}
      <div className="bg-surface rounded-2xl p-6 mb-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Progress Foto</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary">Ambil foto pertama untuk mulai tracking progress kulit kamu</p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-surface rounded-2xl p-6 mb-20 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Tips Hari Ini</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          Jangan lupa pakai sunscreen SPF 30+ sebelum keluar rumah! Reapply setiap 2-3 jam kalau banyak aktivitas di luar.
        </p>
      </div>
    </div>
  );
}
