'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';
import type { SkinProfile, Routine, RoutineLog, DailyCheckin, SkinFeeling } from '@/lib/types';

const SKIN_TIPS_OILY = [
  'Jangan skip moisturizer walau kulit berminyak! Pilih yang gel-based ya ✨',
  'Cuci muka 2x sehari cukup, terlalu sering malah bikin makin berminyak',
  'Clay mask seminggu 1-2x bantu kontrol minyak berlebih',
  'Pilih sunscreen bertekstur ringan, jangan yang creamy berat',
  'Niacinamide bisa bantu mengontrol produksi sebum kamu',
];

const SKIN_TIPS_DRY = [
  'Double cleansing di malam hari bantu angkat sunscreen tanpa bikin kering 💧',
  'Cari moisturizer dengan ceramide untuk memperkuat skin barrier',
  'Hindari scrub kasar, pilih exfoliator yang gentle seperti PHA',
  'Pakai hyaluronic acid serum di kulit yang masih lembap',
  'Minum air 2 liter/hari bantu hidrasi dari dalam',
];

const SKIN_TIPS_GENERAL = [
  'Sunscreen SPF 30+ itu wajib setiap hari, bahkan kalau nggak keluar rumah! ☀️',
  'Ganti sarung bantal minimal seminggu sekali untuk hindari bakteri',
  'Jangan pegang-pegang wajah, tangan kita penuh bakteri 🙌',
  'Tunggu 1-2 menit antara setiap layer skincare biar menyerap',
  'Produk baru? Patch test dulu di belakang telinga 24 jam',
  'Retinol sebaiknya dipakai malam hari dan selalu pakai sunscreen besoknya',
  'Vitamin C serum paling efektif dipakai pagi hari sebelum sunscreen',
  'Jangan campurin retinol dan AHA/BHA di waktu yang sama',
  'Kulit butuh waktu 4-6 minggu untuk lihat hasil skincare baru',
  'Stres bisa bikin breakout. Take care of your mind too! 💛',
];

const FEELINGS: { value: SkinFeeling; emoji: string }[] = [
  { value: 'great', emoji: '😍' },
  { value: 'good', emoji: '😊' },
  { value: 'okay', emoji: '😐' },
  { value: 'bad', emoji: '😕' },
  { value: 'terrible', emoji: '😢' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();
  const fetchedRef = useRef(false);

  const [profile, setProfile] = useState<{ display_name: string | null; skin_quiz_completed: boolean } | null>(null);
  const [skinProfile, setSkinProfile] = useState<SkinProfile | null>(null);
  const [morningRoutine, setMorningRoutine] = useState<Routine | null>(null);
  const [eveningRoutine, setEveningRoutine] = useState<Routine | null>(null);
  const [morningLog, setMorningLog] = useState<RoutineLog | null>(null);
  const [eveningLog, setEveningLog] = useState<RoutineLog | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      const supabase = createClient();

      const [profileRes, skinRes, routinesRes, logsRes, checkinRes] = await Promise.all([
        supabase.from('profiles').select('display_name, skin_quiz_completed').eq('id', user.id).single(),
        supabase.from('skin_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
        supabase.from('routine_logs').select('*').eq('user_id', user.id).eq('date', today),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('date', today).single(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (skinRes.data) setSkinProfile(skinRes.data as unknown as SkinProfile);

      const routines = routinesRes.data || [];
      setMorningRoutine(routines.find((r: Routine) => r.type === 'morning') || null);
      setEveningRoutine(routines.find((r: Routine) => r.type === 'evening') || null);

      const logs = logsRes.data || [];
      setMorningLog(logs.find((l: RoutineLog) => l.type === 'morning') || null);
      setEveningLog(logs.find((l: RoutineLog) => l.type === 'evening') || null);

      if (checkinRes.data) setTodayCheckin(checkinRes.data as unknown as DailyCheckin);

      // Calculate streak
      const { data: streakData } = await supabase
        .from('daily_checkins')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90);

      if (streakData) {
        let streak = 0;
        const d = new Date();
        for (const entry of streakData) {
          const expected = d.toISOString().split('T')[0];
          if (entry.date === expected) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else break;
        }
        setStreakCount(streak);
      }
    };

    load();
  }, [user, today]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 17) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const [dailyTipIndex] = useState(() => {
    const now = Date.now();
    return Math.floor((now - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  });

  const getDailyTip = () => {
    if (skinProfile?.skin_type === 'oily') return SKIN_TIPS_OILY[dailyTipIndex % SKIN_TIPS_OILY.length];
    if (skinProfile?.skin_type === 'dry') return SKIN_TIPS_DRY[dailyTipIndex % SKIN_TIPS_DRY.length];
    return SKIN_TIPS_GENERAL[dailyTipIndex % SKIN_TIPS_GENERAL.length];
  };

  const handleCheckin = async (feeling: SkinFeeling) => {
    if (!user || saving) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: user.id,
        date: today,
        skin_feeling: feeling,
        streak_count: streakCount + (todayCheckin ? 0 : 1),
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (data) {
      setTodayCheckin(data as unknown as DailyCheckin);
      if (!todayCheckin) setStreakCount(s => s + 1);
    }
    setSaving(false);
  };

  const skinTypeLabel = skinProfile?.skin_type ? t(`skin.type.${skinProfile.skin_type}`) : '';
  const concernLabels = (skinProfile?.concerns || []).map(c => t(`skin.concern.${c}`));

  return (
    <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {/* Greeting Header */}
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {getGreeting()}, {profile?.display_name?.split(' ')[0] || 'Kak'}! ✨
            </h1>
          </div>
          {streakCount > 0 && (
            <div className="flex items-center gap-1 bg-accent-surface px-3 py-1 rounded-full">
              <span>🔥</span>
              <span className="text-sm font-bold text-accent-text">{streakCount} {t('dashboard.streak')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Skin Profile Card */}
      <div className="bg-surface rounded-2xl p-5 mb-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-accent-surface rounded-xl flex items-center justify-center">
            <span className="text-lg">🧴</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">{t('dashboard.skinProfile')}</h2>
            {skinProfile?.skin_type ? (
              <p className="text-xs text-text-secondary">{skinTypeLabel}</p>
            ) : (
              <p className="text-xs text-text-tertiary">Belum ada profil kulit</p>
            )}
          </div>
        </div>

        {skinProfile?.skin_type ? (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="px-2.5 py-1 bg-accent text-accent-fg text-xs font-medium rounded-full">{skinTypeLabel}</span>
              {concernLabels.slice(0, 3).map((label, i) => (
                <span key={i} className="px-2.5 py-1 bg-accent-surface text-accent-text text-xs font-medium rounded-full">{label}</span>
              ))}
            </div>
            <button
              onClick={() => router.push('/onboarding')}
              className="text-xs text-accent-text font-medium hover:underline"
            >
              {t('dashboard.editSkinProfile')}
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push('/onboarding')}
            className="w-full py-2.5 bg-accent text-accent-fg font-medium rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] text-sm"
          >
            {t('dashboard.startQuiz')}
          </button>
        )}
      </div>

      {/* Today's Routines */}
      <div className="bg-surface rounded-2xl p-5 mb-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">{t('dashboard.todayRoutine')}</h2>
        <div className="space-y-3">
          <RoutineCard
            label={t('dashboard.morningRoutine')}
            emoji="☀️"
            routine={morningRoutine}
            log={morningLog}
            onAsk={() => router.push('/chat')}
            t={t}
          />
          <RoutineCard
            label={t('dashboard.eveningRoutine')}
            emoji="🌙"
            routine={eveningRoutine}
            log={eveningLog}
            onAsk={() => router.push('/chat')}
            t={t}
          />
        </div>
      </div>

      {/* Daily Check-in */}
      <div className="bg-surface rounded-2xl p-5 mb-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">{t('dashboard.dailyCheckin')}</h2>
        <div className="flex justify-between">
          {FEELINGS.map(f => (
            <button
              key={f.value}
              onClick={() => handleCheckin(f.value)}
              disabled={saving}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                todayCheckin?.skin_feeling === f.value
                  ? 'bg-accent-surface ring-2 ring-accent scale-110'
                  : 'hover:bg-surface-hover'
              )}
            >
              <span className="text-2xl">{f.emoji}</span>
              <span className="text-[10px] text-text-tertiary">{t(`skin.feeling.${f.value}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Photo Button */}
      <button
        onClick={() => router.push('/friends')}
        className="w-full bg-surface rounded-2xl p-4 mb-4 border border-border flex items-center gap-3 hover:bg-surface-hover transition-all active:scale-[0.99]"
      >
        <div className="w-10 h-10 bg-accent-surface rounded-xl flex items-center justify-center">
          <span className="text-lg">📸</span>
        </div>
        <span className="text-sm font-medium text-text-primary">{t('dashboard.takePhoto')}</span>
        <svg className="w-4 h-4 text-text-tertiary ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Tip of the Day */}
      <div className="bg-accent-surface rounded-2xl p-5 mb-4 border border-accent-border">
        <div className="flex items-center gap-2 mb-2">
          <span>💡</span>
          <h2 className="font-semibold text-accent-text">{t('dashboard.tipOfDay')}</h2>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {getDailyTip()}
        </p>
      </div>
    </div>
  );
}

function RoutineCard({
  label,
  emoji,
  routine,
  log,
  onAsk,
  t,
}: {
  label: string;
  emoji: string;
  routine: Routine | null;
  log: RoutineLog | null;
  onAsk: () => void;
  t: (key: string) => string;
}) {
  const steps = routine?.steps || [];
  const completedSteps = (log?.completed_steps as number[]) || [];

  if (!routine || steps.length === 0) {
    return (
      <div className="flex items-center gap-3 p-3 bg-bg rounded-xl">
        <span className="text-lg">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-tertiary">{t('dashboard.noRoutine')}</p>
        </div>
        <button onClick={onAsk} className="text-xs text-accent-text font-medium">💬</button>
      </div>
    );
  }

  const progress = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  return (
    <div className="p-3 bg-bg rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <p className="text-sm font-medium text-text-primary">{label}</p>
        </div>
        <span className="text-xs text-text-secondary">
          {completedSteps.length}/{steps.length} {t('dashboard.stepsCompleted')}
        </span>
      </div>
      <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
