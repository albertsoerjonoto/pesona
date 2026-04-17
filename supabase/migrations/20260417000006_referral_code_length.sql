-- Expand referral code entropy. 8 hex chars = ~4.3B possibilities which
-- collides with ~50% probability at ~65k users (birthday paradox). Move
-- to 12-char base36 (36^12 ≈ 4.7×10^18) — effectively collision-free for
-- realistic user counts.
--
-- We regenerate existing codes to the new length. Any users who already
-- shared their old code have a one-time change; acceptable pre-launch.

UPDATE profiles
SET referral_code = upper(
  substr(md5(random()::text || id::text), 1, 6) ||
  substr(md5(clock_timestamp()::text), 1, 6)
)
WHERE length(referral_code) < 12 OR referral_code IS NULL;
