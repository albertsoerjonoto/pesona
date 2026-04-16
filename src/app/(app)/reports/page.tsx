'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDesktopLayout } from '@/hooks/useDesktopLayout';
import { cn } from '@/lib/utils';

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
}

const FEELING_EMOJI: Record<string, string> = {
  great: '😍', good: '😊', okay: '😐', bad: '😕', terrible: '😢',
};

export default function ReportsPage() {
  const { user } = useAuth();
  const { isExpanded } = useDesktopLayout();
  const fetchedRef = useRef(false);

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
