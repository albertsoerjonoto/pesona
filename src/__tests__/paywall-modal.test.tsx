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

  it('renders Plus and Pro tiers when open=true', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    expect(screen.getByText('Upgrade Pesona kamu')).toBeInTheDocument();
    expect(screen.getByText('Pesona Plus')).toBeInTheDocument();
    expect(screen.getByText('Pesona Pro')).toBeInTheDocument();
  });

  it('displays correct IDR pricing', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    // 59.000 (Plus) and 179.000 (Pro) with non-breaking or regular formatting
    const bodyText = document.body.textContent || '';
    expect(bodyText).toMatch(/Rp\s?59\D?000/);
    expect(bodyText).toMatch(/Rp\s?179\D?000/);
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

  it('routes to /subscription/checkout?tier=plus when Plus CTA clicked', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Plus' }));
    expect(push).toHaveBeenCalledWith('/subscription/checkout?tier=plus');
  });

  it('routes to /subscription/checkout?tier=pro when Pro CTA clicked', () => {
    render(<PaywallModal open={true} onClose={() => {}} trigger="chat_limit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pilih Pro' }));
    expect(push).toHaveBeenCalledWith('/subscription/checkout?tier=pro');
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
