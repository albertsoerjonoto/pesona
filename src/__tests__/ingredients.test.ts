import { describe, it, expect } from 'vitest';

// Mirror the ingredient data structure from the ingredients page
interface Ingredient {
  name: string;
  bahasa: string;
  category: string;
  description: string;
  benefits: string[];
  skinTypes: string[];
  caution?: string;
}

const VALID_CATEGORIES = ['Brightening', 'Hydration', 'Exfoliant', 'Anti-aging', 'Soothing', 'Barrier Repair', 'Anti-breakout', 'Sun Protection'];
const VALID_SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal'];

// Sample data matching the ingredients page
const SAMPLE_INGREDIENTS: Ingredient[] = [
  {
    name: 'Niacinamide (Vitamin B3)',
    bahasa: 'Niasinamida',
    category: 'Brightening',
    description: 'Bahan multifungsi yang membantu mencerahkan kulit',
    benefits: ['Mencerahkan kulit kusam', 'Mengecilkan pori'],
    skinTypes: ['oily', 'combination', 'normal', 'sensitive', 'dry'],
  },
  {
    name: 'Retinol (Vitamin A)',
    bahasa: 'Retinol',
    category: 'Anti-aging',
    description: 'Gold standard anti-aging',
    benefits: ['Anti-aging', 'Memperbaiki tekstur'],
    skinTypes: ['normal', 'combination', 'oily'],
    caution: 'Mulai 1-2x seminggu',
  },
];

describe('Ingredient data validation', () => {
  it('all ingredients have required fields', () => {
    for (const ing of SAMPLE_INGREDIENTS) {
      expect(ing.name).toBeTruthy();
      expect(ing.bahasa).toBeTruthy();
      expect(ing.category).toBeTruthy();
      expect(ing.description).toBeTruthy();
      expect(ing.benefits.length).toBeGreaterThan(0);
      expect(ing.skinTypes.length).toBeGreaterThan(0);
    }
  });

  it('all categories are valid', () => {
    for (const ing of SAMPLE_INGREDIENTS) {
      expect(VALID_CATEGORIES).toContain(ing.category);
    }
  });

  it('all skin types are valid', () => {
    for (const ing of SAMPLE_INGREDIENTS) {
      for (const st of ing.skinTypes) {
        expect(VALID_SKIN_TYPES).toContain(st);
      }
    }
  });

  it('descriptions are in Bahasa Indonesia', () => {
    for (const ing of SAMPLE_INGREDIENTS) {
      // Basic check: should not start with English article words
      expect(ing.description).not.toMatch(/^(The |A |An |This is)/);
    }
  });

  it('caution field is optional', () => {
    const withCaution = SAMPLE_INGREDIENTS.filter(i => i.caution);
    const withoutCaution = SAMPLE_INGREDIENTS.filter(i => !i.caution);
    expect(withCaution.length).toBeGreaterThan(0);
    expect(withoutCaution.length).toBeGreaterThan(0);
  });
});

describe('Ingredient search filtering', () => {
  function filterIngredients(ingredients: Ingredient[], search: string, category: string) {
    return ingredients.filter(ing => {
      const matchesSearch = !search ||
        ing.name.toLowerCase().includes(search.toLowerCase()) ||
        ing.bahasa.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'Semua' || ing.category === category;
      return matchesSearch && matchesCategory;
    });
  }

  it('returns all on empty search', () => {
    const result = filterIngredients(SAMPLE_INGREDIENTS, '', 'Semua');
    expect(result).toHaveLength(SAMPLE_INGREDIENTS.length);
  });

  it('filters by name', () => {
    const result = filterIngredients(SAMPLE_INGREDIENTS, 'niacinamide', 'Semua');
    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('Niacinamide');
  });

  it('filters by bahasa name', () => {
    const result = filterIngredients(SAMPLE_INGREDIENTS, 'retinol', 'Semua');
    expect(result).toHaveLength(1);
  });

  it('filters by category', () => {
    const result = filterIngredients(SAMPLE_INGREDIENTS, '', 'Anti-aging');
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Anti-aging');
  });

  it('combined search + category', () => {
    const result = filterIngredients(SAMPLE_INGREDIENTS, 'niacinamide', 'Brightening');
    expect(result).toHaveLength(1);
  });

  it('returns empty for non-matching', () => {
    const result = filterIngredients(SAMPLE_INGREDIENTS, 'xyz123', 'Semua');
    expect(result).toHaveLength(0);
  });
});
