'use client';

import { useLocale } from '@/lib/i18n';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 text-center">
      <div className="bg-surface rounded-2xl p-8">
        <div className="text-4xl mb-4">😵</div>
        <h2 className="text-lg font-bold text-text-primary mb-2">{t('error.title')}</h2>
        <p className="text-sm text-text-secondary mb-6">
          {error.message || t('error.defaultMessage')}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-accent-fg font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          {t('error.retry')}
        </button>
      </div>
    </div>
  );
}
