import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const REPORT_PROMPT = `Kamu adalah Sona, AI beauty coach dari Pesona.io. Buat laporan mingguan singkat berdasarkan data skincare user.

ATURAN:
- Bahasa Indonesia casual, "kamu" bukan "Anda"
- JANGAN pakai istilah klinis (rosacea, melasma, dermatitis, dll)
- Gunakan: breakout, bekas jerawat, kemerahan, kulit kering, tekstur kasar, flek hitam, bruntusan
- Supportive dan encouraging
- Fokus pada progress positif
- Max 3 paragraf pendek

Return JSON:
{
  "summary": "ringkasan mingguan dalam Bahasa Indonesia (2-3 paragraf pendek)",
  "highlights": ["hal positif minggu ini"],
  "areas_to_improve": ["area yang bisa ditingkatkan"],
  "routine_adjustment": "saran penyesuaian routine (1 kalimat)" atau null,
  "motivation": "kata-kata motivasi singkat"
}`;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    // Fetch all data for the past week in parallel
    const [photosRes, checkinsRes, routineLogsRes, skinProfileRes] = await Promise.all([
      supabase
        .from('photo_progress')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', dateStr)
        .order('taken_at', { ascending: true }),
      supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      supabase
        .from('routine_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      supabase
        .from('skin_profiles')
        .select('skin_type, concerns, skin_goals')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const photos = photosRes.data || [];
    const checkins = checkinsRes.data || [];
    const routineLogs = routineLogsRes.data || [];
    const skinProfile = skinProfileRes.data;

    // Calculate metrics
    const totalCheckins = checkins.length;
    const morningDone = checkins.filter(c => c.morning_routine_done).length;
    const eveningDone = checkins.filter(c => c.evening_routine_done).length;
    const photosCount = photos.length;

    // Extract analysis scores for comparison
    const analyzedPhotos = photos.filter(p => p.ai_analysis);
    let scoreMetrics = null;
    if (analyzedPhotos.length >= 2) {
      const first = analyzedPhotos[0].ai_analysis as Record<string, number>;
      const last = analyzedPhotos[analyzedPhotos.length - 1].ai_analysis as Record<string, number>;
      scoreMetrics = {
        brightness: { start: first.brightness || 0, end: last.brightness || 0, delta: (last.brightness || 0) - (first.brightness || 0) },
        texture: { start: first.texture || 0, end: last.texture || 0, delta: (last.texture || 0) - (first.texture || 0) },
        hydration: { start: first.hydration || 0, end: last.hydration || 0, delta: (last.hydration || 0) - (first.hydration || 0) },
        overall: { start: first.overall_score || 0, end: last.overall_score || 0, delta: (last.overall_score || 0) - (first.overall_score || 0) },
      };
    }

    // Routine completion rate
    const routineCompletionRate = routineLogs.length > 0
      ? Math.round(routineLogs.filter(l => l.completed).length / routineLogs.length * 100)
      : 0;

    // Skin feelings distribution
    const feelings = checkins.reduce((acc: Record<string, number>, c) => {
      if (c.skin_feeling) acc[c.skin_feeling] = (acc[c.skin_feeling] || 0) + 1;
      return acc;
    }, {});

    // Build data for Gemini
    const reportData = {
      skin_type: skinProfile?.skin_type || 'unknown',
      concerns: skinProfile?.concerns || [],
      goals: skinProfile?.skin_goals || [],
      week_stats: {
        days_checked_in: totalCheckins,
        morning_routines: morningDone,
        evening_routines: eveningDone,
        photos_uploaded: photosCount,
        routine_completion_rate: routineCompletionRate,
        skin_feelings: feelings,
      },
      score_changes: scoreMetrics,
    };

    // Generate AI summary
    let aiReport = null;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: `Data minggu ini:\n${JSON.stringify(reportData, null, 2)}\n\nBuat laporan mingguan.` }] }],
          config: {
            systemInstruction: REPORT_PROMPT,
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        });

        try {
          const parsed = JSON.parse(response.text || '{}');
          // Normalize: ensure all expected fields exist with correct types
          aiReport = {
            summary: typeof parsed.summary === 'string' ? parsed.summary : '',
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights.filter((h: unknown) => typeof h === 'string') : [],
            areas_to_improve: Array.isArray(parsed.areas_to_improve) ? parsed.areas_to_improve.filter((a: unknown) => typeof a === 'string') : [],
            routine_adjustment: typeof parsed.routine_adjustment === 'string' ? parsed.routine_adjustment : null,
            motivation: typeof parsed.motivation === 'string' ? parsed.motivation : '',
          };
        } catch {
          // If JSON parse fails, use the raw text as summary
          aiReport = { summary: response.text || '', highlights: [], areas_to_improve: [], routine_adjustment: null, motivation: '' };
        }
      } catch {
        // AI is optional
      }
    }

    return NextResponse.json({
      period: {
        start: sevenDaysAgo.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      metrics: {
        days_checked_in: totalCheckins,
        morning_routines: morningDone,
        evening_routines: eveningDone,
        photos_uploaded: photosCount,
        routine_completion_rate: routineCompletionRate,
        skin_feelings: feelings,
      },
      score_changes: scoreMetrics,
      ai_report: aiReport,
      checkins,
      // Daily series for line chart: score per day from analyzed photos
      photo_timeline: analyzedPhotos.map(p => ({
        date: typeof p.taken_at === 'string' ? p.taken_at.split('T')[0] : '',
        overall: (p.ai_analysis as Record<string, number> | null)?.overall_score ?? 0,
        brightness: (p.ai_analysis as Record<string, number> | null)?.brightness ?? 0,
        texture: (p.ai_analysis as Record<string, number> | null)?.texture ?? 0,
        hydration: (p.ai_analysis as Record<string, number> | null)?.hydration ?? 0,
      })),
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
