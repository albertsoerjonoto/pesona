-- RPC for admin MRR calculation — avoids loading all paying subscriptions
-- into application memory. Returns the SUM of price_idr for active,
-- non-free subscriptions.
CREATE OR REPLACE FUNCTION compute_mrr()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(price_idr), 0)::bigint
  FROM subscriptions
  WHERE status = 'active' AND tier != 'free';
$$;

-- Only service role can call this (admin page uses service role client).
-- Anon/authenticated users should NOT see aggregate revenue.
REVOKE ALL ON FUNCTION compute_mrr() FROM PUBLIC;
REVOKE ALL ON FUNCTION compute_mrr() FROM anon;
REVOKE ALL ON FUNCTION compute_mrr() FROM authenticated;
GRANT EXECUTE ON FUNCTION compute_mrr() TO service_role;
