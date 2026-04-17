import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReferralCard from '@/components/ReferralCard';

// Mock the in-app Toast (avoids pulling in its deps)
vi.mock('@/components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    ToastContainer: null,
  }),
}));

// Mock navigator.clipboard for copy tests
const writeText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText },
  writable: true,
  configurable: true,
});

describe('ReferralCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeText.mockResolvedValue(undefined);
  });

  it('shows loading skeleton before API resolves', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { container } = render(<ReferralCard />);
    // The animate-pulse div is the loading indicator
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders code + URL after successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        referral_code: 'ABC123DEF456',
        referral_url: 'https://pesona.io/?ref=ABC123DEF456',
      }),
    }) as unknown as typeof fetch;

    render(<ReferralCard />);
    await waitFor(() => {
      expect(screen.getByText('ABC123DEF456')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Salin link/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('silently renders nothing if the API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    }) as unknown as typeof fetch;

    const { container } = render(<ReferralCard />);
    await waitFor(() => {
      // The card should unmount to null on error
      expect(container.firstChild).toBeNull();
    });
  });

  it('copies URL to clipboard when Salin link clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        referral_code: 'XYZ789',
        referral_url: 'https://pesona.io/?ref=XYZ789',
      }),
    }) as unknown as typeof fetch;

    render(<ReferralCard />);
    const btn = await screen.findByRole('button', { name: /Salin link/ });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://pesona.io/?ref=XYZ789');
    });
  });

  it('shows Tersalin state after successful copy', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        referral_code: 'COPY1234',
        referral_url: 'https://pesona.io/?ref=COPY1234',
      }),
    }) as unknown as typeof fetch;

    render(<ReferralCard />);
    const btn = await screen.findByRole('button', { name: /Salin link/ });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tersalin/ })).toBeInTheDocument();
    });
  });

  it('uses navigator.share when available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      writable: true,
      configurable: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        referral_code: 'SHARE123',
        referral_url: 'https://pesona.io/?ref=SHARE123',
      }),
    }) as unknown as typeof fetch;

    render(<ReferralCard />);
    const btn = await screen.findByRole('button', { name: 'Share' });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalled();
    });
    const callArg = shareMock.mock.calls[0][0];
    expect(callArg.url).toBe('https://pesona.io/?ref=SHARE123');
    expect(callArg.text).toContain('Pesona');
  });

  it('falls back to copy when navigator.share is not available', async () => {
    // Remove share capability
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        referral_code: 'FALL1234',
        referral_url: 'https://pesona.io/?ref=FALL1234',
      }),
    }) as unknown as typeof fetch;

    render(<ReferralCard />);
    const shareBtn = await screen.findByRole('button', { name: 'Share' });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://pesona.io/?ref=FALL1234');
    });
  });
});
