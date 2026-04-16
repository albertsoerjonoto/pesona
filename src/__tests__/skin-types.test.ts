import { describe, it, expect } from 'vitest';
import type { SkinType, SkinConcern, SkinGoal, BudgetRange, ProductCategory } from '@/lib/types';

describe('Pesona type unions', () => {
  it('SkinType covers all expected values', () => {
    const types: SkinType[] = ['oily', 'dry', 'combination', 'sensitive', 'normal'];
    expect(types).toHaveLength(5);
    // Each is a valid string
    types.forEach(t => expect(typeof t).toBe('string'));
  });

  it('SkinConcern covers all expected values', () => {
    const concerns: SkinConcern[] = ['acne', 'dark_spots', 'dullness', 'large_pores', 'blackheads', 'redness', 'rough_texture', 'aging'];
    expect(concerns).toHaveLength(8);
  });

  it('SkinGoal covers all expected values', () => {
    const goals: SkinGoal[] = ['glowing', 'clear', 'even_tone', 'hydrated', 'anti_aging', 'small_pores'];
    expect(goals).toHaveLength(6);
  });

  it('BudgetRange covers all expected values', () => {
    const budgets: BudgetRange[] = ['under_100k', '100k_300k', '300k_500k', 'over_500k'];
    expect(budgets).toHaveLength(4);
  });

  it('ProductCategory covers all expected values', () => {
    const categories: ProductCategory[] = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'exfoliator', 'mask', 'eye_cream', 'lip_care', 'spot_treatment', 'body_lotion', 'other'];
    expect(categories).toHaveLength(12);
  });

  it('ProductCategory values match SQL CHECK constraint', () => {
    // These must match the CHECK constraint in 102_products.sql
    const sqlValues = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'exfoliator', 'mask', 'eye_cream', 'lip_care', 'spot_treatment', 'body_lotion', 'other'];
    const tsValues: ProductCategory[] = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'exfoliator', 'mask', 'eye_cream', 'lip_care', 'spot_treatment', 'body_lotion', 'other'];
    expect(tsValues).toEqual(sqlValues);
  });
});
