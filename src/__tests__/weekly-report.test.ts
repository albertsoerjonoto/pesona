import { describe, it, expect } from 'vitest';

interface WeeklyMetrics {
  days_checked_in: number;
  morning_routines: number;
  evening_routines: number;
  photos_uploaded: number;
  routine_completion_rate: number;
  skin_feelings: Record<string, number>;
}

interface ScoreChange {
  start: number;
  end: number;
  delta: number;
}

function calculateMetrics(checkins: { morning_routine_done: boolean; evening_routine_done: boolean; skin_feeling?: string }[],
  routineLogs: { completed: boolean }[],
  photos: { ai_analysis?: Record<string, number> }[]
): { metrics: WeeklyMetrics; scoreChanges: Record<string, ScoreChange> | null } {
  const totalCheckins = checkins.length;
  const morningDone = checkins.filter(c => c.morning_routine_done).length;
  const eveningDone = checkins.filter(c => c.evening_routine_done).length;
  const routineCompletionRate = routineLogs.length > 0
    ? Math.round(routineLogs.filter(l => l.completed).length / routineLogs.length * 100)
    : 0;

  const feelings = checkins.reduce((acc: Record<string, number>, c) => {
    if (c.skin_feeling) acc[c.skin_feeling] = (acc[c.skin_feeling] || 0) + 1;
    return acc;
  }, {});

  const analyzedPhotos = photos.filter(p => p.ai_analysis);
  let scoreChanges: Record<string, ScoreChange> | null = null;
  if (analyzedPhotos.length >= 2) {
    const first = analyzedPhotos[0].ai_analysis!;
    const last = analyzedPhotos[analyzedPhotos.length - 1].ai_analysis!;
    scoreChanges = {
      overall: { start: first.overall_score || 0, end: last.overall_score || 0, delta: (last.overall_score || 0) - (first.overall_score || 0) },
      brightness: { start: first.brightness || 0, end: last.brightness || 0, delta: (last.brightness || 0) - (first.brightness || 0) },
    };
  }

  return {
    metrics: {
      days_checked_in: totalCheckins,
      morning_routines: morningDone,
      evening_routines: eveningDone,
      photos_uploaded: photos.length,
      routine_completion_rate: routineCompletionRate,
      skin_feelings: feelings,
    },
    scoreChanges,
  };
}

describe('Weekly report metrics', () => {
  it('calculates basic metrics', () => {
    const { metrics } = calculateMetrics(
      [
        { morning_routine_done: true, evening_routine_done: true, skin_feeling: 'great' },
        { morning_routine_done: true, evening_routine_done: false, skin_feeling: 'good' },
        { morning_routine_done: false, evening_routine_done: true, skin_feeling: 'okay' },
      ],
      [{ completed: true }, { completed: true }, { completed: false }],
      []
    );

    expect(metrics.days_checked_in).toBe(3);
    expect(metrics.morning_routines).toBe(2);
    expect(metrics.evening_routines).toBe(2);
    expect(metrics.routine_completion_rate).toBe(67);
    expect(metrics.skin_feelings).toEqual({ great: 1, good: 1, okay: 1 });
  });

  it('handles empty data', () => {
    const { metrics } = calculateMetrics([], [], []);
    expect(metrics.days_checked_in).toBe(0);
    expect(metrics.morning_routines).toBe(0);
    expect(metrics.routine_completion_rate).toBe(0);
    expect(metrics.skin_feelings).toEqual({});
  });

  it('calculates score deltas with 2+ photos', () => {
    const { scoreChanges } = calculateMetrics([], [], [
      { ai_analysis: { overall_score: 50, brightness: 40 } },
      { ai_analysis: { overall_score: 65, brightness: 55 } },
    ]);

    expect(scoreChanges).not.toBeNull();
    expect(scoreChanges!.overall.delta).toBe(15);
    expect(scoreChanges!.brightness.delta).toBe(15);
  });

  it('returns null score changes with < 2 analyzed photos', () => {
    const { scoreChanges } = calculateMetrics([], [], [
      { ai_analysis: { overall_score: 50, brightness: 40 } },
    ]);
    expect(scoreChanges).toBeNull();
  });

  it('handles negative deltas', () => {
    const { scoreChanges } = calculateMetrics([], [], [
      { ai_analysis: { overall_score: 70, brightness: 60 } },
      { ai_analysis: { overall_score: 55, brightness: 50 } },
    ]);
    expect(scoreChanges!.overall.delta).toBe(-15);
    expect(scoreChanges!.brightness.delta).toBe(-10);
  });

  it('counts skin feelings correctly', () => {
    const { metrics } = calculateMetrics(
      [
        { morning_routine_done: false, evening_routine_done: false, skin_feeling: 'great' },
        { morning_routine_done: false, evening_routine_done: false, skin_feeling: 'great' },
        { morning_routine_done: false, evening_routine_done: false, skin_feeling: 'bad' },
      ],
      [], []
    );
    expect(metrics.skin_feelings).toEqual({ great: 2, bad: 1 });
  });
});
