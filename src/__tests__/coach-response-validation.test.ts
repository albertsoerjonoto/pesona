import { describe, it, expect } from 'vitest';
import {
  validateAIOutput,
  ESCALATION_TEMPLATE,
  FORBIDDEN_TERMS,
  scrubForbiddenTerms,
} from '@/lib/ai/validate';

/**
 * Tests for the coach API response validation logic.
 * This mirrors the validation in /api/coach/route.ts to ensure
 * Gemini responses are properly sanitized before DB write.
 */

function validateCoachResponse(rawText: string) {
  let parsed: {
    message: string;
    routine_suggestion?: { type: string; steps: unknown[] } | null;
    product_recommendations?: { name: string; brand: string; reason: string }[] | null;
    daily_tip?: string | null;
  };
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
    };
  } catch {
    parsed = { message: rawText, routine_suggestion: null, product_recommendations: null, daily_tip: null };
  }
  return parsed;
}

describe('Coach response validation', () => {
  it('parses valid JSON with all fields', () => {
    const input = JSON.stringify({
      message: 'Hai kak!',
      routine_suggestion: { type: 'morning', steps: [{ step_number: 1, product_name: 'Cleanser' }] },
      product_recommendations: [{ name: 'Skintific', brand: 'Skintific', reason: 'Bagus' }],
      daily_tip: 'Minum air ya!',
    });
    const result = validateCoachResponse(input);
    expect(result.message).toBe('Hai kak!');
    expect(result.routine_suggestion?.type).toBe('morning');
    expect(result.routine_suggestion?.steps).toHaveLength(1);
    expect(result.product_recommendations).toHaveLength(1);
    expect(result.daily_tip).toBe('Minum air ya!');
  });

  it('handles missing optional fields', () => {
    const input = JSON.stringify({ message: 'Hello' });
    const result = validateCoachResponse(input);
    expect(result.message).toBe('Hello');
    expect(result.routine_suggestion).toBeNull();
    expect(result.product_recommendations).toBeNull();
    expect(result.daily_tip).toBeNull();
  });

  it('falls back to raw text on invalid JSON', () => {
    const result = validateCoachResponse('not valid json at all');
    expect(result.message).toBe('not valid json at all');
    expect(result.routine_suggestion).toBeNull();
  });

  it('handles message field that is not a string', () => {
    const input = JSON.stringify({ message: 123, daily_tip: true });
    const result = validateCoachResponse(input);
    // Falls back to rawText since message isn't a string
    expect(result.message).toBe(input);
    expect(result.daily_tip).toBeNull(); // true is not a string
  });

  it('caps product recommendations at 10', () => {
    const recs = Array.from({ length: 15 }, (_, i) => ({ name: `Product ${i}`, brand: 'Brand', reason: 'Good' }));
    const input = JSON.stringify({ message: 'Here are recs', product_recommendations: recs });
    const result = validateCoachResponse(input);
    expect(result.product_recommendations).toHaveLength(10);
  });

  it('filters out malformed product recommendations', () => {
    const input = JSON.stringify({
      message: 'Recs',
      product_recommendations: [
        { name: 'Valid', brand: 'B', reason: 'R' },
        'not an object',
        null,
        { no_name: true },
        { name: 'Also valid', brand: 'B2', reason: 'R2' },
      ],
    });
    const result = validateCoachResponse(input);
    expect(result.product_recommendations).toHaveLength(2);
  });

  it('handles routine_suggestion with missing steps array', () => {
    const input = JSON.stringify({
      message: 'Here',
      routine_suggestion: { type: 'evening' },
    });
    const result = validateCoachResponse(input);
    expect(result.routine_suggestion?.type).toBe('evening');
    expect(result.routine_suggestion?.steps).toEqual([]);
  });

  it('rejects routine_suggestion without type string', () => {
    const input = JSON.stringify({
      message: 'Here',
      routine_suggestion: { steps: [] },
    });
    const result = validateCoachResponse(input);
    expect(result.routine_suggestion).toBeNull();
  });

  it('handles empty string input', () => {
    const result = validateCoachResponse('');
    expect(result.message).toBe('');
    expect(result.routine_suggestion).toBeNull();
  });
});

describe('Clinical-term validator on coach output', () => {
  // Helper that mirrors coach/route.ts: flatten all user-visible fields into
  // one string so the validator sees routine_suggestion + product_recommendations
  // + daily_tip, not just message.
  const combined = (r: {
    message: string;
    daily_tip?: string | null;
    routine_suggestion?: unknown;
    product_recommendations?: unknown;
  }) =>
    [
      r.message,
      r.daily_tip ?? '',
      JSON.stringify(r.routine_suggestion ?? ''),
      JSON.stringify(r.product_recommendations ?? ''),
    ].join(' ');

  it('catches a clinical term in the message', () => {
    const out = { message: 'Kamu punya rosacea ringan', daily_tip: null };
    expect(validateAIOutput(combined(out)).valid).toBe(false);
  });

  it('catches a clinical term hidden in daily_tip', () => {
    const out = { message: 'Semangat!', daily_tip: 'Hati-hati dengan melasma' };
    const r = validateAIOutput(combined(out));
    expect(r.valid).toBe(false);
    expect(r.violations).toContain('melasma');
  });

  it('catches a clinical term inside routine_suggestion JSON', () => {
    const out = {
      message: 'Ini routine kamu',
      routine_suggestion: { type: 'morning', steps: [{ instruction: 'for eczema' }] },
    };
    const r = validateAIOutput(combined(out));
    expect(r.valid).toBe(false);
    expect(r.violations).toContain('eczema');
  });

  it('catches a clinical term inside product_recommendations JSON', () => {
    const out = {
      message: 'Rekomendasi',
      product_recommendations: [{ name: 'X', brand: 'Y', reason: 'helps with psoriasis' }],
    };
    const r = validateAIOutput(combined(out));
    expect(r.valid).toBe(false);
    expect(r.violations).toContain('psoriasis');
  });

  it('passes when every field uses Bahasa user-friendly terms', () => {
    const out = {
      message: 'Kulit kamu ada sedikit kemerahan dan bruntusan',
      daily_tip: 'Pakai sunscreen ya',
      routine_suggestion: {
        type: 'evening',
        steps: [{ instruction: 'Niacinamide bantu flek hitam' }],
      },
      product_recommendations: [{ name: 'X', brand: 'Y', reason: 'cocok untuk kulit sensitif' }],
    };
    expect(validateAIOutput(combined(out)).valid).toBe(true);
  });
});

describe('Escalation field parser (mirrors /api/coach/route.ts)', () => {
  // This helper mirrors the `escalation` branch of the Parsed coercion in
  // coach/route.ts:callGemini. Keep it in sync if the route-side logic
  // changes — otherwise we'll silently accept malformed escalation
  // payloads and render Haloskin CTAs without real signal.
  function parseEscalation(raw: unknown): { needed: boolean; reason: string } | null {
    const e = (raw && typeof raw === 'object')
      ? (raw as { escalation?: unknown }).escalation
      : null;
    return e &&
      typeof e === 'object' &&
      (e as { needed?: unknown }).needed === true &&
      typeof (e as { reason?: unknown }).reason === 'string' &&
      ((e as { reason: string }).reason).length > 0
      ? { needed: true, reason: (e as { reason: string }).reason }
      : null;
  }

  it('accepts needed=true with non-empty reason', () => {
    const r = parseEscalation({
      escalation: { needed: true, reason: 'Kondisi ini perlu dicek dokter' },
    });
    expect(r).toEqual({ needed: true, reason: 'Kondisi ini perlu dicek dokter' });
  });

  it('rejects needed=false even with a reason', () => {
    expect(parseEscalation({ escalation: { needed: false, reason: 'whatever' } })).toBeNull();
  });

  it('rejects truthy-but-non-true needed (string, number, etc.)', () => {
    expect(parseEscalation({ escalation: { needed: 'yes', reason: 'x' } })).toBeNull();
    expect(parseEscalation({ escalation: { needed: 1, reason: 'x' } })).toBeNull();
  });

  it('rejects empty reason', () => {
    expect(parseEscalation({ escalation: { needed: true, reason: '' } })).toBeNull();
  });

  it('rejects missing reason', () => {
    expect(parseEscalation({ escalation: { needed: true } })).toBeNull();
  });

  it('rejects non-string reason', () => {
    expect(parseEscalation({ escalation: { needed: true, reason: 42 } })).toBeNull();
  });

  it('returns null when escalation is missing entirely', () => {
    expect(parseEscalation({ message: 'hi' })).toBeNull();
    expect(parseEscalation({})).toBeNull();
    expect(parseEscalation(null)).toBeNull();
  });
});

describe('Scrubber + escalation template', () => {
  it('replaces forbidden terms with "kondisi kulit"', () => {
    const out = scrubForbiddenTerms('She has rosacea and melasma.', ['rosacea', 'melasma']);
    expect(out).toBe('She has kondisi kulit and kondisi kulit.');
  });

  it('is a no-op when violations is empty', () => {
    expect(scrubForbiddenTerms('no terms here', [])).toBe('no terms here');
  });

  it('escalation template references Haloskin and price band per spec §5.5', () => {
    expect(ESCALATION_TEMPLATE).toMatch(/Haloskin/);
    expect(ESCALATION_TEMPLATE).toMatch(/Halodoc/);
    expect(ESCALATION_TEMPLATE).toMatch(/25\.000/);
    expect(ESCALATION_TEMPLATE).toMatch(/dermatologist/i);
  });

  it('escalation template itself passes the validator', () => {
    // The fallback we hand back must not itself contain forbidden terms.
    expect(validateAIOutput(ESCALATION_TEMPLATE).valid).toBe(true);
  });

  it('FORBIDDEN_TERMS is frozen-tuple-like and stable (24 entries per Build Spec §5.3)', () => {
    expect(FORBIDDEN_TERMS.length).toBe(24);
  });
});
