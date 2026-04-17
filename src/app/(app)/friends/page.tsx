'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/lib/i18n';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { useToast } from '@/components/Toast';
import PhotoUpload from '@/components/PhotoUpload';
import { cn } from '@/lib/utils';
import { shareElementAsCard } from '@/lib/share-card';
import type { PhotoProgress } from '@/lib/types';

interface AnalysisResult {
  overall_score?: number;
  brightness?: number;
  texture?: number;
  hydration?: number;
  concerns_detected?: string[];
  recommendation?: string;
  summary?: string;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { isExpanded } = useDesktopLayout();
  const { showToast, ToastContainer } = useToast();
  const fetchedRef = useRef(false);

  const [photos, setPhotos] = useState<PhotoProgress[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoProgress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);
    const outcome = await shareElementAsCard(shareCardRef.current, {
      title: 'Progress kulit aku — Pesona',
      text: 'Lihat progress kulit aku minggu ini!',
      filename: 'pesona-progress.png',
      backgroundColor: '#CE3D66',
      pixelRatio: 3,
    });
    if (outcome === 'failed') {
      showToast('error', 'Gagal buat gambar — coba lagi ya');
    } else if (outcome === 'downloaded') {
      showToast('success', 'Gambar tersimpan 📸');
    }
    setSharing(false);
  };

  useEffect(() => {
    if (!user || fetchedRef.current) return;
    fetchedRef.current = true;

    let isMounted = true;
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('photo_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(50);

      if (!isMounted) return;
      if (data) setPhotos(data as unknown as PhotoProgress[]);
      setLoaded(true);
    };

    load();
    return () => { isMounted = false; };
  }, [user]);

  const handleUploadComplete = async (photoUrl: string, photoId: string) => {
    showToast('success', t('progress.uploadSuccess') + ' 📸');

    // Fetch the newly inserted photo
    const supabase = createClient();
    const { data } = await supabase
      .from('photo_progress')
      .select('*')
      .eq('id', photoId)
      .single();

    if (data) {
      const newPhoto = data as unknown as PhotoProgress;
      setPhotos(prev => [newPhoto, ...prev]);

      // Trigger AI analysis in background
      triggerAnalysis(photoId, photoUrl);
    }
  };

  const triggerAnalysis = async (photoId: string, photoUrl: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, photoUrl }),
      });

      if (res.ok) {
        const analysis = await res.json();
        // Update local state with analysis
        setPhotos(prev =>
          prev.map(p =>
            p.id === photoId ? { ...p, ai_analysis: analysis } : p
          )
        );
        if (selectedPhoto?.id === photoId) {
          setSelectedPhoto(prev => prev ? { ...prev, ai_analysis: analysis } : null);
        }
        showToast('success', 'Analisis kulit selesai! ✨');
      }
    } catch {
      // Analysis is optional, don't show error
    }
    setAnalyzing(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const parseAnalysis = (analysis: unknown): AnalysisResult | null => {
    if (!analysis || typeof analysis !== 'object') return null;
    return analysis as AnalysisResult;
  };

  const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-text-primary w-8 text-right">{value}</span>
    </div>
  );

  return (
    <main className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {ToastContainer}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg pb-4 -mx-4 px-4 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">{t('progress.title')}</h1>
          {user && (
            <PhotoUpload
              userId={user.id}
              compact
              onUploadComplete={handleUploadComplete}
              onError={(msg) => showToast('error', msg)}
            />
          )}
        </div>
        {analyzing && (
          <div className="mt-2 flex items-center gap-2 text-xs text-accent-text">
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Menganalisis foto...
          </div>
        )}
      </div>

      {/* Stats */}
      {photos.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-surface rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-accent-text">{photos.length}</p>
            <p className="text-[10px] text-text-tertiary">{t('progress.totalPhotos')}</p>
          </div>
          <div className="flex-1 bg-surface rounded-xl p-3 border border-border text-center">
            <p className="text-lg font-bold text-positive-text">
              {photos.filter(p => p.ai_analysis).length}
            </p>
            <p className="text-[10px] text-text-tertiary">Sudah dianalisis</p>
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
          {user && (
            <PhotoUpload
              userId={user.id}
              onUploadComplete={handleUploadComplete}
              onError={(msg) => showToast('error', msg)}
              className="w-full max-w-xs"
            />
          )}
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
              {photo.ai_analysis && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white">AI</span>
                </div>
              )}
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

              {/* AI Analysis Card */}
              {(() => {
                const analysis = parseAnalysis(selectedPhoto.ai_analysis);
                if (!analysis) return null;
                return (
                  <div className="mt-3 bg-accent-surface rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-accent-text">Analisis AI</p>
                      {analysis.overall_score !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-accent-text">{analysis.overall_score}</span>
                          <span className="text-xs text-text-tertiary">/100</span>
                        </div>
                      )}
                    </div>

                    {/* Score bars */}
                    <div className="space-y-2">
                      {analysis.brightness !== undefined && (
                        <ScoreBar label="Kecerahan" value={analysis.brightness} color="bg-amber-400" />
                      )}
                      {analysis.texture !== undefined && (
                        <ScoreBar label="Tekstur" value={analysis.texture} color="bg-emerald-400" />
                      )}
                      {analysis.hydration !== undefined && (
                        <ScoreBar label="Hidrasi" value={analysis.hydration} color="bg-blue-400" />
                      )}
                    </div>

                    {/* Concerns */}
                    {analysis.concerns_detected && analysis.concerns_detected.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-text-secondary mb-1">Yang perlu diperhatikan:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.concerns_detected.map((c, i) => (
                            <span key={i} className="text-[10px] bg-warning-surface text-warning-text px-2 py-0.5 rounded-full">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {analysis.recommendation && (
                      <p className="text-xs text-text-secondary">{analysis.recommendation}</p>
                    )}

                    <p className="text-[10px] text-text-tertiary italic">{t('progress.disclaimer')}</p>
                  </div>
                );
              })()}

              {/* Analyze button if no analysis yet */}
              {!selectedPhoto.ai_analysis && user && (
                <button
                  onClick={() => triggerAnalysis(selectedPhoto.id, selectedPhoto.photo_url)}
                  disabled={analyzing}
                  className="w-full mt-3 py-2.5 bg-accent text-accent-fg font-medium rounded-xl text-sm hover:bg-accent-hover transition-all disabled:opacity-50"
                >
                  {analyzing ? 'Menganalisis...' : '✨ Analisis dengan AI'}
                </button>
              )}

              {/* Share button — only offered once the photo has an analysis
                  so the card has something meaningful on it. */}
              {selectedPhoto.ai_analysis && (
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-accent to-pink-400 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sharing ? (
                    'Membuat gambar...'
                  ) : (
                    <>
                      <span>📷</span>
                      Bagikan Progress
                    </>
                  )}
                </button>
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

      {/* Off-screen share-card composed from the selected photo + analysis.
          Fixed + offscreen so html-to-image captures the real rendered DOM
          but users never see it; same pattern as /reports. */}
      {selectedPhoto && (() => {
        const analysis = parseAnalysis(selectedPhoto.ai_analysis);
        if (!analysis) return null;
        return (
          <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 400 }}>
            <div
              ref={shareCardRef}
              className="text-white"
              style={{
                background: 'linear-gradient(135deg, #CE3D66 0%, #E0527A 50%, #F59FBE 100%)',
                fontFamily: 'sans-serif',
                padding: '24px',
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>pesona.io</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>
                Skin progress update
              </div>
              <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 16 }}>
                {formatDate(selectedPhoto.taken_at)}
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.photo_url}
                alt=""
                style={{
                  width: '100%',
                  borderRadius: 12,
                  marginBottom: 16,
                  aspectRatio: '1',
                  objectFit: 'cover',
                }}
                crossOrigin="anonymous"
              />

              {analysis.overall_score !== undefined && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.9 }}>Skor keseluruhan</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>
                    {analysis.overall_score}
                    <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 4 }}>/100</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {analysis.brightness !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ opacity: 0.9 }}>Kecerahan</span>
                    <span style={{ fontWeight: 700 }}>{analysis.brightness}</span>
                  </div>
                )}
                {analysis.texture !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ opacity: 0.9 }}>Tekstur</span>
                    <span style={{ fontWeight: 700 }}>{analysis.texture}</span>
                  </div>
                )}
                {analysis.hydration !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ opacity: 0.9 }}>Hidrasi</span>
                    <span style={{ fontWeight: 700 }}>{analysis.hydration}</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: 10,
                  opacity: 0.75,
                  textAlign: 'center',
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  paddingTop: 8,
                }}
              >
                AI Beauty Coach kamu
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
