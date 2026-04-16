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
    const [profileRes, skinProfileRes, routinesRes, checkinsRes, historyRes, memoryRes, msgCountRes] = await Promise.all([
      supabase.from('profiles').select('display_name, gender, locale, skin_quiz_completed').eq('id', user.id).single(),
      supabase.from('skin_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
      supabase.from('ai_conversations').select('role, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('coach_memory').select('summary').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('ai_conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    const profile = profileRes.data;
    const skinProfile = skinProfileRes.data;
    const routines = routinesRes.data || [];
    const checkins = checkinsRes.data || [];
    const history = (historyRes.data || []).reverse();
    const memories = memoryRes.data || [];
    const totalMsgCount = msgCountRes.count || 0;

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

    // Add compressed memory summaries for longer context
    if (memories.length > 0) {
      context += `\nPrevious conversation summaries (oldest first):\n`;
      memories.reverse().forEach((m, i) => {
        context += `--- Memory ${i + 1} ---\n${m.summary}\n`;
      });
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

    // Parse and validate JSON response
    let parsed: {
      message: string;
      routine_suggestion?: { type: string; steps: unknown[] } | null;
      product_recommendations?: { name: string; brand: string; reason: string }[] | null;
      daily_tip?: string | null;
    };
    try {
      const raw = JSON.parse(rawText);
      // Validate shape — only accept expected fields with correct types
      parsed = {
        message: typeof raw.message === 'string' ? raw.message : rawText,
        routine_suggestion: raw.routine_suggestion && typeof raw.routine_suggestion === 'object' && typeof raw.routine_suggestion.type === 'string'
          ? { type: raw.routine_suggestion.type, steps: Array.isArray(raw.routine_suggestion.steps) ? raw.routine_suggestion.steps : [] }
          : null,
        product_recommendations: Array.isArray(raw.product_recommendations)
          ? raw.product_recommendations.filter((r: unknown) => r && typeof r === 'object' && 'name' in (r as Record<string, unknown>)).slice(0, 10)
          : null,
        daily_tip: typeof raw.daily_tip === 'string' ? raw.daily_tip : null,
      };
    } catch {
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

    // Trigger memory compression every 20 messages (fire and forget)
    if (totalMsgCount > 0 && totalMsgCount % 20 === 0) {
      compressMemory(user.id, apiKey).catch(err => {
        console.error('Memory compression failed:', err);
      });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function compressMemory(userId: string, apiKey: string) {
  const { createClient: createServerClient } = await import('@/lib/supabase/server');
  const supabase = await createServerClient();

  // Get latest memory timestamp to know where to start
  const { data: lastMemory } = await supabase
    .from('coach_memory')
    .select('covers_to')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get messages to compress (ones not yet in memory)
  let query = supabase
    .from('ai_conversations')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(20);

  if (lastMemory?.covers_to) {
    query = query.gt('created_at', lastMemory.covers_to);
  }

  const { data: messages } = await query;
  if (!messages || messages.length < 10) return; // Not enough to compress

  const ai = new GoogleGenAI({ apiKey });
  const convoText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: `Ringkas percakapan skincare berikut jadi 3-5 poin penting (bahasa Indonesia). Fokus pada: concern user, produk yang sudah direkomendasikan, routine yang disarankan, progress yang dicatat.\n\n${convoText}` }] }],
    config: { temperature: 0.3, maxOutputTokens: 512 },
  });

  const summary = response.text || '';
  if (!summary) return;

  await supabase.from('coach_memory').insert({
    user_id: userId,
    summary,
    message_count: messages.length,
    covers_from: messages[0].created_at,
    covers_to: messages[messages.length - 1].created_at,
  });
}
