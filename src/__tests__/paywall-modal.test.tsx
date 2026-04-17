import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaywallModal from '@/components/PaywallModal';

// Mock next/navigation
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Mock posthog tracker
const trackEvent = vi.fn();
vi.mock('@/lib/analytics/posthog-client', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
  posthog: { capture: vi.fn() },
  initPostHog: vi.fn(),
}));

describe('PaywallModal', () => {
  beforeEach(() => {
    push.mockClear();
    trackEvent.mockClear();
  });

  it('renders nothing when open=false', () => {
    render(<PaywallModal open={false} onClose={() => {}} trigger="chat_limit" />);
    expect(screen.queryByText('Upgrade Pesona kamu')).not.toBeInTheDocument();
  });

  it('renders Plus, Pro, and Elite tiers when open=true', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    expect(screen.getByText('Upgrade Pesona kamu')).toBeInTheDocument();
    expect(screen.getByText('Pesona Plus')).toBeInTheDocument();
    expect(screen.getByText('Pesona Pro')).toBeInTheDocument();
    expect(screen.getByText('Pesona Glow')).toBeInTheDocument();
  });

  it('displays correct monthly IDR pricing for all three tiers', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    // 59.000 (Plus), 179.000 (Pro), 499.000 (Elite)
    const bodyText = document.body.textContent || '';
    expect(bodyText).toMatch(/Rp\s?59\D?000/);
    expect(bodyText).toMatch(/Rp\s?179\D?000/);
    expect(bodyText).toMatch(/Rp\s?499\D?000/);
  });

  it('swaps to annual pricing when Tahunan toggle is clicked', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('tab', { name: /Tahunan/ }));
    const bodyText = document.body.textContent || '';
    // Annual = 10× monthly per spec §10.1: 590k / 1.79M / 4.99M
    expect(bodyText).toMatch(/Rp\s?590\D?000/);
    expect(bodyText).toMatch(/Rp\s?1\D?790\D?000/);
    expect(bodyText).toMatch(/Rp\s?4\D?990\D?000/);
    // And the /bln suffix should be gone in favor of /tahun
    expect(bodyText).toMatch(/\/tahun/);
  });

  it('fires paywall_shown on mount when open', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="photo_limit" />);
    expect(trackEvent).toHaveBeenCalledWith('paywall_shown', { trigger: 'photo_limit' });
  });

  it('fires paywall_dismissed + onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <PaywallModal open={true} onClose={onClose} trigger="feature_gate" />,
    );
    // The backdrop is the absolutely-positioned div with bg-black/50
    const backdrop = container.querySelector('.bg-black\\/50');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(trackEvent).toHaveBeenCalledWith('paywall_dismissed', { dismissed_at_tier: 'free' });
    expect(onClose).toHaveBeenCalled();
  });

  it('routes to Plus monthly checkout by default', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Plus' }));
    expect(push).toHaveBeenCalledWith('/subscription/checkout?tier=plus&period=monthly');
  });

  it('routes to Pro monthly checkout by default', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Pro' }));
    expect(push).toHaveBeenCalledWith('/subscription/checkout?tier=pro&period=monthly');
  });

  it('routes to Elite checkout when Glow CTA clicked', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Glow' }));
    expect(push).toHaveBeenCalledWith('/subscription/checkout?tier=elite&period=monthly');
  });

  it('routes to annual checkout when Tahunan toggle is on', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('tab', { name: /Tahunan/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Pro' }));
    expect(push).toHaveBeenCalledWith('/subscription/checkout?tier=pro&period=annual');
  });

  it('shows wellness disclaimer', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    expect(screen.getByText(/wellness & edukasi kecantikan, bukan layanan medis/)).toBeInTheDocument();
  });

  it('labels Pro as "Paling Populer"', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    expect(screen.getByText('Paling Populer')).toBeInTheDocument();
  });

  it('tracks different triggers correctly', () => {
    const { rerender } = render(
      <PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />,
    );
    expect(trackEvent).toHaveBeenLastCalledWith('paywall_shown', { trigger: 'chat_limit' });

    trackEvent.mockClear();
    rerender(<PaywallModal open={false} onClose={() => {}} trigger="weekly_report" />);
    rerender(<PaywallModal open={true} onClose={() => {}} trigger="weekly_report" />);
    expect(trackEvent).toHaveBeenCalledWith('paywall_shown', { trigger: 'weekly_report' });
  });
});
