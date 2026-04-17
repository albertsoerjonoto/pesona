import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockSupabaseClient } from './helpers';
import DashboardPage from '@/app/(app)/dashboard/page';

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('Dashboard Page', () => {
  it('renders greeting based on time of day', async () => {
    renderWithProviders(<DashboardPage />);
    // Should render some greeting text (varies by time of day)
    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      // Greeting contains user name fallback "Kak"
      expect(heading.textContent).toContain('Kak');
    });
  });

  it('renders skin profile card', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // The skin profile section header via i18n
      const el = screen.getByText((content) => content.includes('Profil Kulit') || content.includes('Skin Profile'));
      expect(el).toBeInTheDocument();
    });
  });

  it('renders start quiz button when no skin profile', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // When no skin profile, should show quiz CTA
      const btn = screen.queryByRole('button', { name: /quiz|mulai/i });
      // Button may exist depending on data load timing
      expect(btn || screen.getByText(/belum ada/i)).toBeTruthy();
    });
  });

  it('renders today routine section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // Morning and evening routine labels (may match multiple)
      expect(screen.getAllByText(/pagi|morning/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/malam|evening/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders daily check-in with 5 feeling emojis', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('😍')).toBeInTheDocument();
      expect(screen.getByText('😊')).toBeInTheDocument();
      expect(screen.getByText('😐')).toBeInTheDocument();
      expect(screen.getByText('😕')).toBeInTheDocument();
      expect(screen.getByText('😢')).toBeInTheDocument();
    });
  });

  it('renders tip of the day section', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('💡')).toBeInTheDocument();
    });
  });

  it('renders photo progress button', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('📸')).toBeInTheDocument();
    });
  });

  it('calls supabase on mount', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });
  });
});
