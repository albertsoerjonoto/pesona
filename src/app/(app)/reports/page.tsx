'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { shareElementAsCard } from '@/lib/share-card';

interface WeeklyReport {
  period: { start: string; end: string };
  metrics: {
    days_checked_in: number;
    morning_routines: number;
    evening_routines: number;
    photos_uploaded: number;
    routine_completion_rate: number;
    skin_feelings: Record<string, number>;
  };
  score_changes: {
    brightness: { start: number; end: number; delta: number };
    texture: { start: number; end: number; delta: number };
    hydration: { start: number; end: number; delta: number };
    overall: { start: number; end: number; delta: number };
  } | null;
  ai_report: {
    summary?: string;
    highlights?: string[];
    areas_to_improve?: string[];
    routine_adjustment?: string | null;
    motivation?: string;
  } | null;
  photo_timeline?: Array<{
    date: string;
    overall: number;
    brightness: number;
    texture: number;
    hydration: number;
  }>;
}

const FEELING_EMOJI: Record<string, string> = {
  great: '😍', good: '😊', okay: '😐', bad: '😕', terrible: '😢',
};

export default function ReportsPage() {
  const { user } = useAuth();
  const { isExpanded } = useDesktopLayout();
  const fetchedRef = useRef(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!shareCardRef.current || sharing) return;
    setSharing(true);
    await shareElementAsCard(shareCardRef.current, {
      title: 'Laporan mingguan Pesona',
      text: 'Lihat progress kulit kamu minggu ini!',
      filename: 'pesona-weekly-report.png',
      backgroundColor: '#CE3D66',
    });
    setSharing(false);
  };

  useEffect(() => {
    if (!user || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      try {
        const res = await fetch('/api/weekly-report');
        if (!res.ok) throw new Error('Failed to load report');
        const data = await res.json();
        setReport(data);
      } catch {
        setError('Gagal memuat laporan');
      }
      setLoading(false);
    };

    load();
  }, [user]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const MetricCard = ({ label, value, subtitle, icon }: { label: string; value: string | number; subtitle?: string; icon: string }) => (
    <div className="bg-surface rounded-xl p-3 border border-border text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-xl font-bold text-text-primary mt-1">{value}</p>
      <p className="text-[10px] text-text-tertiary">{label}</p>
      {subtitle && <p className="text-[9px] text-text-muted">{subtitle}</p>}
    </div>
  );

  const DeltaIndicator = ({ label, delta, value }: { label: string; delta: number; value: number }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary">{value}/100</p>
      </div>
      <div className={cn(
        'px-2 py-0.5 rounded-full text-xs font-bold',
        delta > 0 ? 'bg-positive-surface text-positive-text' : delta < 0 ? 'bg-danger-surface text-danger-text' : 'bg-surface-secondary text-text-tertiary'
      )}>
        {delta > 0 ? '+' : ''}{delta}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
        <div className="pt-6 space-y-4">
          <div className="h-8 w-48 bg-surface-secondary rounded animate-pulse" />
          <div className="h-32 bg-surface-secondary rounded-xl animate-pulse" />
          <div className="h-48 bg-surface-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={cn('max-w-lg mx-auto px-4 pb-24 pt-6', isExpanded && 'lg:max-w-4xl lg:px-8')}>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm text-text-secondary">{error || 'Belum ada data untuk laporan'}</p>
        </div>
      </div>
    );
  }

  const m = report.metrics;

  return (
    <div className={cn('max-w-lg mx-auto px-4 pb-24', isExpanded && 'lg:max-w-4xl lg:px-8')}>
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-xl font-bold text-text-primary">Laporan Mingguan</h1>
        <p className="text-xs text-text-tertiary mt-1">
          {formatDate(report.period.start)} — {formatDate(report.period.end)}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricCard icon="📅" label="Hari Check-in" value={m.days_checked_in} subtitle="/7 hari" />
        <MetricCard icon="✅" label="Completion Rate" value={`${m.routine_completion_rate}%`} />
        <MetricCard icon="☀️" label="Routine Pagi" value={m.morning_routines} subtitle="/7 hari" />
        <MetricCard icon="🌙" label="Routine Malam" value={m.evening_routines} subtitle="/7 hari" />
      </div>

      {/* Skin Feelings */}
      {Object.keys(m.skin_feelings).length > 0 && (
        <div className="bg-surface rounded-xl p-4 border border-border mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Perasaan Kulit Minggu Ini</h3>
          <div className="flex justify-around">
            {Object.entries(m.skin_feelings).map(([feeling, count]) => (
              <div key={feeling} className="text-center">
                <span className="text-2xl">{FEELING_EMOJI[feeling] || '😐'}</span>
                <p className="text-xs font-bold text-text-primary mt-1">{count}x</p>
                <p className="text-[10px] text-text-tertiary capitalize">{feeling}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Changes */}
      {report.score_changes && (
        <div className="bg-surface rounded-xl p-4 border border-border mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Perubahan Skor</h3>
          <DeltaIndicator label="Skor Keseluruhan" delta={report.score_changes.overall.delta} value={report.score_changes.overall.end} />
          <DeltaIndicator label="Kecerahan" delta={report.score_changes.brightness.delta} value={report.score_changes.brightness.end} />
          <DeltaIndicator label="Tekstur" delta={report.score_changes.texture.delta} value={report.score_changes.texture.end} />
          <DeltaIndicator label="Hidrasi" delta={report.score_changes.hydration.delta} value={report.score_changes.hydration.end} />
        </div>
      )}

      {/* Line Chart: Photo timeline */}
      {report.photo_timeline && report.photo_timeline.length >= 2 && (
        <div className="bg-surface rounded-xl p-4 border border-border mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Tren Kulit Minggu Ini</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.photo_timeline.map(p => ({ ...p, day: formatDate(p.date) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--c-text-tertiary)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--c-text-tertiary)' }} width={24} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="overall" name="Keseluruhan" stroke="#CE3D66" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="brightness" name="Kecerahan" stroke="#F59E0B" strokeWidth={1.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="texture" name="Tekstur" stroke="#10B981" strokeWidth={1.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="hydration" name="Hidrasi" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Shareable card (hidden off-screen for export) */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 400 }}>
        <div
          ref={shareCardRef}
          className="p-6 text-white"
          style={{
            background: 'linear-gradient(135deg, #CE3D66 0%, #E0527A 50%, #F59FBE 100%)',
            fontFamily: 'sans-serif',
          }}
        >
          <div className="text-xs opacity-75 mb-1">pesona.io</div>
          <div className="text-xl font-black mb-1">Laporan Minggu Ini</div>
          <div className="text-xs opacity-90 mb-4">{formatDate(report.period.start)} — {formatDate(report.period.end)}</div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <div className="text-2xl font-bold">{m.days_checked_in}/7</div>
              <div className="text-[10px] opacity-90">Hari check-in</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2 text-center">
              <div className="text-2xl font-bold">{m.routine_completion_rate}%</div>
              <div className="text-[10px] opacity-90">Completion</div>
            </div>
          </div>

          {report.score_changes && (
            <div className="space-y-1.5 mb-4">
              {(['overall', 'brightness', 'texture', 'hydration'] as const).map(k => {
                const c = report.score_changes![k];
                const label = { overall: 'Keseluruhan', brightness: 'Kecerahan', texture: 'Tekstur', hydration: 'Hidrasi' }[k];
                return (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="opacity-90">{label}</span>
                    <span className="font-bold">
                      {c.end}
                      <span className="ml-2 opacity-75">
                        {c.delta > 0 ? '+' : ''}{c.delta}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[10px] opacity-75 text-center border-t border-white/30 pt-2">
            AI Beauty Coach kamu
          </div>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full py-3 mb-4 bg-gradient-to-r from-accent to-pink-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {sharing ? 'Membuat gambar...' : (
          <>
            <span>📷</span>
            Bagikan ke Instagram
          </>
        )}
      </button>

      {/* AI Report */}
      {report.ai_report && (
        <div className="bg-accent-surface rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-accent-text mb-2">Rangkuman dari Sona</h3>
          {report.ai_report.summary && (
            <p className="text-sm text-text-primary mb-3 whitespace-pre-line">
              {typeof report.ai_report.summary === 'string'
                ? report.ai_report.summary.replace(/\\n/g, '\n')
                : String(report.ai_report.summary)}
            </p>
          )}

          {report.ai_report.highlights && report.ai_report.highlights.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-positive-text mb-1">Yang bagus minggu ini:</p>
              <ul className="space-y-1">
                {report.ai_report.highlights.map((h, i) => (
                  <li key={i} className="text-xs text-text-secondary flex gap-1">
                    <span className="text-positive-text">+</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.ai_report.areas_to_improve && report.ai_report.areas_to_improve.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-warning-text mb-1">Bisa ditingkatkan:</p>
              <ul className="space-y-1">
                {report.ai_report.areas_to_improve.map((a, i) => (
                  <li key={i} className="text-xs text-text-secondary flex gap-1">
                    <span className="text-warning-text">-</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.ai_report.motivation && (
            <p className="text-xs text-accent-text italic mt-2">{report.ai_report.motivation}</p>
          )}
        </div>
      )}

      {/* Photos this week */}
      {m.photos_uploaded > 0 && (
        <div className="bg-surface rounded-xl p-4 border border-border mb-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            📸 {m.photos_uploaded} foto minggu ini
          </h3>
          <p className="text-xs text-text-tertiary">
            Konsisten upload foto mingguan bikin kamu bisa lihat progress nyata!
          </p>
        </div>
      )}

      <p className="text-[10px] text-text-muted text-center mt-4">
        Laporan ini dibuat oleh AI coach Sona untuk tracking wellness. Bukan diagnosis medis.
      </p>
    </div>
  );
}
