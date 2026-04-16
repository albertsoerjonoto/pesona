'use client';

import { Suspense } from 'react';
import { LocaleProvider } from '@/lib/i18n';
import { TourProvider } from '@/components/tour/TourProvider';
import PostHogProvider from '@/components/PostHogProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <Suspense fallback={null}>
        <PostHogProvider>
          <TourProvider>{children}</TourProvider>
        </PostHogProvider>
      </Suspense>
    </LocaleProvider>
  );
}
