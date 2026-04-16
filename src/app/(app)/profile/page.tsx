'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { getToday, cn } from '@/lib/utils';
import {
  validateCalorieRangeAmount,
  validateDOB,
  validateBodyStat,
} from '@/lib/validation';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { compressAvatar } from '@/lib/image';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { useTour } from '@/components/tour/useTour';
import PaywallModal from '@/components/PaywallModal';
import type { Profile, Gender, Locale } from '@/lib/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  const { t, locale, setLocale } = useLocale();
  const { startTour } = useTour();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [calorieMode, setCalorieMode] = useState<'deficit' | 'maintenance' | 'surplus'>('maintenance');
  const [calorieAmountLow, setCalorieAmountLow] = useState('500');
  const [calorieAmountHigh, setCalorieAmountHigh] = useState('1000');
  const [maintenanceRange, setMaintenanceRange] = useState('200');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [waterGoalMl, setWaterGoalMl] = useState('2000');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const fetchedForUser = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyProfile = (p: Profile) => {
    setProfile(p);
    setDisplayName(p.display_name || '');
    setUsername(p.username || '');
    setAvatarUrl(p.avatar_url || null);
    const offMin = p.calorie_offset_min ?? -200;
    const offMax = p.calorie_offset_max ?? 200;
    if (offMax <= 0 && offMin < 0) {
      // Pure deficit: offMin=-1000, offMax=-500 → show low=500, high=1000
      setCalorieMode('deficit');
      setCalorieAmountLow(String(Math.abs(offMax)));
      setCalorieAmountHigh(String(Math.abs(offMin)));
    } else if (offMin >= 0 && offMax > 0) {
      // Pure surplus: offMin=300, offMax=500 → show low=300, high=500
      setCalorieMode('surplus');
      setCalorieAmountLow(String(offMin));
      setCalorieAmountHigh(String(offMax));
    } else {
      // Maintenance: offMin=-200, offMax=200 → show range=200
      setCalorieMode('maintenance');
      setMaintenanceRange(String(Math.max(Math.abs(offMin), Math.abs(offMax))));
    }
    setWaterGoalMl(String(p.daily_water_goal_ml ?? 2000));
    setDateOfBirth(p.date_of_birth || '');
    setGender(p.gender || '');
    setHeightCm(p.height_cm ? String(p.height_cm) : '');
    setWeightKg(p.weight_kg ? String(p.weight_kg) : '');
    if (p.desktop_layout) setDesktopLayout(p.desktop_layout);
  };

  useEffect(() => {
    if (!user) return;
    if (fetchedForUser.current === user.id) return;
    fetchedForUser.current = user.id;

    const fetchSubscription = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', user.id)
        .single();
      if (data && data.status === 'active') {
        setSubscriptionTier(data.tier || 'free');
        setSubscriptionEnd(data.current_period_end);
      }
    };
    fetchSubscription().catch(() => { /* subscriptions table may not exist yet */ });

    const fetchOrCreateProfile = async () => {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        applyProfile(data);
        return;
      }

      if (fetchError?.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            display_name: user.email!.split('@')[0],
            calorie_offset_min: -200,
            calorie_offset_max: 200,
          })
          .select()
          .single();

        if (insertError) {
          showToast('error', t('profile.failedCreate'));
          return;
        }
        if (newProfile) applyProfile(newProfile);
      }
    };

    fetchOrCreateProfile();
  }, [user, showToast, t]);

  const saveProfile = async () => {
    if (!user) return;

    const newErrors: Record<string, string> = {};

    if (calorieMode === 'maintenance') {
      const rangeVal = validateCalorieRangeAmount(maintenanceRange);
      if (rangeVal === null || rangeVal <= 0) {
        newErrors.maintenanceRange = t('profile.calorieError');
      }
    } else {
      const lowVal = validateCalorieRangeAmount(calorieAmountLow);
      const highVal = validateCalorieRangeAmount(calorieAmountHigh);
      if (lowVal === null || lowVal <= 0) {
        newErrors.calorieAmountLow = t('profile.calorieError');
      }
      if (highVal === null || highVal <= 0) {
        newErrors.calorieAmountHigh = t('profile.calorieError');
      }
      if (lowVal !== null && highVal !== null && lowVal > highVal) {
        newErrors.calorieAmountLow = t('profile.rangeError');
      }
    }

    if (dateOfBirth && !validateDOB(dateOfBirth)) {
      newErrors.dateOfBirth = t('profile.dobError');
    }

    if (heightCm && validateBodyStat(heightCm, 50, 300) === null) {
      newErrors.heightCm = t('profile.heightError');
    }

    if (weightKg && validateBodyStat(weightKg, 10, 500) === null) {
      newErrors.weightKg = t('profile.weightError');
    }

    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      newErrors.username = t('profile.usernameHint');
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);

    try {
      const supabase = createClient();

      // Refresh auth session to avoid stale token errors
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        showToast('error', t('profile.failedSave'));
        setSaving(false);
        return;
      }

      // Build update payload based on columns that exist in the fetched profile
      const payload: Record<string, unknown> = {
        display_name: displayName.trim() || null,
        username: username.trim().toLowerCase() || null,
      };

      // Only include columns that exist in the database (based on fetched profile)
      if (profile && 'calorie_offset_min' in profile) {
        payload.calorie_offset_min = calorieMode === 'maintenance'
          ? -(parseInt(maintenanceRange) || 200)
          : calorieMode === 'deficit'
            ? -(parseInt(calorieAmountHigh) || 1000)
            : (parseInt(calorieAmountLow) || 300);
        payload.calorie_offset_max = calorieMode === 'maintenance'
          ? (parseInt(maintenanceRange) || 200)
          : calorieMode === 'deficit'
            ? -(parseInt(calorieAmountLow) || 500)
            : (parseInt(calorieAmountHigh) || 500);
      }

      if (profile && 'daily_water_goal_ml' in profile) {
        payload.daily_water_goal_ml = parseInt(waterGoalMl) || 2000;
      }

      if (profile && 'desktop_layout' in profile) {
        payload.desktop_layout = desktopLayout;
      }

      // Body stats and other nullable fields — always safe to include
      payload.date_of_birth = dateOfBirth || null;
      payload.gender = gender || null;
      payload.height_cm = heightCm ? parseFloat(heightCm) : null;
      payload.weight_kg = weightKg ? parseFloat(weightKg) : null;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Profile save error:', JSON.stringify(updateError));

        if (updateError.code === '23505') {
          setErrors((prev) => ({ ...prev, username: t('profile.usernameTaken') }));
          showToast('error', t('profile.usernameTaken'));
        } else {
          const detail = ` [${updateError.code}: ${updateError.message}]`;
          showToast('error', t('profile.failedSave') + detail);
        }
        setSaving(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (data) applyProfile(data);

      setSaving(false);
      setSaved(true);
      showToast('success', t('profile.savedSuccess'));
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Profile save exception:', err);
      showToast('error', t('profile.failedSave'));
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' });
      if (!res.ok) {
        showToast('error', t('profile.failedDelete'));
        setDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      showToast('error', t('profile.failedDelete'));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const compressed = await compressAvatar(file);
      const supabase = createClient();
      const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, {
          contentType: compressed.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust })
        .eq('id', user.id);

      setAvatarUrl(urlWithCacheBust);
      showToast('success', t('profile.photoUpdated'));
    } catch {
      showToast('error', t('profile.failedUpload'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const initials = (displayName || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const rowClass = 'px-4 py-3.5 flex items-center justify-between';
  const dividerClass = 'border-b border-border';
  const inputClass = 'text-sm text-right bg-transparent focus:outline-none text-text-secondary placeholder:text-text-tertiary';

  const { isExpanded, layout: desktopLayout, setLayout: setDesktopLayout } = useDesktopLayout();

  return (
    <div className={cn('max-w-lg mx-auto px-4', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {ToastContainer}
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <h1 className="text-xl font-bold text-text-primary">{t('profile.title')}</h1>
      </div>

      {!profile ? (
        <PageSkeleton />
      ) : (
        <>
          {/* Profile header */}
          <div className="flex flex-col items-center pt-2 pb-6">
            <div className="relative mb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-positive overflow-hidden active:scale-95 transition-transform"
                disabled={uploading}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white flex items-center justify-center w-full h-full">
                    {initials}
                  </span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-bg pointer-events-none">
                <svg className="w-3 h-3 text-accent-fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="text-xl font-semibold text-text-primary">{displayName || t('common.noName')}</p>
            {username && (
              <p className="text-sm text-text-tertiary mt-0.5">@{username}</p>
            )}
          </div>

          {/* Skin Profile Card */}
          <div className="bg-surface rounded-2xl p-4 mb-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-surface rounded-xl flex items-center justify-center">
                  <span className="text-lg">🧴</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{t('dashboard.skinProfile')}</h3>
                  <p className="text-xs text-text-tertiary">
                    {profile.skin_quiz_completed ? t('dashboard.editSkinProfile') : t('dashboard.startQuiz')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/onboarding')}
                className="px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-accent-hover transition-all"
              >
                {profile.skin_quiz_completed ? t('common.edit') : t('common.getStarted')}
              </button>
            </div>
          </div>

          {/* Langganan (Subscription) section */}
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1 mt-4 mb-2">Langganan</p>
          <div className="bg-surface rounded-2xl overflow-hidden">
            <div className={`${rowClass} ${dividerClass}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent-surface rounded-lg flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{subscriptionTier === 'free' ? 'Pesona Coba' : subscriptionTier === 'plus' ? 'Pesona Plus' : subscriptionTier === 'pro' ? 'Pesona Pro' : 'Pesona Glow'}</p>
                  <p className="text-xs text-text-tertiary">{subscriptionTier === 'free' ? 'Gratis — fitur terbatas' : 'Aktif'}</p>
                </div>
              </div>
              {subscriptionTier === 'free' && (
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-accent-hover transition-all"
                >
                  Upgrade
                </button>
              )}
            </div>
            {subscriptionTier !== 'free' && subscriptionEnd && (
              <div className={rowClass}>
                <span className="text-sm text-text-secondary">Berlaku sampai</span>
                <span className="text-sm text-text-tertiary">{new Date(subscriptionEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Language section */}
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1 mt-6 mb-2">{t('profile.language')}</p>
          <div className="bg-surface rounded-2xl overflow-hidden">
            <div className={rowClass}>
              <span className="text-sm text-text-primary shrink-0 mr-3">{t('profile.language')}</span>
              <div className="flex gap-1">
                {([['id', 'Bahasa'], ['en', 'English']] as const).map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code as Locale)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      locale === code
                        ? 'bg-surface-hover text-text-primary font-semibold'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Account + Body Stats — 2 columns on desktop */}
          <div className={cn(isExpanded && 'lg:grid lg:grid-cols-2 lg:gap-6 lg:mt-8')}>
          {/* Account section */}
          <div>
          <p className={cn('text-xs font-medium text-text-tertiary uppercase tracking-wider px-1 mt-8 mb-2', isExpanded && 'lg:mt-0')}>{t('profile.account')}</p>
          <div className="bg-surface rounded-2xl overflow-hidden">
            {/* Display Name */}
            <div className={`${rowClass} ${dividerClass}`}>
              <label htmlFor="displayName" className="text-sm text-text-primary shrink-0 mr-4">{t('profile.displayName')}</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`${inputClass} flex-1 min-w-0`}
                placeholder={t('profile.displayNamePlaceholder')}
              />
            </div>

            {/* Username */}
            <div className={dividerClass}>
              <div className={rowClass}>
                <label htmlFor="username" className="text-sm text-text-primary shrink-0 mr-4">{t('profile.username')}</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''));
                    setErrors((prev) => ({ ...prev, username: '' }));
                  }}
                  maxLength={20}
                  className={`${inputClass} flex-1 min-w-0`}
                  placeholder={t('profile.usernamePlaceholder')}
                  autoCapitalize="none"
                />
              </div>
              {errors.username && (
                <p className="text-xs text-danger-text px-4 pb-2 -mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email (read-only, only show real emails) */}
            {user?.email && !user.email.endsWith('@pesona.io') && (
              <div className={`${rowClass} ${dividerClass}`}>
                <span className="text-sm text-text-primary shrink-0 mr-4">{t('profile.email')}</span>
                <span className="text-sm text-text-tertiary truncate">{user.email}</span>
              </div>
            )}

            {/* Calorie Target — hidden for Pesona skincare-first mode */}
            {/* Water Goal — hidden for Pesona skincare-first mode */}
          </div>

          </div>{/* end Account column */}
          {/* Body Stats section */}
          <div>
          <p className={cn('text-xs font-medium text-text-tertiary uppercase tracking-wider px-1 mt-8 mb-2', isExpanded && 'lg:mt-0')}>{t('profile.bodyStats')}</p>
          <div className="bg-surface rounded-2xl overflow-hidden">
            {/* Date of Birth */}
            <div className={dividerClass}>
              <div className={rowClass}>
                <label htmlFor="dob" className="text-sm text-text-primary shrink-0 mr-4">{t('profile.dob')}</label>
                <input
                  id="dob"
                  type="date"
                  max={getToday()}
                  value={dateOfBirth}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                  }}
                  className={`${inputClass} appearance-none`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-xs text-danger-text px-4 pb-2 -mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div className={`${rowClass} ${dividerClass}`}>
              <span className="text-sm text-text-primary shrink-0 mr-4">{t('profile.gender')}</span>
              <div className="flex gap-1">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`px-3 py-1 rounded-lg text-xs transition-all ${
                      gender === g
                        ? 'bg-surface-hover text-text-primary font-semibold'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {g === 'male' ? t('profile.male') : t('profile.female')}
                  </button>
                ))}
              </div>
            </div>

            {/* Height */}
            <div className={dividerClass}>
              <div className={rowClass}>
                <label htmlFor="height" className="text-sm text-text-primary shrink-0 mr-4">{t('profile.height')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="height"
                    type="number"
                    min="50"
                    max="300"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => {
                      setHeightCm(e.target.value);
                      setErrors((prev) => ({ ...prev, heightCm: '' }));
                    }}
                    className={`w-16 text-sm text-right bg-transparent focus:outline-none ${
                      errors.heightCm ? 'text-danger-text' : 'text-text-secondary'
                    } placeholder:text-text-tertiary`}
                    placeholder="170"
                  />
                  <span className="text-xs text-text-tertiary">cm</span>
                </div>
              </div>
              {errors.heightCm && (
                <p className="text-xs text-danger-text px-4 pb-2 -mt-1">{errors.heightCm}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <div className={rowClass}>
                <label htmlFor="weight" className="text-sm text-text-primary shrink-0 mr-4">{t('profile.weight')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="weight"
                    type="number"
                    min="10"
                    max="500"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => {
                      setWeightKg(e.target.value);
                      setErrors((prev) => ({ ...prev, weightKg: '' }));
                    }}
                    className={`w-16 text-sm text-right bg-transparent focus:outline-none ${
                      errors.weightKg ? 'text-danger-text' : 'text-text-secondary'
                    } placeholder:text-text-tertiary`}
                    placeholder="70"
                  />
                  <span className="text-xs text-text-tertiary">kg</span>
                </div>
              </div>
              {errors.weightKg && (
                <p className="text-xs text-danger-text px-4 pb-2 -mt-1">{errors.weightKg}</p>
              )}
            </div>
          </div>
          </div>{/* end Body Stats column */}
          </div>{/* end 2-column grid wrapper */}

          {/* Display section — only visible on desktop */}
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1 mt-8 mb-2">{t('profile.display')}</p>
            <div className="bg-surface rounded-2xl overflow-hidden">
              <div className={rowClass}>
                <span className="text-sm text-text-primary shrink-0 mr-3">{t('profile.desktopLayout')}</span>
                <div className="flex gap-1">
                  {(['compact', 'expanded'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDesktopLayout(mode)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all capitalize ${
                        desktopLayout === mode
                          ? 'bg-surface-hover text-text-primary font-semibold'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {mode === 'compact' ? t('profile.compact') : t('profile.expanded')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full mt-6 py-3 bg-accent hover:bg-accent-hover text-accent-fg font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? t('common.saving') : saved ? t('common.saved') : t('profile.saveChanges')}
          </button>
        </>
      )}

          {/* Privasi & Bantuan */}
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-1 mt-8 mb-2">Privasi & Bantuan</p>
          <div className="bg-surface rounded-2xl overflow-hidden">
            <button
              onClick={() => router.push('/privacy')}
              className={`${rowClass} ${dividerClass} w-full text-left`}
            >
              <span className="text-sm text-text-primary">Kebijakan Privasi</span>
              <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => router.push('/terms')}
              className={`${rowClass} ${dividerClass} w-full text-left`}
            >
              <span className="text-sm text-text-primary">Syarat & Ketentuan</span>
              <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              onClick={() => {
                if (!user) return;
                const replayTour = async () => {
                  const supabase = createClient();
                  await supabase.from('profiles').update({ tour_completed: false }).eq('id', user.id);
                  startTour();
                  router.push('/chat');
                };
                replayTour();
              }}
              className={`${rowClass} w-full text-left`}
            >
              <span className="text-sm text-text-primary">{t('tour.replayTour')}</span>
              <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

      <button
        onClick={handleSignOut}
        className="w-full mt-6 py-3 text-text-secondary hover:text-danger-text font-medium rounded-xl hover:bg-danger-surface transition-all"
      >
        {t('profile.signOut')}
      </button>

      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full mt-2 py-3 text-text-tertiary text-xs hover:text-danger-text transition-colors"
      >
        {t('profile.deleteAccount')}
      </button>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('profile.deleteAccount')}
        message={t('profile.deleteAccountMsg')}
        confirmLabel={deleting ? t('profile.deleting') : t('profile.deleteAccount')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteAccount}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
      />

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="feature_gate"
      />

      <div className="mt-10 mb-4 p-3 bg-surface rounded-xl">
        <p className="text-[10px] text-text-tertiary leading-relaxed text-center">
          Pesona adalah AI personal coach untuk wellness dan edukasi. Pesona bukan dokter, bukan dermatologist, dan tidak menggantikan konsultasi medis. Untuk kondisi kulit atau kesehatan yang serius, silakan konsultasi dengan dokter atau dermatologist.
        </p>
      </div>
      <p className="text-center text-xs text-text-tertiary mb-6">Pesona.io v1.0</p>
    </div>
  );
}
