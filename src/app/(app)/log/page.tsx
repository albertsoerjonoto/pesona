'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';
import type { Routine, RoutineStep, RoutineLog } from '@/lib/types';

export default function LogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();
  const fetchedRef = useRef(false);

  const initialTab = () => new Date().getHours() >= 17 ? 'evening' as const : 'morning' as const;
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>(initialTab);
  const [morningRoutine, setMorningRoutine] = useState<Routine | null>(null);
  const [eveningRoutine, setEveningRoutine] = useState<Routine | null>(null);
  const [morningLog, setMorningLog] = useState<RoutineLog | null>(null);
  const [eveningLog, setEveningLog] = useState<RoutineLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentRoutine = activeTab === 'morning' ? morningRoutine : eveningRoutine;
  const currentLog = activeTab === 'morning' ? morningLog : eveningLog;
  const steps = (currentRoutine?.steps || []) as RoutineStep[];
  const completedSteps = ((currentLog?.completed_steps || []) as number[]);

  useEffect(() => {
    if (!user || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      try {
        const supabase = createClient();
        const [routinesRes, logsRes] = await Promise.all([
          supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
          supabase.from('routine_logs').select('*').eq('user_id', user.id).eq('date', today),
        ]);

        const routines = routinesRes.data || [];
        setMorningRoutine(routines.find((r: Routine) => r.type === 'morning') || null);
        setEveningRoutine(routines.find((r: Routine) => r.type === 'evening') || null);

        const logs = logsRes.data || [];
        setMorningLog(logs.find((l: RoutineLog) => l.type === 'morning') || null);
        setEveningLog(logs.find((l: RoutineLog) => l.type === 'evening') || null);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, today]);

  const toggleStep = async (stepNumber: number) => {
    if (!user || !currentRoutine || saving) return;
    setSaving(true);

    const newCompleted = completedSteps.includes(stepNumber)
      ? completedSteps.filter(s => s !== stepNumber)
      : [...completedSteps, stepNumber];

    const isComplete = newCompleted.length === steps.length;
    const percentage = steps.length > 0 ? Math.round((newCompleted.length / steps.length) * 100) : 0;

    const supabase = createClient();
    const { data } = await supabase
      .from('routine_logs')
      .upsert({
        user_id: user.id,
        routine_id: currentRoutine.id,
        type: activeTab,
        date: today,
        completed_steps: newCompleted,
        completed: isComplete,
        completion_percentage: percentage,
      }, { onConflict: 'user_id,type,date' })
      .select()
      .single();

    if (data) {
      const log = data as unknown as RoutineLog;
      if (activeTab === 'morning') setMorningLog(log);
      else setEveningLog(log);
    }

    // Update daily checkin
    if (isComplete) {
      const field = activeTab === 'morning' ? 'morning_routine_done' : 'evening_routine_done';
      await supabase.from('daily_checkins').upsert({
        user_id: user.id,
        date: today,
        [field]: true,
      }, { onConflict: 'user_id,date' });
    }

    setSaving(false);
  };

  const progress = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;
  const allDone = steps.length > 0 && completedSteps.length === steps.length;

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      cleanser: '🧴', toner: '💧', serum: '💎', moisturizer: '🧊',
      sunscreen: '☀️', exfoliator: '✨', mask: '🎭', eye_cream: '👁️',
      lip_care: '💋', spot_treatment: '🎯', other: '🧪',
    };
    return icons[cat] || '🧴';
  };

  if (loading) {
    return (
      <div className={cn('max-w-lg mx-auto px-4 pb-24 pt-6', isExpanded && 'lg:max-w-4xl lg:px-8')}>
        <div className="h-8 w-32 bg-surface rounded-lg animate-shimmer mb-4" />
        <div className="h-12 bg-surface rounded-xl animate-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (<div key={i} className="h-20 bg-surface rounded-2xl animate-shimmer" />))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('max-w-lg mx-auto px-4 pb-24 pt-20 text-center', isExpanded && 'lg:max-w-4xl lg:px-8')}>
        <div className="bg-surface rounded-2xl p-8">
          <div className="text-4xl mb-4">😵</div>
          <p className="text-sm text-text-secondary mb-4">{t('routine.loadError')}</p>
          <button
            onClick={() => { fetchedRef.current = false; setError(false); setLoading(true); }}
            className="px-6 py-2.5 bg-accent text-accent-fg font-medium rounded-xl hover:bg-accent-hover transition-all"
          >
            {t('error.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <h1 className="text-xl font-bold text-text-primary mb-4">{t('nav.log')}</h1>

        {/* Tab Toggle */}
        <div className="flex bg-surface rounded-xl p-1 border border-border">
          <button
            onClick={() => setActiveTab('morning')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'morning' ? 'bg-accent text-accent-fg shadow-sm' : 'text-text-secondary'
            )}
          >
            ☀️ {t('routine.morning')}
          </button>
          <button
            onClick={() => setActiveTab('evening')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'evening' ? 'bg-accent text-accent-fg shadow-sm' : 'text-text-secondary'
            )}
          >
            🌙 {t('routine.evening')}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-secondary">
              {completedSteps.length}/{steps.length} {t('dashboard.stepsCompleted')}
            </span>
            <span className="text-xs font-medium text-accent-text">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Completion celebration */}
      {allDone && (
        <div className="bg-positive-surface border border-positive-border rounded-2xl p-4 mb-4 text-center animate-fade-in">
          <span className="text-3xl">🎉</span>
          <p className="text-sm font-semibold text-positive-text mt-1">{t('routine.completed')}</p>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 ? (
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isChecked = completedSteps.includes(step.step_number || i + 1);
            return (
              <button
                key={i}
                onClick={() => toggleStep(step.step_number || i + 1)}
                disabled={saving}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left',
                  isChecked
                    ? 'bg-positive-surface border-positive-border'
                    : 'bg-surface border-border hover:border-accent-border'
                )}
              >
                {/* Checkbox */}
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                  isChecked
                    ? 'bg-positive border-positive'
                    : 'border-border-strong'
                )}>
                  {isChecked && (
                    <svg className="w-3.5 h-3.5 text-white animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcon(step.category)}</span>
                    <span className={cn(
                      'text-sm font-medium',
                      isChecked ? 'text-positive-text line-through' : 'text-text-primary'
                    )}>
                      {step.product_name}
                    </span>
                  </div>
                  {step.product_brand && (
                    <p className="text-xs text-text-tertiary mt-0.5 ml-7">{step.product_brand}</p>
                  )}
                  {step.instruction && (
                    <p className="text-xs text-text-secondary mt-1 ml-7">{step.instruction}</p>
                  )}
                </div>

                {/* Step number */}
                <span className="text-xs text-text-tertiary font-medium shrink-0">#{step.step_number || i + 1}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">{activeTab === 'morning' ? '☀️' : '🌙'}</span>
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">{t('routine.noRoutineYet')}</p>
          <p className="text-xs text-text-tertiary mb-4">{t('routine.askSona')}</p>
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-2.5 bg-accent text-accent-fg font-medium rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] text-sm"
          >
            💬 {t('routine.generateAI')}
          </button>
        </div>
      )}
    </div>
  );
}
