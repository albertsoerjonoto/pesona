import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const SYSTEM_PROMPT = `Kamu adalah Sona, AI beauty & body coach dari Pesona.io. Kamu sahabat yang pintar, hangat, dan genuinely peduli soal penampilan dan kepercayaan diri user.

PERSONALITY:
- Bicara kayak teman dekat yang kebetulan expert soal skincare
- Bahasa: casual Indonesian, "kamu" bukan "Anda", emoji secukupnya
- Tone: supportive tapi jujur, nggak fake positivity
- Panggil user "kak" atau nama mereka
- JANGAN pernah terdengar kayak robot atau buku teks

CAPABILITIES:
- Recommend skincare routines (morning/evening) based on skin type and concerns
- Suggest Indonesian products (Skintific, Somethinc, Wardah, Glad2Glow, NPURE, Kahf, Avoskin, Emina, The Originote, Y.O.U, Azarine)
- Answer skincare questions in Bahasa Indonesia or English (match user's language)
- Give tips for tropical climate, hijab wearers, Ramadan fasting
- Track progress and motivate consistency
- Explain ingredients in simple terms (niacinamide, hyaluronic acid, retinol, etc.)

STRICT RULES — WAJIB:
1. JANGAN PERNAH gunakan istilah klinis: "rosacea", "melasma", "dermatitis", "xerosis", "seborrheic", "acne vulgaris"
2. Gunakan: "kusam", "berjerawat", "berminyak", "kering", "bruntusan", "flek hitam", "komedo", "kemerahan"
3. JANGAN PERNAH diagnosa. Say "kayaknya" (seems like), "mungkin" (maybe)
4. JANGAN PERNAH rekomendasikan obat resep
5. Jika gejala serius (cystic acne parah, ruam menyebar, luka tak sembuh): "Hmm, ini kayaknya perlu dicek sama dokter kulit ya. Aku coach, bukan dokter, jadi untuk yang ini lebih aman kalau kamu konsul ke dermatologist"
6. JANGAN PERNAH klaim produk bisa "cure" atau "treat" — gunakan "membantu", "bisa memperbaiki", "cocok untuk"
7. SELALU mulai dengan sesuatu yang positif atau encouraging
8. All product recommendations must be BPOM-registered

RESPONSE FORMAT — Return valid JSON:
{
  "message": "conversational response in user's language",
  "routine_suggestion": { "type": "morning or evening", "steps": [{ "step_number": 1, "category": "cleanser", "product_name": "...", "product_brand": "...", "instruction": "..." }] } or null,
  "product_recommendations": [{ "name": "...", "brand": "...", "reason": "..." }] or null,
  "daily_tip": "short wellness tip" or null
}

Always respond in the SAME language the user writes in. Keep "message" conversational and warm.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, image_url } = await req.json();

    if (!message?.trim() && !image_url) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Fetch user context in parallel
    const [profileRes, skinProfileRes, routinesRes, checkinsRes, historyRes] = await Promise.all([
      supabase.from('profiles').select('display_name, gender, locale, skin_quiz_completed').eq('id', user.id).single(),
      supabase.from('skin_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
      supabase.from('ai_conversations').select('role, content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
    ]);

    const profile = profileRes.data;
    const skinProfile = skinProfileRes.data;
    const routines = routinesRes.data || [];
    const checkins = checkinsRes.data || [];
    const history = (historyRes.data || []).reverse();

    // Build context
    let context = '';
    if (profile) {
      context += `User: ${profile.display_name || 'Unknown'}, Gender: ${profile.gender || 'Unknown'}, Locale: ${profile.locale || 'id'}\n`;
    }
    if (skinProfile) {
      context += `Skin Type: ${skinProfile.skin_type || 'Unknown'}\n`;
      context += `Concerns: ${(skinProfile.concerns || []).join(', ') || 'None'}\n`;
      context += `Goals: ${(skinProfile.skin_goals || []).join(', ') || 'None'}\n`;
      context += `Budget: ${skinProfile.budget_range || 'Unknown'}\n`;
      context += `Hijab: ${skinProfile.hijab_wearer ? 'Yes' : 'No'}\n`;
    }
    if (routines.length > 0) {
      context += `Active Routines:\n`;
      routines.forEach(r => {
        context += `  ${r.type}: ${JSON.stringify(r.steps)}\n`;
      });
    }
    if (checkins.length > 0) {
      context += `Recent Check-ins: ${checkins.map(c => `${c.date}: ${c.skin_feeling || 'no feeling'}`).join(', ')}\n`;
    }

    // Build message history for Gemini
    const geminiHistory = history.map(h => ({
      role: h.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: h.content }],
    }));

    // Save user message
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      role: 'user',
      content: message || '[Photo uploaded]',
      image_url: image_url || null,
    });

    // Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const userParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
    if (message?.trim()) {
      userParts.push({ text: `Context about this user:\n${context}\n\nUser message: ${message}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...geminiHistory,
        { role: 'user', parts: userParts },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // If JSON parse fails, treat raw text as message
      parsed = { message: rawText, routine_suggestion: null, product_recommendations: null, daily_tip: null };
    }

    // Save assistant message
    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      role: 'assistant',
      content: parsed.message || rawText,
      metadata: {
        routine_suggestion: parsed.routine_suggestion || null,
        product_recommendations: parsed.product_recommendations || null,
        daily_tip: parsed.daily_tip || null,
      },
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
