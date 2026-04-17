import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const COMPARE_PROMPT = `Kamu Sona, AI beauty coach Pesona. Bandingkan 2-3 produk skincare dalam Bahasa Indonesia casual.

ATURAN:
- JANGAN pakai istilah klinis (rosacea, melasma, dermatitis, dll)
- Pakai: breakout, bekas jerawat, kemerahan, kulit kering, tekstur kasar, flek hitam, bruntusan
- Jangan klaim "akan menyembuhkan" — pakai "bisa bantu", "cocok untuk"
- Objektif tapi hangat, seperti teman yang kasih saran jujur

Return JSON:
{
  "summary": "2-3 kalimat ringkasan perbandingan",
  "best_for": {
    "<product_name>": "kondisi/situasi di mana produk ini paling cocok"
  },
  "pros_cons": [
    {
      "name": "<product_name>",
      "pros": ["kelebihan 1", "kelebihan 2"],
      "cons": ["kekurangan 1"]
    }
  ],
  "recommendation": "saran akhir: mana yang paling cocok buat user berdasarkan profile mereka"
}`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productIds } = await req.json();
    if (!Array.isArray(productIds) || productIds.length < 2 || productIds.length > 3) {
      return NextResponse.json({ error: 'Pick 2-3 products to compare' }, { status: 400 });
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!productIds.every((id: unknown) => typeof id === 'string' && uuidRegex.test(id))) {
      return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
    }

    const [productsRes, skinProfileRes] = await Promise.all([
      supabase.from('products').select('*').in('id', productIds),
      supabase.from('skin_profiles').select('skin_type, concerns, skin_goals').eq('user_id', user.id).maybeSingle(),
    ]);

    const products = productsRes.data || [];
    if (products.length < 2) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    const skinProfile = skinProfileRes.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const productSummaries = products.map(p => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price_idr: p.price_idr,
      suitable_skin_types: p.suitable_skin_types,
      addresses_concerns: p.addresses_concerns,
      key_ingredients: p.key_ingredients,
      halal_certified: p.halal_certified,
      bpom_registered: p.bpom_registered,
      description: p.description,
    }));

    const userContext = skinProfile
      ? `User: skin_type=${skinProfile.skin_type}, concerns=${(skinProfile.concerns || []).join(',')}, goals=${(skinProfile.skin_goals || []).join(',')}`
      : 'User: unknown skin profile';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `${userContext}\n\nProduk yang dibandingkan:\n${JSON.stringify(productSummaries, null, 2)}\n\nBandingkan produk-produk di atas.`,
        }],
      }],
      config: {
        systemInstruction: COMPARE_PROMPT,
        temperature: 0.5,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });

    let result;
    try {
      result = JSON.parse(response.text || '{}');
    } catch {
      result = { summary: response.text || 'Analisis tidak tersedia', best_for: {}, pros_cons: [], recommendation: '' };
    }

    // Normalize shape
    const normalized = {
      summary: typeof result.summary === 'string' ? result.summary : '',
      best_for: typeof result.best_for === 'object' && result.best_for !== null ? result.best_for : {},
      pros_cons: Array.isArray(result.pros_cons) ? result.pros_cons.filter((pc: unknown) => pc && typeof pc === 'object') : [],
      recommendation: typeof result.recommendation === 'string' ? result.recommendation : '',
      products: productSummaries,
    };

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Compare products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
