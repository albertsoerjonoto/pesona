'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [calendarData, setCalendarData] = useState<Record<string, { morning: boolean; evening: boolean }>>({});

  // Use local date (matches DB date column storage and calendar cells)
  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const currentRoutine = activeTab === 'morning' ? morningRoutine : eveningRoutine;
  const currentLog = activeTab === 'morning' ? morningLog : eveningLog;
  const steps = (currentRoutine?.steps || []) as RoutineStep[];
  const completedSteps = ((currentLog?.completed_steps || []) as number[]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
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

      // Load 30-day calendar data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: calLogs } = await supabase
        .from('routine_logs')
        .select('date, type, completed')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .eq('completed', true);

      if (calLogs) {
        const cal: Record<string, { morning: boolean; evening: boolean }> = {};
        for (const log of calLogs) {
          if (!cal[log.date]) cal[log.date] = { morning: false, evening: false };
          if (log.type === 'morning') cal[log.date].morning = true;
          if (log.type === 'evening') cal[log.date].evening = true;
        }
        setCalendarData(cal);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    if (!user || fetchedRef.current) return;
    fetchedRef.current = true;
    load();
  }, [user, load]);

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
      <main className={cn('max-w-lg mx-auto px-4 pb-24 pt-6', isExpanded && 'lg:max-w-4xl lg:px-8')} aria-busy="true">
        <div className="h-8 w-32 bg-surface rounded-lg animate-shimmer mb-4" />
        <div className="h-12 bg-surface rounded-xl animate-shimmer mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (<div key={i} className="h-20 bg-surface rounded-2xl animate-shimmer" />))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={cn('max-w-lg mx-auto px-4 pb-24 pt-20 text-center', isExpanded && 'lg:max-w-4xl lg:px-8')}>
        <div className="bg-surface rounded-2xl p-8" role="alert">
          <div className="text-4xl mb-4" aria-hidden="true">😵</div>
          <p className="text-sm text-text-secondary mb-4">{t('routine.loadError')}</p>
          <button
            onClick={() => load()}
            className="px-6 py-2.5 bg-accent text-accent-fg font-medium rounded-xl hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all"
          >
            {t('error.retry')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
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

      {/* 30-Day Calendar Grid */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-text-primary mb-3">30 Hari Terakhir</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {/* Day labels */}
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
            <div key={d} className="text-[9px] text-text-muted text-center font-medium">{d}</div>
          ))}

          {/* Calendar cells */}
          {(() => {
            const cells = [];
            const now = new Date();
            // Helper: local date to YYYY-MM-DD string (consistent with DB)
            const toLocalDateStr = (d: Date) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${day}`;
            };
            // Start from 30 days ago, aligned to Monday
            const start = new Date(now);
            start.setDate(start.getDate() - 29);
            // Align to start of week (Monday = 1)
            const dayOfWeek = start.getDay();
            const alignOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start.setDate(start.getDate() - alignOffset);

            const endDate = new Date(now);
            const endDayOfWeek = now.getDay();
            endDate.setDate(endDate.getDate() + (7 - (endDayOfWeek === 0 ? 7 : endDayOfWeek)));

            const cursor = new Date(start);
            while (cursor <= endDate) {
              const dateStr = toLocalDateStr(cursor);
              const cal = calendarData[dateStr];
              const isFuture = cursor > now;
              const isToday = dateStr === today;
              const bothDone = cal?.morning && cal?.evening;
              const oneDone = cal?.morning || cal?.evening;

              cells.push(
                <div
                  key={dateStr}
                  className={cn(
                    'aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-all',
                    isFuture && 'opacity-20',
                    isToday && 'ring-1 ring-accent',
                    bothDone && 'bg-positive text-white',
                    oneDone && !bothDone && 'bg-positive/40 text-positive-text',
                    !oneDone && !isFuture && 'bg-surface-secondary text-text-muted',
                  )}
                  title={`${dateStr}${cal?.morning ? ' ☀️' : ''}${cal?.evening ? ' 🌙' : ''}`}
                >
                  {cursor.getDate()}
                </div>
              );
              cursor.setDate(cursor.getDate() + 1);
            }
            return cells;
          })()}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-positive" />
            <span className="text-[9px] text-text-tertiary">Pagi + Malam</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-positive/40" />
            <span className="text-[9px] text-text-tertiary">Salah satu</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-surface-secondary" />
            <span className="text-[9px] text-text-tertiary">Belum</span>
          </div>
        </div>
      </div>
    </main>
  );
}
