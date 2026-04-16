import { describe, it, expect } from 'vitest';

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
