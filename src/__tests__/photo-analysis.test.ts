import { describe, it, expect } from 'vitest';

const FORBIDDEN_TERMS = [
  'rosacea', 'melasma', 'eczema', 'psoriasis', 'dermatitis',
  'atopic', 'cystic acne', 'fungal acne', 'keratosis pilaris',
  'perioral', 'post-inflammatory', 'PIH', 'PIE', 'comedones',
  'hirsutism', 'alopecia', 'melanoma', 'seborrheic',
  'seboroik', 'folliculitis', 'malassezia', 'xerosis',
  'acne vulgaris', 'nodular acne',
];

function validateOutput(text: string): { valid: boolean; violations: string[] } {
  const lower = text.toLowerCase();
  const hits = FORBIDDEN_TERMS.filter(t => lower.includes(t.toLowerCase()));
  return hits.length ? { valid: false, violations: hits } : { valid: true, violations: [] };
}

function normalizeAnalysis(raw: unknown) {
  const analysis = raw as Record<string, unknown>;
  return {
    overall_score: typeof analysis.overall_score === 'number' ? Math.min(100, Math.max(0, analysis.overall_score)) : 50,
    brightness: typeof analysis.brightness === 'number' ? Math.min(100, Math.max(0, analysis.brightness)) : 50,
    texture: typeof analysis.texture === 'number' ? Math.min(100, Math.max(0, analysis.texture)) : 50,
    hydration: typeof analysis.hydration === 'number' ? Math.min(100, Math.max(0, analysis.hydration)) : 50,
    concerns_detected: Array.isArray(analysis.concerns_detected) ? analysis.concerns_detected : [],
    recommendation: typeof analysis.recommendation === 'string' ? analysis.recommendation : '',
    escalation_needed: analysis.escalation_needed === true,
    escalation_reason: typeof analysis.escalation_reason === 'string' ? analysis.escalation_reason : null,
  };
}

describe('Photo analysis output validation', () => {
  it('rejects clinical terms', () => {
    const result = validateOutput('User has rosacea and melasma on cheeks');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('rosacea');
    expect(result.violations).toContain('melasma');
  });

  it('accepts user-friendly terms', () => {
    const result = validateOutput('Kulit kamu ada breakout dan flek hitam di pipi');
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('catches acne vulgaris', () => {
    const result = validateOutput('This looks like acne vulgaris');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('acne vulgaris');
  });

  it('catches PIH and PIE', () => {
    const result = validateOutput('Post-inflammatory hyperpigmentation (PIH) detected with PIE');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('post-inflammatory');
    expect(result.violations).toContain('PIH');
    expect(result.violations).toContain('PIE');
  });

  it('allows common skincare words', () => {
    const safe = 'breakout bekas jerawat kemerahan kulit kering tekstur kasar flek hitam bruntusan pori tersumbat';
    expect(validateOutput(safe).valid).toBe(true);
  });
});

describe('Analysis result normalization', () => {
  it('normalizes valid analysis', () => {
    const result = normalizeAnalysis({
      overall_score: 72,
      brightness: 65,
      texture: 58,
      hydration: 80,
      concerns_detected: ['breakout di dahi', 'kulit sedikit dull'],
      recommendation: 'Pakai niacinamide serum',
      escalation_needed: false,
      escalation_reason: null,
    });
    expect(result.overall_score).toBe(72);
    expect(result.brightness).toBe(65);
    expect(result.concerns_detected).toHaveLength(2);
    expect(result.escalation_needed).toBe(false);
  });

  it('clamps scores to 0-100', () => {
    const result = normalizeAnalysis({ overall_score: 150, brightness: -20 });
    expect(result.overall_score).toBe(100);
    expect(result.brightness).toBe(0);
  });

  it('defaults missing fields', () => {
    const result = normalizeAnalysis({});
    expect(result.overall_score).toBe(50);
    expect(result.brightness).toBe(50);
    expect(result.texture).toBe(50);
    expect(result.hydration).toBe(50);
    expect(result.concerns_detected).toEqual([]);
    expect(result.recommendation).toBe('');
    expect(result.escalation_needed).toBe(false);
    expect(result.escalation_reason).toBeNull();
  });

  it('handles string scores gracefully', () => {
    const result = normalizeAnalysis({ overall_score: 'high', brightness: '65' });
    expect(result.overall_score).toBe(50); // default, not a number
    expect(result.brightness).toBe(50); // string "65" is not typeof number
  });

  it('treats escalation as boolean strictly', () => {
    const result1 = normalizeAnalysis({ escalation_needed: true });
    expect(result1.escalation_needed).toBe(true);

    const result2 = normalizeAnalysis({ escalation_needed: 'yes' });
    expect(result2.escalation_needed).toBe(false); // only true accepted

    const result3 = normalizeAnalysis({ escalation_needed: 1 });
    expect(result3.escalation_needed).toBe(false); // not boolean true
  });
});
