'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { useToast } from '@/components/Toast';
import { cn } from '@/lib/utils';
import type { PhotoProgress } from '@/lib/types';

export default function ProgressPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();
  const { showToast, ToastContainer } = useToast();
  const fetchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<PhotoProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoProgress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('photo_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(50);

      if (data) setPhotos(data as unknown as PhotoProgress[]);
      setLoaded(true);
    };

    load();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Compress if needed
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Foto terlalu besar. Max 2MB.');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('skin-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        // If bucket doesn't exist yet, show helpful message
        showToast('error', 'Upload gagal. Coba lagi nanti.');
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('skin-photos')
        .getPublicUrl(path);

      const photoUrl = urlData.publicUrl;

      const { data: photoData } = await supabase
        .from('photo_progress')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          photo_type: 'skin_face_front',
          taken_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (photoData) {
        setPhotos(prev => [photoData as unknown as PhotoProgress, ...prev]);
        showToast('success', 'Foto berhasil diupload! 📸');

        // Mark daily check-in photo
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('daily_checkins').upsert({
          user_id: user.id,
          date: today,
          photo_uploaded: true,
        }, { onConflict: 'user_id,date' });
      }
    } catch {
      showToast('error', 'Upload gagal');
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {ToastContainer}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">{t('progress.title')}</h1>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {uploading ? '...' : '📸 ' + t('progress.upload')}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleUpload}
        className="hidden"
        aria-label="Upload photo"
      />

      {/* Stats */}
      {photos.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-surface rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-accent-text">{photos.length}</p>
            <p className="text-[10px] text-text-tertiary">{t('progress.totalPhotos')}</p>
          </div>
          <div className="flex-1 bg-surface rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-positive-text">
              {Math.floor(photos.length / 7) || 0}
            </p>
            <p className="text-[10px] text-text-tertiary">{t('progress.weekStreak')}</p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {loaded && photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-surface-secondary rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">{t('progress.noPhotos')}</p>
          <p className="text-xs text-text-tertiary mb-4">{t('progress.takeFirst')}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-accent text-accent-fg font-medium rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] text-sm"
          >
            📸 {t('progress.upload')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square rounded-xl overflow-hidden bg-surface-secondary relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.photo_url}
                alt="Progress photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                <p className="text-[9px] text-white/90 font-medium">{formatDate(photo.taken_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-overlay-dialog flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-bg rounded-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto.photo_url}
              alt="Progress photo"
              className="w-full rounded-t-2xl"
            />
            <div className="p-4">
              <p className="text-sm font-medium text-text-primary">{formatDate(selectedPhoto.taken_at)}</p>
              {selectedPhoto.notes && (
                <p className="text-xs text-text-secondary mt-1">{selectedPhoto.notes}</p>
              )}
              {selectedPhoto.ai_analysis && (
                <div className="mt-3 bg-accent-surface rounded-xl p-3">
                  <p className="text-xs font-medium text-accent-text mb-1">{t('progress.aiAnalysis')}</p>
                  <p className="text-xs text-text-secondary">
                    {typeof selectedPhoto.ai_analysis === 'object' && 'summary' in selectedPhoto.ai_analysis
                      ? String(selectedPhoto.ai_analysis.summary)
                      : JSON.stringify(selectedPhoto.ai_analysis)}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-2 italic">{t('progress.disclaimer')}</p>
                </div>
              )}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-full mt-3 py-2.5 bg-surface text-text-primary font-medium rounded-xl border border-border text-sm"
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
