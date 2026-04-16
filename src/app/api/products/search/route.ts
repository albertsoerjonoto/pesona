import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const query = (searchParams.get('q') || '').slice(0, 100);
    const category = searchParams.get('category') || '';
    const skinType = searchParams.get('skin_type') || '';
    const concern = searchParams.get('concern') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 50);
    const offset = (page - 1) * limit;

    // Validate enum inputs
    const VALID_SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal'];
    const VALID_CATEGORIES = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'exfoliator', 'mask', 'eye_cream', 'lip_care', 'spot_treatment', 'body_lotion', 'other'];

    if (skinType && !VALID_SKIN_TYPES.includes(skinType)) {
      return NextResponse.json({ error: 'Invalid skin_type' }, { status: 400 });
    }
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    let dbQuery = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Text search - fuzzy match on name, brand, key_ingredients
    if (query) {
      dbQuery = dbQuery.or(
        `name.ilike.%${query}%,brand.ilike.%${query}%,key_ingredients.cs.{${query}}`
      );
    }

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    if (skinType) {
      dbQuery = dbQuery.contains('suitable_skin_types', [skinType]);
    }

    if (concern) {
      dbQuery = dbQuery.contains('addresses_concerns', [concern]);
    }

    const { data, count, error } = await dbQuery
      .order('rating_avg', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: data || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
