import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth constants. Bootstrap via ?secret= query param; after auth, we set a
// same-site http-only cookie scoped to /admin and redirect to strip the URL.
const ADMIN_COOKIE_NAME = 'pesona_admin';
const ADMIN_COOKIE_MAX_AGE_SEC = 60 * 60 * 8; // 8 hours
const ADMIN_QUERY_PARAM = 'secret';

export const metadata = {
  title: 'Admin Metrics - Pesona',
  robots: 'noindex, nofollow',
};

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      <p className="text-xs text-text-tertiary uppercase tracking-wider font-medium mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-tertiary mt-1">{sub}</p>}
    </div>
  );
}

function formatIDR(amount: number): string {
  if (amount === 0) return 'Rp 0';
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

async function getMetrics() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const today = new Date().toISOString().split('T')[0];

  // Run all queries in parallel. MRR uses a Postgres SUM RPC to avoid
  // loading every paying subscription into app memory (scales poorly).
  const [
    totalUsersResult,
    payingUsersResult,
    mrrResult,
    signupsTodayResult,
    activeRoutinesResult,
    photosResult,
    conversationsResult,
  ] = await Promise.all([
    // Total users
    supabase.from('profiles').select('id', { count: 'exact', head: true }),

    // Paying users (active subscriptions, tier != free)
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .neq('tier', 'free'),

    // MRR via DB-side SUM (see migration 20260417000007)
    supabase.rpc('compute_mrr'),

    // Signups today
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`),

    // Active routines
    supabase
      .from('routines')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Photos uploaded (engagement metric)
    supabase.from('photo_progress').select('id', { count: 'exact', head: true }),

    // AI conversations (engagement metric)
    supabase.from('ai_conversations').select('id', { count: 'exact', head: true }),
  ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const payingUsers = payingUsersResult.count ?? 0;
  // mrrResult.data is the bigint returned by compute_mrr(). Supabase returns it
  // as a number for small values, string for large — normalize.
  const mrrRaw = mrrResult.data;
  const mrr = typeof mrrRaw === 'string' ? parseInt(mrrRaw, 10) : (mrrRaw ?? 0);
  const signupsToday = signupsTodayResult.count ?? 0;
  const activeRoutines = activeRoutinesResult.count ?? 0;

  return {
    totalUsers,
    payingUsers,
    mrr,
    signupsToday,
    activeRoutines,
    totalPhotos: photosResult.count ?? 0,
    totalConversations: conversationsResult.count ?? 0,
    conversionRate: totalUsers > 0 ? ((payingUsers / totalUsers) * 100).toFixed(1) : '0.0',
  };
}

export default async function AdminMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const params = await searchParams;
  const adminSecret = process.env.ADMIN_SECRET;

  // Prefer an HTTP-only cookie (safer — no leak to logs/Referer/history).
  // Fall back to ?secret= query param for initial bootstrap; when correct,
  // we set the cookie and strip the query.
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const queryValue = params[ADMIN_QUERY_PARAM];

  const isAuthorized = Boolean(
    adminSecret && (cookieValue === adminSecret || queryValue === adminSecret),
  );

  if (!isAuthorized) {
    redirect('/');
  }

  // If user arrived via query param, set the cookie and clean the URL.
  // adminSecret is guaranteed non-null here because isAuthorized was true.
  if (adminSecret && queryValue === adminSecret && cookieValue !== adminSecret) {
    cookieStore.set(ADMIN_COOKIE_NAME, adminSecret, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: ADMIN_COOKIE_MAX_AGE_SEC,
    });
    redirect('/admin');
  }

  const metrics = await getMetrics();

  if (!metrics) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-surface rounded-2xl border border-border p-8 text-center max-w-sm">
          <p className="text-text-primary font-semibold mb-2">Configuration Error</p>
          <p className="text-sm text-text-secondary">
            Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Pesona Admin</h1>
            <p className="text-sm text-text-tertiary mt-1">
              Metrics dashboard &middot; {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-positive/10 text-positive text-xs font-semibold rounded-full">
            Live
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            label="Total Users"
            value={metrics.totalUsers.toLocaleString()}
          />
          <MetricCard
            label="Paying Users"
            value={metrics.payingUsers.toLocaleString()}
            sub={`${metrics.conversionRate}% conversion`}
          />
          <MetricCard
            label="MRR"
            value={formatIDR(metrics.mrr)}
          />
          <MetricCard
            label="Signups Today"
            value={metrics.signupsToday.toLocaleString()}
          />
          <MetricCard
            label="Active Routines"
            value={metrics.activeRoutines.toLocaleString()}
          />
          <MetricCard
            label="ARPU"
            value={metrics.payingUsers > 0 ? formatIDR(Math.round(metrics.mrr / metrics.payingUsers)) : '-'}
            sub="per paying user"
          />
          <MetricCard
            label="Photos"
            value={metrics.totalPhotos.toLocaleString()}
            sub="skin progress uploads"
          />
          <MetricCard
            label="AI Messages"
            value={metrics.totalConversations.toLocaleString()}
            sub="coach conversations"
          />
        </div>

        <p className="text-xs text-text-tertiary text-center">
          Data refreshed on page load. Reload to update.
        </p>
      </div>
    </div>
  );
}
