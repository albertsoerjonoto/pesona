import { describe, it, expect } from 'vitest';
import { hitMilestone, nextMilestone, MILESTONE_MESSAGES } from '../lib/celebration';

describe('hitMilestone', () => {
  it('returns milestone when crossing from below', () => {
    expect(hitMilestone(2, 3)).toBe(3);
    expect(hitMilestone(6, 7)).toBe(7);
    expect(hitMilestone(13, 14)).toBe(14);
    expect(hitMilestone(29, 30)).toBe(30);
    expect(hitMilestone(59, 60)).toBe(60);
    expect(hitMilestone(89, 90)).toBe(90);
  });

  it('returns null when no milestone crossed', () => {
    expect(hitMilestone(0, 1)).toBeNull();
    expect(hitMilestone(1, 2)).toBeNull();
    expect(hitMilestone(3, 4)).toBeNull();
    expect(hitMilestone(7, 8)).toBeNull();
    expect(hitMilestone(90, 91)).toBeNull();
  });

  it('returns null when streak stays the same', () => {
    expect(hitMilestone(3, 3)).toBeNull();
    expect(hitMilestone(7, 7)).toBeNull();
  });

  it('returns null when streak decreases', () => {
    expect(hitMilestone(10, 5)).toBeNull();
  });

  it('returns the FIRST milestone crossed when jumping multiple', () => {
    // Jumping from 0 to 10 crosses both 3 and 7 — returns 3 (lowest)
    expect(hitMilestone(0, 10)).toBe(3);
  });
});

describe('nextMilestone', () => {
  it('returns next milestone ahead of current streak', () => {
    expect(nextMilestone(0)).toBe(3);
    expect(nextMilestone(2)).toBe(3);
    expect(nextMilestone(3)).toBe(7);
    expect(nextMilestone(6)).toBe(7);
    expect(nextMilestone(7)).toBe(14);
    expect(nextMilestone(29)).toBe(30);
    expect(nextMilestone(60)).toBe(90);
  });

  it('returns null after the highest milestone', () => {
    expect(nextMilestone(90)).toBeNull();
    expect(nextMilestone(100)).toBeNull();
    expect(nextMilestone(365)).toBeNull();
  });
});

describe('MILESTONE_MESSAGES', () => {
  it('has a message for every milestone', () => {
    for (const m of [3, 7, 14, 30, 60, 90]) {
      expect(MILESTONE_MESSAGES[m]).toBeDefined();
      expect(MILESTONE_MESSAGES[m].title).toBeTruthy();
      expect(MILESTONE_MESSAGES[m].subtitle).toBeTruthy();
    }
  });

  it('uses Bahasa Indonesia casual voice (no formal Anda)', () => {
    for (const m of Object.values(MILESTONE_MESSAGES)) {
      expect(m.title).not.toMatch(/\bAnda\b/);
      expect(m.subtitle).not.toMatch(/\bAnda\b/);
    }
  });

  it('avoids clinical vocabulary', () => {
    const FORBIDDEN = ['melasma', 'rosacea', 'dermatitis', 'eczema'];
    for (const m of Object.values(MILESTONE_MESSAGES)) {
      const combined = (m.title + ' ' + m.subtitle).toLowerCase();
      for (const term of FORBIDDEN) {
        expect(combined).not.toContain(term);
      }
    }
  });
});
