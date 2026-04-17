import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

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

  // Run all queries in parallel
  const [
    totalUsersResult,
    payingUsersResult,
    mrrResult,
    signupsTodayResult,
    activeRoutinesResult,
  ] = await Promise.all([
    // Total users
    supabase.from('profiles').select('id', { count: 'exact', head: true }),

    // Paying users (active subscriptions, tier != free)
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .neq('tier', 'free'),

    // MRR (sum price_idr from active subscriptions)
    supabase
      .from('subscriptions')
      .select('price_idr')
      .eq('status', 'active')
      .neq('tier', 'free'),

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
  ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const payingUsers = payingUsersResult.count ?? 0;
  const mrr = mrrResult.data
    ? mrrResult.data.reduce((sum: number, s: { price_idr: number }) => sum + (s.price_idr || 0), 0)
    : 0;
  const signupsToday = signupsTodayResult.count ?? 0;
  const activeRoutines = activeRoutinesResult.count ?? 0;

  return {
    totalUsers,
    payingUsers,
    mrr,
    signupsToday,
    activeRoutines,
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
  const cookieValue = cookieStore.get('pesona_admin')?.value;
  const queryValue = params.secret;

  const isAuthorized = Boolean(
    adminSecret && (cookieValue === adminSecret || queryValue === adminSecret),
  );

  if (!isAuthorized) {
    redirect('/');
  }

  // If user arrived via query param, set the cookie and clean the URL.
  // adminSecret is guaranteed non-null here because isAuthorized was true.
  if (adminSecret && queryValue === adminSecret && cookieValue !== adminSecret) {
    cookieStore.set('pesona_admin', adminSecret, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 60 * 60 * 8, // 8 hours
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
        </div>

        <p className="text-xs text-text-tertiary text-center">
          Data refreshed on page load. Reload to update.
        </p>
      </div>
    </div>
  );
}
