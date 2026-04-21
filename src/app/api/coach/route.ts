import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import {
  validateAIOutput,
  scrubForbiddenTerms,
  ESCALATION_TEMPLATE,
} from '@/lib/ai/validate';
import { checkRateLimit, getUserTier } from '@/lib/payments/rate-limit';
import { trackServerEvent, shutdownPostHog } from '@/lib/analytics/posthog-server';

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
1. JANGAN PERNAH gunakan istilah klinis: rosacea, melasma, eczema, psoriasis, dermatitis, atopic, cystic acne, fungal acne, keratosis pilaris, perioral, post-inflammatory, PIH, PIE, comedones, hirsutism, alopecia, melanoma, seborrheic, seboroik, folliculitis, malassezia, xerosis, acne vulgaris, nodular acne
2. Gunakan bahasa user-friendly: kusam, berjerawat, berminyak, kering, bruntusan, flek hitam, komedo, kemerahan, bekas jerawat, tekstur kasar, pori tersumbat, kulit sensitif
3. JANGAN PERNAH diagnosa. Say "kayaknya" (seems like), "mungkin" (maybe)
4. JANGAN PERNAH rekomendasikan obat resep
5. ESCALATION — MANDATORY. If the user's message matches ANY of these categories, set "escalation": { "needed": true, "reason": "<short user-friendly Bahasa string, e.g. 'kondisi kulit yang butuh pemeriksaan dokter'>" } in your JSON, set "message" to the EXACT template in §5b below, and set routine_suggestion, product_recommendations, and daily_tip to null:
   a) Deep, painful, or pus-filled breakouts; cysts; rapid worsening; OR 6+ weeks with no improvement
   b) Sudden mole changes; unusual bumps; lesions that do not heal; severe allergic reactions
   c) Direct medical questions like "Apakah aku punya [kondisi]?" OR requests for prescription dosage
   d) Pregnancy or breastfeeding + specific ingredient safety questions
   e) Known medical condition or currently on specific medications
   f) GLP-1 / Ozempic / Wegovy / Mounjaro / Saxenda questions
   g) BMI ≥ 30 with comorbidities OR any suspected eating-disorder signal
5b. EXACT ESCALATION TEMPLATE for the "message" field (copy verbatim, do not paraphrase):
   "Hmm, yang kamu ceritain kedengarannya butuh dilihat langsung sama dermatologist biar dapat pemeriksaan dan saran yang tepat. Aku bisa bantu kasih info umum dan rekomendasi produk basic, tapi untuk kondisi kayak gini, konsultasi dokter lebih aman ya. Mau aku bantu booking konsultasi online lewat Haloskin (Halodoc)? Biasanya Rp 25.000–50.000 per konsultasi dan kamu bisa dapat jawaban dari dokter beneran dalam hitungan jam."
6. JANGAN PERNAH klaim produk bisa "cure" atau "treat" — gunakan "membantu", "bisa memperbaiki", "cocok untuk"
7. SELALU mulai dengan sesuatu yang positif atau encouraging (kecuali escalation — escalation template langsung, no opener)
8. All product recommendations must be BPOM-registered

RESPONSE FORMAT — Return valid JSON:
{
  "message": "conversational response in user's language (or the EXACT escalation template if escalating)",
  "routine_suggestion": { "type": "morning or evening", "steps": [{ "step_number": 1, "category": "cleanser", "product_name": "...", "product_brand": "...", "instruction": "..." }] } or null,
  "product_recommendations": [{ "name": "...", "brand": "...", "reason": "..." }] or null,
  "daily_tip": "short wellness tip" or null,
  "escalation": { "needed": true, "reason": "short user-friendly Bahasa string" } or null
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

    // Enforce Free-tier 3 msg/day cap (Build Spec §10.1). Paid tiers return
    // `Infinity` and allowed=true in checkRateLimit, so the gate is a no-op
    // for them. On 429 the client opens PaywallModal with trigger=chat_limit.
    const tier = await getUserTier(user.id);
    const rateLimit = await checkRateLimit(user.id, tier, 'chat');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          paywall: true,
          trigger: 'chat_limit',
          tier,
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset_at: rateLimit.resetAt,
          message:
            'Kamu udah mentok limit chat harian di tier gratis. Upgrade ke Pesona Plus untuk unlimited chat ya!',
        },
        { status: 429 },
      );
    }

    // Fetch user context in parallel (acts as pre-loaded "tool results")
    const [profileRes, skinProfileRes, routinesRes, checkinsRes, historyRes, memoryRes, msgCountRes, latestPhotoRes] = await Promise.all([
      supabase.from('profiles').select('display_name, gender, locale, skin_quiz_completed').eq('id', user.id).single(),
      supabase.from('skin_profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
      supabase.from('ai_conversations').select('role, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('coach_memory').select('summary').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('ai_conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('photo_progress').select('ai_analysis, taken_at').eq('user_id', user.id).not('ai_analysis', 'is', null).order('taken_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const profile = profileRes.data;
    const skinProfile = skinProfileRes.data;
    const routines = routinesRes.data || [];
    const checkins = checkinsRes.data || [];
    const history = (historyRes.data || []).reverse();
    const memories = memoryRes.data || [];
    const totalMsgCount = msgCountRes.count || 0;
    const latestPhoto = latestPhotoRes.data;

    // Compute streak from check-ins (consecutive days with any activity)
    const streak = (() => {
      if (checkins.length === 0) return 0;
      let s = 0;
      const d = new Date();
      for (const entry of checkins) {
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const expected = `${y}-${mo}-${da}`;
        if (entry.date === expected) {
          s++;
          d.setDate(d.getDate() - 1);
        } else break;
      }
      return s;
    })();

    // Pre-fetch product candidates relevant to user concerns (replaces
    // tool-based product_lookup — context-free call is more reliable)
    let productCandidates: Array<{ name: string; brand: string; price_idr: number; category: string; halal_certified: boolean }> = [];
    if (skinProfile?.concerns && skinProfile.concerns.length > 0 && skinProfile.skin_type) {
      const { data: candidates } = await supabase
        .from('products')
        .select('name, brand, price_idr, category, halal_certified')
        .contains('suitable_skin_types', [skinProfile.skin_type])
        .overlaps('addresses_concerns', skinProfile.concerns)
        .order('rating_avg', { ascending: false, nullsFirst: false })
        .limit(12);
      productCandidates = candidates || [];
    }

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
    } else {
      context += `Active Routines: NONE — user may want Sona to generate one\n`;
    }
    context += `Streak: ${streak} days\n`;
    if (checkins.length > 0) {
      context += `Recent Check-ins (last 7): ${checkins.slice(0, 7).map(c => `${c.date}: ${c.skin_feeling || 'no feeling'}`).join(', ')}\n`;
    }
    if (latestPhoto?.ai_analysis) {
      const a = latestPhoto.ai_analysis as Record<string, unknown>;
      context += `Latest skin analysis (${latestPhoto.taken_at?.toString().split('T')[0]}): overall ${a.overall_score}, brightness ${a.brightness}, texture ${a.texture}, hydration ${a.hydration}\n`;
      if (Array.isArray(a.concerns_detected) && a.concerns_detected.length > 0) {
        context += `Concerns detected in photo: ${a.concerns_detected.join(', ')}\n`;
      }
    }
    if (productCandidates.length > 0) {
      context += `\nAvailable products for user's skin type + concerns (use these names in product_recommendations):\n`;
      productCandidates.forEach(p => {
        context += `  - ${p.name} (${p.brand}) — Rp ${p.price_idr.toLocaleString('id-ID')}${p.halal_certified ? ' [halal]' : ''}\n`;
      });
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

    // Parsed response shape — also used by the retry loop
    type ProductRec = {
      name: string;
      brand: string;
      reason: string;
      // Enriched fields (added from products table if match found):
      product_id?: string;
      price_idr?: number;
      shopee_url?: string;
      tiktok_shop_url?: string;
      bpom_registered?: boolean;
      halal_certified?: boolean;
      image_url?: string;
    };
    type Parsed = {
      message: string;
      routine_suggestion?: { type: string; steps: unknown[] } | null;
      product_recommendations?: ProductRec[] | null;
      daily_tip?: string | null;
      escalation?: { needed: boolean; reason: string } | null;
    };

    const callGemini = async (systemAppend?: string): Promise<{ rawText: string; parsed: Parsed }> => {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...geminiHistory,
          { role: 'user', parts: userParts },
        ],
        config: {
          systemInstruction: systemAppend
            ? `${SYSTEM_PROMPT}\n\n${systemAppend}`
            : SYSTEM_PROMPT,
          temperature: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });
      const rawText = resp.text || '';
      let parsed: Parsed;
      try {
        const raw = JSON.parse(rawText);
        parsed = {
          message: typeof raw.message === 'string' ? raw.message : rawText,
          routine_suggestion: raw.routine_suggestion && typeof raw.routine_suggestion === 'object' && typeof raw.routine_suggestion.type === 'string'
            ? { type: raw.routine_suggestion.type, steps: Array.isArray(raw.routine_suggestion.steps) ? raw.routine_suggestion.steps : [] }
            : null,
          product_recommendations: Array.isArray(raw.product_recommendations)
            ? raw.product_recommendations.filter((r: unknown) => r && typeof r === 'object' && 'name' in (r as Record<string, unknown>)).slice(0, 10)
            : null,
          daily_tip: typeof raw.daily_tip === 'string' ? raw.daily_tip : null,
          // Trust Gemini's proactive escalation only if the model set both
          // `needed: true` and a non-empty reason — anything else collapses
          // to null so the chat UI never renders a CTA without real signal.
          escalation:
            raw.escalation &&
            typeof raw.escalation === 'object' &&
            raw.escalation.needed === true &&
            typeof raw.escalation.reason === 'string' &&
            raw.escalation.reason.length > 0
              ? { needed: true, reason: raw.escalation.reason }
              : null,
        };
      } catch {
        parsed = { message: rawText, routine_suggestion: null, product_recommendations: null, daily_tip: null };
      }
      return { rawText, parsed };
    };

    // First call
    let { rawText, parsed } = await callGemini();

    // Belt-and-suspenders clinical-term check (Build Spec §5.3 / §7.3):
    // validate every user-visible field, retry once with a stricter prompt,
    // and fall back to the escalation template on second failure.
    const combinedText = (text: Parsed) =>
      [
        text.message,
        text.daily_tip ?? '',
        JSON.stringify(text.routine_suggestion ?? ''),
        JSON.stringify(text.product_recommendations ?? ''),
      ].join(' ');

    let validation = validateAIOutput(combinedText(parsed));
    if (!validation.valid) {
      const retry = await callGemini(
        `STRICT: do not use ANY of the following clinical terms in your response: ${validation.violations.join(', ')}. Use user-friendly Bahasa Indonesia alternatives (e.g. "kemerahan", "flek hitam", "bruntusan", "kulit kering").`,
      );
      validation = validateAIOutput(combinedText(retry.parsed));
      if (validation.valid) {
        rawText = retry.rawText;
        parsed = retry.parsed;
      } else {
        // Both attempts tripped the validator — fall back to the spec §5.5
        // escalation template and drop any routine/product output since it
        // was generated under the tainted run.
        parsed = {
          message: ESCALATION_TEMPLATE,
          routine_suggestion: null,
          product_recommendations: null,
          daily_tip: null,
          escalation: {
            needed: true,
            reason: `clinical-term-fallback: ${validation.violations.join(', ')}`,
          },
        };
        rawText = JSON.stringify(parsed);
      }
    }

    // Enrich product_recommendations with data from products table
    if (parsed.product_recommendations && parsed.product_recommendations.length > 0) {
      const enriched = await enrichProductRecs(supabase, parsed.product_recommendations);
      parsed.product_recommendations = enriched;
    }

    // Fire PostHog event whenever we're about to tell the user to see a
    // dermatologist (either from Gemini proactively catching a §5.4 trigger
    // or from the validator falling back to ESCALATION_TEMPLATE). Tracks
    // the `escalation_triggered` event already declared in events.ts.
    if (parsed.escalation?.needed) {
      trackServerEvent(user.id, 'escalation_triggered', {
        reason: parsed.escalation.reason,
      });
      // Don't await — trackServerEvent is fire-and-forget; shutdownPostHog
      // only matters in cron/webhook paths where the function will exit.
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
        escalation: parsed.escalation || null,
      },
    });

    // Trigger memory compression every 20 messages (fire and forget)
    if (totalMsgCount > 0 && totalMsgCount % 20 === 0) {
      compressMemory(user.id, apiKey).catch(err => {
        console.error('Memory compression failed:', err);
      });
    }

    // If we fired an escalation event, flush PostHog before the response
    // closes so the event isn't dropped when the lambda/server goes cold.
    if (parsed.escalation?.needed) {
      await shutdownPostHog();
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Coach API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Enrich AI-generated product recommendations with real data from the
 * products table via fuzzy matching on name + brand.
 */
async function enrichProductRecs(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recs: Array<{ name: string; brand: string; reason: string; [k: string]: unknown }>
) {
  if (recs.length === 0) return recs;

  // Build OR filter: match by brand (ilike) for all recs in one query
  const brands = Array.from(new Set(recs.map(r => (r.brand || '').trim()).filter(Boolean)));
  if (brands.length === 0) return recs;

  const { data: candidates } = await supabase
    .from('products')
    .select('id, name, brand, price_idr, shopee_url, tiktok_shop_url, bpom_registered, halal_certified, image_url')
    .or(brands.map(b => `brand.ilike.%${b.replace(/[,(){}\\]/g, '')}%`).join(','))
    .limit(200);

  if (!candidates || candidates.length === 0) return recs;

  // For each rec, find best match in candidates
  return recs.map(rec => {
    const recName = (rec.name || '').toLowerCase().trim();
    const recBrand = (rec.brand || '').toLowerCase().trim();
    if (!recName || !recBrand) return rec;

    // Score each candidate: exact brand match + name token overlap
    let best: (typeof candidates)[number] | null = null;
    let bestScore = 0;

    const recTokens = new Set(recName.split(/\s+/).filter((t: string) => t.length >= 3));

    for (const c of candidates) {
      const cBrand = (c.brand || '').toLowerCase().trim();
      const cName = (c.name || '').toLowerCase().trim();
      if (cBrand !== recBrand && !cBrand.includes(recBrand) && !recBrand.includes(cBrand)) continue;

      // Token overlap score
      const cTokens = new Set(cName.split(/\s+/).filter((t: string) => t.length >= 3));
      let overlap = 0;
      for (const t of recTokens) if (cTokens.has(t)) overlap++;

      // Bonus for exact name substring match
      const nameMatch = cName.includes(recName) || recName.includes(cName);
      const score = overlap + (nameMatch ? 2 : 0) + (cBrand === recBrand ? 1 : 0);

      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    if (!best || bestScore < 1) return rec;

    // Enrich with real product data
    return {
      ...rec,
      product_id: best.id,
      price_idr: best.price_idr ?? undefined,
      shopee_url: best.shopee_url ?? undefined,
      tiktok_shop_url: best.tiktok_shop_url ?? undefined,
      bpom_registered: best.bpom_registered ?? undefined,
      halal_certified: best.halal_certified ?? undefined,
      image_url: best.image_url ?? undefined,
    };
  });
}

async function compressMemory(userId: string, apiKey: string) {
  // Use service role client — fire-and-forget runs AFTER the response is
  // sent, so request-scoped cookies() from @/lib/supabase/server would fail.
  // Service role bypasses RLS, so we MUST filter by user_id explicitly.
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('compressMemory: missing Supabase service role config');
    return;
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // Get latest memory timestamp to know where to start
  const { data: lastMemory } = await supabase
    .from('coach_memory')
    .select('covers_to')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const rawSummary = response.text || '';
  if (!rawSummary) return;

  // Defense-in-depth (Build Spec §5.3): the summary gets injected into
  // future system prompts as context, so scrub any clinical terms before
  // persisting — otherwise a Gemini slip here silently biases every
  // subsequent coach response.
  const validation = validateAIOutput(rawSummary);
  const summary = validation.valid
    ? rawSummary
    : scrubForbiddenTerms(rawSummary, validation.violations);

  await supabase.from('coach_memory').insert({
    user_id: userId,
    summary,
    message_count: messages.length,
    covers_from: messages[0].created_at,
    covers_to: messages[messages.length - 1].created_at,
  });
}
