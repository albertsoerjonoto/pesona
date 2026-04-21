/**
 * Share-card primitive used by weekly report, streak milestones, and
 * skin-photo progress. Each caller renders an off-screen card element
 * (styled for 9:16 or 4:5 aspect), then calls `shareElementAsCard` to:
 *
 *   1. Capture it as a PNG via html-to-image.
 *   2. Try the Web Share API with files (iOS + modern Android Chrome)
 *      so the user can one-tap into IG Story / TikTok / WhatsApp.
 *   3. Fall back to a direct download on desktop.
 *
 * Intentionally isolated here so /reports, StreakMilestoneCard, and the
 * /friends photo modal don't each reimplement (and drift on) this flow.
 */

export interface ShareCardOptions {
  /** File title for `navigator.share`; not always displayed by the picker. */
  title: string;
  /** Caption shown on the share sheet / appended to some platforms. */
  text: string;
  /** Filename for the PNG — used both in Share and download fallback. */
  filename: string;
  /**
   * Optional background color for the rendered card. Useful when the
   * card itself uses transparency and needs a solid underlay (e.g. the
   * pink gradient for the weekly report).
   */
  backgroundColor?: string;
  /** DPR multiplier. 2 = retina-quality; 3 = Instagram-safe upscale. */
  pixelRatio?: number;
}

export type ShareOutcome = 'shared' | 'downloaded' | 'failed';

/**
 * Capture the given DOM element as a PNG and either share it via
 * navigator.share (preferred) or trigger a download. Returns what
 * actually happened so the caller can surface appropriate UI
 * (e.g. "Foto kamu udah disalin" vs "Udah di-download").
 *
 * Never throws; if html-to-image fails (some Safari content-security
 * quirks still exist), returns 'failed' and the caller can show a
 * "screenshot manual ya" message.
 */
export async function shareElementAsCard(
  element: HTMLElement,
  options: ShareCardOptions,
): Promise<ShareOutcome> {
  try {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(element, {
      pixelRatio: options.pixelRatio ?? 2,
      backgroundColor: options.backgroundColor,
    });

    // navigator.share with files is the TikTok/IG-story-friendly path.
    // Must verify canShare explicitly — iOS lies about feature detection.
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'
    ) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], options.filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: options.title,
            text: options.text,
          });
          return 'shared';
        }
      } catch {
        // User canceled the share sheet, or file-share blocked — fall through.
      }
    }

    // Desktop / unsupported: straight download.
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = options.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
