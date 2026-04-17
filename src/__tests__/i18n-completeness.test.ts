import { describe, it, expect } from 'vitest';
import { translations } from '@/lib/i18n/translations';

describe('i18n completeness', () => {
  const keys = Object.keys(translations);

  it('has more than 100 translation keys', () => {
    expect(keys.length).toBeGreaterThan(100);
  });

  it('every key has both id and en locale', () => {
    const missing: string[] = [];

    for (const key of keys) {
      const entry = translations[key];
      if (!entry.id) missing.push(`${key}: missing id`);
      if (!entry.en) missing.push(`${key}: missing en`);
    }

    if (missing.length > 0) {
      console.warn('Missing translations:\n' + missing.join('\n'));
    }
    expect(missing).toEqual([]);
  });

  it('no empty translation strings', () => {
    const empty: string[] = [];

    for (const key of keys) {
      const entry = translations[key];
      if (entry.id === '') empty.push(`${key}.id is empty`);
      if (entry.en === '') empty.push(`${key}.en is empty`);
    }

    expect(empty).toEqual([]);
  });

  it('keys follow dot-notation naming convention', () => {
    const invalid = keys.filter(k => !k.includes('.'));
    expect(invalid).toEqual([]);
  });

  it('nav keys exist for all bottom tabs', () => {
    expect(translations['nav.overview']).toBeDefined();
    expect(translations['nav.log']).toBeDefined();
    expect(translations['nav.chat']).toBeDefined();
    expect(translations['nav.profile']).toBeDefined();
    expect(translations['nav.friends']).toBeDefined();
  });

  it('dashboard skincare keys exist', () => {
    const required = [
      'dashboard.skinProfile',
      'dashboard.startQuiz',
      'dashboard.todayRoutine',
      'dashboard.morningRoutine',
      'dashboard.eveningRoutine',
      'dashboard.dailyCheckin',
      'dashboard.tipOfDay',
      'dashboard.streak',
      'dashboard.takePhoto',
      'dashboard.noRoutine',
      'dashboard.stepsCompleted',
      'dashboard.editSkinProfile',
    ];

    const missing = required.filter(k => !translations[k]);
    if (missing.length > 0) {
      console.warn('Missing dashboard keys:', missing);
    }
    expect(missing).toEqual([]);
  });

  it('chat keys exist', () => {
    const required = [
      'chat.placeholder',
      'chat.error',
      'chat.thinking',
    ];

    const missing = required.filter(k => !translations[k]);
    expect(missing).toEqual([]);
  });

  it('skin type keys exist for all types', () => {
    const types = ['oily', 'dry', 'combination', 'sensitive', 'normal'];
    for (const type of types) {
      expect(translations[`skin.type.${type}`]).toBeDefined();
      expect(translations[`skin.type.${type}`].id).toBeTruthy();
      expect(translations[`skin.type.${type}`].en).toBeTruthy();
    }
  });

  it('skin concern keys exist', () => {
    const concerns = ['acne', 'dark_spots', 'dullness', 'large_pores', 'blackheads', 'redness', 'rough_texture', 'aging'];
    for (const concern of concerns) {
      expect(translations[`skin.concern.${concern}`]).toBeDefined();
    }
  });

  it('skin feeling keys exist', () => {
    const feelings = ['great', 'good', 'okay', 'bad', 'terrible'];
    for (const f of feelings) {
      expect(translations[`skin.feeling.${f}`]).toBeDefined();
    }
  });

  it('product page keys exist', () => {
    const required = [
      'product.halal',
      'product.bpom',
      'product.ingredients',
      'product.buyShopee',
    ];

    const missing = required.filter(k => !translations[k]);
    expect(missing).toEqual([]);
  });

  it('progress page keys exist', () => {
    const required = [
      'progress.title',
      'progress.upload',
      'progress.noPhotos',
      'progress.takeFirst',
      'progress.totalPhotos',
    ];

    const missing = required.filter(k => !translations[k]);
    expect(missing).toEqual([]);
  });

  it('routine page keys exist', () => {
    const required = [
      'routine.morning',
      'routine.evening',
      'routine.completed',
      'routine.noRoutineYet',
      'routine.askSona',
      'routine.generateAI',
    ];

    const missing = required.filter(k => !translations[k]);
    expect(missing).toEqual([]);
  });
});
