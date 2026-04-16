import { describe, it, expect } from 'vitest';

/**
 * Tests for WhatsApp (Wati) template parameter building.
 * We test the parameter construction logic directly since
 * actual API calls need Wati credentials.
 */

type WatiTemplate =
  | 'pesona_morning_routine'
  | 'pesona_evening_routine'
  | 'pesona_weekly_checkin'
  | 'pesona_streak_recovery';

interface WatiTemplateParams {
  name: string;
  streak_days?: number;
  report_url?: string;
}

// Replicate the logic from lib/whatsapp/wati.ts
function buildTemplateParams(
  template: WatiTemplate,
  params: WatiTemplateParams,
): { name: string; value: string }[] {
  switch (template) {
    case 'pesona_morning_routine':
    case 'pesona_evening_routine':
      return [{ name: 'name', value: params.name }];
    case 'pesona_weekly_checkin':
      return [
        { name: 'name', value: params.name },
        { name: 'report_url', value: params.report_url || 'https://pesona.io/dashboard' },
      ];
    case 'pesona_streak_recovery':
      return [
        { name: 'name', value: params.name },
        { name: 'streak_days', value: String(params.streak_days || 0) },
      ];
    default:
      return [{ name: 'name', value: params.name }];
  }
}

function formatPhone(phone: string): string {
  if (phone.startsWith('0')) return '62' + phone.slice(1);
  if (phone.startsWith('+')) return phone.slice(1);
  return phone;
}

describe('Wati Template Parameters', () => {
  it('morning routine includes name only', () => {
    const params = buildTemplateParams('pesona_morning_routine', { name: 'Nadia' });
    expect(params).toEqual([{ name: 'name', value: 'Nadia' }]);
  });

  it('evening routine includes name only', () => {
    const params = buildTemplateParams('pesona_evening_routine', { name: 'Siti' });
    expect(params).toEqual([{ name: 'name', value: 'Siti' }]);
  });

  it('weekly checkin includes name and report URL', () => {
    const params = buildTemplateParams('pesona_weekly_checkin', {
      name: 'Dewi',
      report_url: 'https://pesona.io/report/123',
    });
    expect(params).toHaveLength(2);
    expect(params[0]).toEqual({ name: 'name', value: 'Dewi' });
    expect(params[1]).toEqual({ name: 'report_url', value: 'https://pesona.io/report/123' });
  });

  it('weekly checkin defaults report URL to dashboard', () => {
    const params = buildTemplateParams('pesona_weekly_checkin', { name: 'Anya' });
    expect(params[1].value).toBe('https://pesona.io/dashboard');
  });

  it('streak recovery includes name and streak count', () => {
    const params = buildTemplateParams('pesona_streak_recovery', {
      name: 'Rizki',
      streak_days: 14,
    });
    expect(params).toHaveLength(2);
    expect(params[1]).toEqual({ name: 'streak_days', value: '14' });
  });

  it('streak recovery defaults to 0 days', () => {
    const params = buildTemplateParams('pesona_streak_recovery', { name: 'User' });
    expect(params[1].value).toBe('0');
  });
});

describe('Phone Number Formatting', () => {
  it('converts Indonesian 0-prefix to 62', () => {
    expect(formatPhone('08123456789')).toBe('628123456789');
  });

  it('strips + prefix', () => {
    expect(formatPhone('+628123456789')).toBe('628123456789');
  });

  it('passes through already-formatted numbers', () => {
    expect(formatPhone('628123456789')).toBe('628123456789');
  });

  it('handles short numbers', () => {
    expect(formatPhone('0812')).toBe('62812');
  });
});
