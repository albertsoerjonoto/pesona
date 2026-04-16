import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const FORBIDDEN_TERMS = [
  'rosacea', 'melasma', 'eczema', 'psoriasis', 'dermatitis',
  'atopic', 'cystic acne', 'fungal acne', 'keratosis pilaris',
  'perioral', 'post-inflammatory', 'PIH', 'PIE', 'comedones',
  'hirsutism', 'alopecia', 'melanoma', 'seborrheic',
  'seboroik', 'folliculitis', 'malassezia', 'xerosis',
  'acne vulgaris', 'nodular acne',
];

const VISION_PROMPT = `Kamu menganalisis foto progress skincare user Indonesia. Return ONLY valid JSON.

ATURAN KETAT:
- JANGAN PERNAH pakai istilah klinis: rosacea, melasma, eczema, dermatitis, PIH, PIE, cystic, fungal, keratosis, psoriasis, seborrheic, acne vulgaris
- Gunakan bahasa user-friendly: breakout, bekas jerawat, kemerahan, kulit kering, tekstur kasar, flek hitam, kulit sensitif, bruntusan, pori tersumbat
- Semua string dalam Bahasa Indonesia
- Kamu wellness coach, BUKAN dokter

Return JSON ini:
{
  "overall_score": 0-100 (skor kesehatan kulit keseluruhan),
  "brightness": 0-100 (kecerahan kulit),
  "texture": 0-100 (kehalusan tekstur, higher = lebih halus),
  "hydration": 0-100 (level hidrasi, higher = lebih terhidrasi),
  "concerns_detected": ["string array — masalah kulit yang terlihat, Bahasa Indonesia, user-friendly"],
  "recommendation": "satu paragraf pendek rekomendasi dalam Bahasa Indonesia",
  "escalation_needed": false,
  "escalation_reason": null
}

Jika terlihat kondisi serius (luka tak sembuh, perubahan tahi lalat, ruam parah):
- Set escalation_needed = true
- Set escalation_reason = alasan user-friendly

INGAT: kamu BUKAN dokter. Analisis ini untuk tracking wellness saja.`;

function validateOutput(text: string): { valid: boolean; violations: string[] } {
  const lower = text.toLowerCase();
  const hits = FORBIDDEN_TERMS.filter(t => lower.includes(t));
  return hits.length ? { valid: false, violations: hits } : { valid: true, violations: [] };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoId, photoUrl } = await req.json();

    if (!photoId || !photoUrl) {
      return NextResponse.json({ error: 'photoId and photoUrl required' }, { status: 400 });
    }

    // Verify photo belongs to user
    const { data: photo } = await supabase
      .from('photo_progress')
      .select('id, user_id')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .single();

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Get user skin profile for context
    const { data: skinProfile } = await supabase
      .from('skin_profiles')
      .select('skin_type, concerns, skin_goals')
      .eq('user_id', user.id)
      .single();

    // Get previous analysis for comparison
    const { data: previousPhotos } = await supabase
      .from('photo_progress')
      .select('ai_analysis, taken_at')
      .eq('user_id', user.id)
      .not('ai_analysis', 'is', null)
      .order('taken_at', { ascending: false })
      .limit(1);

    const previousAnalysis = previousPhotos?.[0]?.ai_analysis;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Fetch image data
    let imageData: string;
    let mimeType: string;
    try {
      const imgRes = await fetch(photoUrl);
      const imgBuffer = await imgRes.arrayBuffer();
      imageData = Buffer.from(imgBuffer).toString('base64');
      mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
    } catch {
      return NextResponse.json({ error: 'Could not fetch photo' }, { status: 400 });
    }

    let contextInfo = '';
    if (skinProfile) {
      contextInfo += `User skin type: ${skinProfile.skin_type || 'unknown'}\n`;
      contextInfo += `Concerns: ${(skinProfile.concerns || []).join(', ')}\n`;
      contextInfo += `Goals: ${(skinProfile.skin_goals || []).join(', ')}\n`;
    }
    if (previousAnalysis) {
      contextInfo += `Previous analysis: ${JSON.stringify(previousAnalysis)}\n`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: imageData } },
            { text: contextInfo ? `Context:\n${contextInfo}\n\nAnalisis foto ini.` : 'Analisis foto kulit ini.' },
          ],
        },
      ],
      config: {
        systemInstruction: VISION_PROMPT,
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';

    // Validate for forbidden clinical terms
    const validation = validateOutput(rawText);

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      analysis = {
        overall_score: 50,
        brightness: 50,
        texture: 50,
        hydration: 50,
        concerns_detected: [],
        recommendation: 'Analisis tidak dapat diproses. Coba upload foto dengan pencahayaan yang lebih baik.',
        escalation_needed: false,
        escalation_reason: null,
      };
    }

    // If forbidden terms found, clean them from the response
    if (!validation.valid) {
      const cleanStr = JSON.stringify(analysis);
      let cleaned = cleanStr;
      for (const term of validation.violations) {
        const regex = new RegExp(term, 'gi');
        cleaned = cleaned.replace(regex, 'kondisi kulit');
      }
      analysis = JSON.parse(cleaned);
    }

    // Ensure all expected fields exist
    const result = {
      overall_score: typeof analysis.overall_score === 'number' ? Math.min(100, Math.max(0, analysis.overall_score)) : 50,
      brightness: typeof analysis.brightness === 'number' ? Math.min(100, Math.max(0, analysis.brightness)) : 50,
      texture: typeof analysis.texture === 'number' ? Math.min(100, Math.max(0, analysis.texture)) : 50,
      hydration: typeof analysis.hydration === 'number' ? Math.min(100, Math.max(0, analysis.hydration)) : 50,
      concerns_detected: Array.isArray(analysis.concerns_detected) ? analysis.concerns_detected : [],
      recommendation: typeof analysis.recommendation === 'string' ? analysis.recommendation : '',
      escalation_needed: analysis.escalation_needed === true,
      escalation_reason: typeof analysis.escalation_reason === 'string' ? analysis.escalation_reason : null,
    };

    // Save analysis to photo_progress
    await supabase
      .from('photo_progress')
      .update({ ai_analysis: result })
      .eq('id', photoId)
      .eq('user_id', user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze photo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
