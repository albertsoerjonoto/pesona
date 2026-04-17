import { describe, it, expect } from 'vitest';

// Mirror of compare-products/route.ts sanitizeClinicalTerms
const FORBIDDEN_TERMS = [
  'rosacea', 'melasma', 'eczema', 'psoriasis', 'dermatitis',
  'atopic', 'cystic acne', 'fungal acne', 'keratosis pilaris',
  'perioral', 'post-inflammatory', 'PIH', 'PIE', 'comedones',
  'hirsutism', 'alopecia', 'melanoma', 'seborrheic',
  'seboroik', 'folliculitis', 'malassezia', 'xerosis',
  'acne vulgaris', 'nodular acne',
];

function sanitizeClinicalTerms<T>(obj: T): T {
  const str = JSON.stringify(obj);
  const lower = str.toLowerCase();
  const hits = FORBIDDEN_TERMS.filter(t => lower.includes(t.toLowerCase()));
  if (hits.length === 0) return obj;
  let cleaned = str;
  for (const term of hits) {
    cleaned = cleaned.replace(new RegExp(term, 'gi'), 'kondisi kulit');
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return obj;
  }
}

describe('Compare product output sanitization', () => {
  it('returns obj unchanged when no clinical terms present', () => {
    const input = {
      summary: 'Produk A lebih cocok buat kulit berminyak',
      pros_cons: [{ name: 'A', pros: ['ringan'], cons: [] }],
    };
    const out = sanitizeClinicalTerms(input);
    expect(out).toEqual(input);
  });

  it('scrubs "rosacea" from summary', () => {
    const input = { summary: 'Bagus untuk rosacea ringan', pros_cons: [] };
    const out = sanitizeClinicalTerms(input);
    expect(out.summary).not.toContain('rosacea');
    expect(out.summary).toContain('kondisi kulit');
  });

  it('scrubs clinical terms nested in arrays', () => {
    const input = {
      summary: 'Review',
      pros_cons: [{ name: 'Product X', pros: ['cocok buat melasma'], cons: [] }],
    };
    const out = sanitizeClinicalTerms(input);
    expect(JSON.stringify(out)).not.toContain('melasma');
    expect(JSON.stringify(out)).toContain('kondisi kulit');
  });

  it('scrubs case-insensitively', () => {
    const input = { summary: 'Memperbaiki ROSACEA dan Eczema', pros_cons: [] };
    const out = sanitizeClinicalTerms(input);
    expect(out.summary.toLowerCase()).not.toContain('rosacea');
    expect(out.summary.toLowerCase()).not.toContain('eczema');
  });

  it('scrubs multi-word terms', () => {
    const input = { summary: 'Treatment untuk acne vulgaris parah', pros_cons: [] };
    const out = sanitizeClinicalTerms(input);
    expect(out.summary.toLowerCase()).not.toContain('acne vulgaris');
  });

  it('preserves non-clinical structure', () => {
    const input = {
      summary: 'Test',
      pros_cons: [
        { name: 'A', pros: ['bagus'], cons: ['mahal'] },
        { name: 'B', pros: ['murah'], cons: [] },
      ],
      recommendation: 'Pilih A',
    };
    const out = sanitizeClinicalTerms(input);
    expect(out.pros_cons).toHaveLength(2);
    expect(out.recommendation).toBe('Pilih A');
  });

  it('handles empty object', () => {
    expect(sanitizeClinicalTerms({})).toEqual({});
  });

  it('handles arrays directly', () => {
    const input = ['normal text', 'has rosacea here'];
    const out = sanitizeClinicalTerms(input);
    expect(out[0]).toBe('normal text');
    expect(out[1]).not.toContain('rosacea');
  });
});
