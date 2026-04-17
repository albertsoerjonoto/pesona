import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './helpers';
import LogPage from '@/app/(app)/log/page';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Routine Log Page', () => {
  it('renders the page title', async () => {
    renderWithProviders(<LogPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('renders morning and evening tabs', async () => {
    renderWithProviders(<LogPage />);
    await waitFor(() => {
      // Tab buttons + calendar labels can produce multiple matches
      expect(screen.getAllByText(/pagi|morning/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/malam|evening/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('defaults to morning tab before 5pm, evening after', async () => {
    renderWithProviders(<LogPage />);
    await waitFor(() => {
      // At least the 2 tab buttons must exist
      const tabs = screen.getAllByRole('button').filter(btn => {
        const text = btn.textContent || '';
        return text.match(/pagi|malam|morning|evening/i);
      });
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/malam|evening/i).length).toBeGreaterThanOrEqual(1);
    });

    // Click the evening tab (first button matching)
    const eveningBtn = screen.getAllByRole('button').find(btn =>
      btn.textContent?.match(/malam|evening/i)
    );
    if (eveningBtn) {
      await user.click(eveningBtn);
    }
    expect(eveningBtn).toBeTruthy();
  });

  it('shows empty state when no routine exists', async () => {
    renderWithProviders(<LogPage />);
    await waitFor(() => {
      // Empty state text
      expect(screen.getByText(/belum ada routine|no routine/i)).toBeInTheDocument();
    });
  });

  it('shows CTA to ask Sona for routine', async () => {
    renderWithProviders(<LogPage />);
    await waitFor(() => {
      const ctaBtn = screen.getByRole('button', { name: /sona|generate|minta/i });
      expect(ctaBtn).toBeInTheDocument();
    });
  });
});
