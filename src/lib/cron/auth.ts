/**
 * Cron request authorization.
 * Pure env-check — no DB, no server-only imports, so tests can import directly.
 */
export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
