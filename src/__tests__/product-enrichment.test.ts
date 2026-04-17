import { describe, it, expect } from 'vitest';

// Mirror of coach/route.ts fuzzy matching logic — test the scoring without
// needing a real Supabase client.

type Rec = { name: string; brand: string; reason: string; [k: string]: unknown };
type Candidate = {
  id: string;
  name: string;
  brand: string;
  price_idr: number;
  shopee_url: string | null;
  tiktok_shop_url: string | null;
  bpom_registered: boolean | null;
  halal_certified: boolean | null;
  image_url: string | null;
};

function matchRec(rec: Rec, candidates: Candidate[]) {
  const recName = (rec.name || '').toLowerCase().trim();
  const recBrand = (rec.brand || '').toLowerCase().trim();
  if (!recName || !recBrand) return null;

  let best: Candidate | null = null;
  let bestScore = 0;
  const recTokens = new Set(recName.split(/\s+/).filter((t: string) => t.length >= 3));

  for (const c of candidates) {
    const cBrand = (c.brand || '').toLowerCase().trim();
    const cName = (c.name || '').toLowerCase().trim();
    if (cBrand !== recBrand && !cBrand.includes(recBrand) && !recBrand.includes(cBrand)) continue;

    const cTokens = new Set(cName.split(/\s+/).filter((t: string) => t.length >= 3));
    let overlap = 0;
    for (const t of recTokens) if (cTokens.has(t)) overlap++;

    const nameMatch = cName.includes(recName) || recName.includes(cName);
    const score = overlap + (nameMatch ? 2 : 0) + (cBrand === recBrand ? 1 : 0);

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return bestScore >= 1 ? best : null;
}

const SAMPLE_CANDIDATES: Candidate[] = [
  { id: 'id1', name: 'Low pH Gentle Jelly Cleanser', brand: 'Somethinc', price_idr: 89000, shopee_url: 'https://shopee.co.id/a', tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null },
  { id: 'id2', name: '5X Ceramide Barrier Moisture Gel', brand: 'Skintific', price_idr: 109000, shopee_url: 'https://shopee.co.id/b', tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null },
  { id: 'id3', name: 'Your Skin Bae Niacinamide 12% Serum', brand: 'Avoskin', price_idr: 129000, shopee_url: 'https://shopee.co.id/c', tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null },
  { id: 'id4', name: 'Hydrasoothe Sunscreen Gel SPF 45 PA++++', brand: 'Azarine', price_idr: 85000, shopee_url: 'https://shopee.co.id/d', tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null },
];

describe('Product recommendation fuzzy matching', () => {
  it('matches exact name + brand', () => {
    const rec = { name: 'Low pH Gentle Jelly Cleanser', brand: 'Somethinc', reason: 'Gentle' };
    const match = matchRec(rec, SAMPLE_CANDIDATES);
    expect(match?.id).toBe('id1');
  });

  it('matches with case differences', () => {
    const rec = { name: 'low ph gentle jelly cleanser', brand: 'SOMETHINC', reason: '' };
    const match = matchRec(rec, SAMPLE_CANDIDATES);
    expect(match?.id).toBe('id1');
  });

  it('matches with partial name overlap', () => {
    const rec = { name: 'Ceramide Barrier Gel', brand: 'Skintific', reason: '' };
    const match = matchRec(rec, SAMPLE_CANDIDATES);
    expect(match?.id).toBe('id2');
  });

  it('requires brand to match even with name overlap', () => {
    const rec = { name: 'Low pH Gentle Cleanser', brand: 'WrongBrand', reason: '' };
    const match = matchRec(rec, SAMPLE_CANDIDATES);
    expect(match).toBeNull();
  });

  it('returns null when no candidates match brand', () => {
    const rec = { name: 'Some Product', brand: 'Nonexistent', reason: '' };
    const match = matchRec(rec, SAMPLE_CANDIDATES);
    expect(match).toBeNull();
  });

  it('returns null when rec has empty name or brand', () => {
    expect(matchRec({ name: '', brand: 'Somethinc', reason: '' }, SAMPLE_CANDIDATES)).toBeNull();
    expect(matchRec({ name: 'Cleanser', brand: '', reason: '' }, SAMPLE_CANDIDATES)).toBeNull();
  });

  it('picks highest-scoring candidate when multiple match', () => {
    const candidates: Candidate[] = [
      { id: 'generic', name: 'Moisturizer', brand: 'Skintific', price_idr: 100000, shopee_url: null, tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null },
      { id: 'specific', name: 'Ceramide Barrier Moisture Gel', brand: 'Skintific', price_idr: 110000, shopee_url: null, tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null },
    ];
    const rec = { name: 'Ceramide Barrier Moisture Gel', brand: 'Skintific', reason: '' };
    const match = matchRec(rec, candidates);
    expect(match?.id).toBe('specific');
  });

  it('ignores short tokens (<3 chars) in scoring', () => {
    // Product with only "5X" overlap — too short to count
    const rec = { name: '5X Different Product', brand: 'Skintific', reason: '' };
    const match = matchRec(rec, SAMPLE_CANDIDATES);
    // Should still match via brand, but bestScore from tokens alone = 0 + brand_bonus = 1 ≥ 1 threshold
    expect(match?.id).toBe('id2'); // only Skintific product
  });

  it('matches brand with spaces/variations (ilike-style)', () => {
    const rec = { name: 'Cleanser', brand: 'SOMETHINC', reason: '' };
    const match = matchRec(rec, [{ id: 'x', name: 'Cleanser', brand: 'somethinc', price_idr: 50000, shopee_url: null, tiktok_shop_url: null, bpom_registered: true, halal_certified: true, image_url: null }]);
    expect(match?.id).toBe('x');
  });
});
