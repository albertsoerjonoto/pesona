import 'server-only';

/**
 * Wati WhatsApp Business API client scaffold.
 *
 * Wati setup:
 * 1. Create account at wati.io
 * 2. Get API key + base URL from settings
 * 3. Set WATI_API_KEY and WATI_API_URL in env
 * 4. Register message templates in Wati dashboard:
 *    - pesona_morning_routine
 *    - pesona_evening_routine
 *    - pesona_weekly_checkin
 *    - pesona_streak_recovery
 *
 * See docs/wati-templates.md for full template specs.
 */

const WATI_API_KEY = process.env.WATI_API_KEY || '';
const WATI_API_URL = process.env.WATI_API_URL || '';

export type WatiTemplate =
  | 'pesona_morning_routine'
  | 'pesona_evening_routine'
  | 'pesona_weekly_checkin'
  | 'pesona_streak_recovery';

export interface WatiTemplateParams {
  name: string;
  streak_days?: number;
  report_url?: string;
}

interface WatiSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a WhatsApp template message via Wati.
 */
export async function sendTemplate(
  phone: string,
  template: WatiTemplate,
  params: WatiTemplateParams,
): Promise<WatiSendResult> {
  if (!WATI_API_KEY || !WATI_API_URL) {
    console.warn('[Wati] API not configured, skipping send');
    return { success: false, error: 'API not configured' };
  }

  // Format phone: strip leading 0, add 62 prefix for Indonesia
  const formattedPhone = phone.startsWith('0')
    ? '62' + phone.slice(1)
    : phone.startsWith('+')
      ? phone.slice(1)
      : phone;

  const templateParams = buildTemplateParams(template, params);

  try {
    const res = await fetch(
      `${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${formattedPhone}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WATI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_name: template,
          broadcast_name: `pesona_${template}_${Date.now()}`,
          parameters: templateParams,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Wati error ${res.status}: ${text}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.messageId || data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

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
