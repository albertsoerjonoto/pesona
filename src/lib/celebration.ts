/**
 * Celebration utilities — confetti effects for milestones.
 * Uses canvas-confetti library with Bossy Pink palette.
 */

import confetti from 'canvas-confetti';

const PESONA_COLORS = ['#CE3D66', '#E0527A', '#F59FBE', '#FFD1DC', '#FFFFFF'];

/**
 * Fire a standard celebration burst — for routine completion.
 */
export function celebrate(): void {
  if (typeof window === 'undefined') return;

  const duration = 1500;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: PESONA_COLORS,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: PESONA_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/**
 * Big celebration burst — for streak milestones (3/7/14/30/60/90 days).
 */
export function celebrateStreak(): void {
  if (typeof window === 'undefined') return;

  // Initial big burst
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: PESONA_COLORS,
  });

  // Follow-up side bursts
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: PESONA_COLORS,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: PESONA_COLORS,
    });
  }, 250);
}

/**
 * Return the next streak milestone a user is approaching,
 * or null if they've passed the highest (90 days).
 */
export function nextMilestone(currentStreak: number): number | null {
  const milestones = [3, 7, 14, 30, 60, 90];
  for (const m of milestones) {
    if (currentStreak < m) return m;
  }
  return null;
}

/**
 * Check if hitting the current streak crosses a milestone.
 * Returns the milestone number if yes, null otherwise.
 */
export function hitMilestone(prevStreak: number, currentStreak: number): number | null {
  const milestones = [3, 7, 14, 30, 60, 90];
  for (const m of milestones) {
    if (prevStreak < m && currentStreak >= m) return m;
  }
  return null;
}

export const MILESTONE_MESSAGES: Record<number, { title: string; subtitle: string }> = {
  3: { title: '3 hari streak!', subtitle: 'Konsistensi itu kunci. Terus gini ya kak ✨' },
  7: { title: 'Seminggu penuh!', subtitle: 'Satu minggu konsisten — kulit kamu pasti seneng 💕' },
  14: { title: '2 minggu jalan!', subtitle: 'Ini momentum yang luar biasa. Hasil mulai kelihatan nih 🌟' },
  30: { title: 'Satu bulan streak!', subtitle: 'WOW. Kamu udah officially skincare lover 🎉' },
  60: { title: '2 bulan konsisten!', subtitle: 'Level commitment kamu beda banget. Proud of you! 💪' },
  90: { title: '3 bulan streak!', subtitle: 'This is the glow-up era. Kamu amazing banget kak ✨💖' },
};
