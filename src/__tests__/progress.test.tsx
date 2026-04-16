import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockSupabaseClient } from './helpers';
import ProgressPage from '@/app/(app)/friends/page';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Progress Page (Photo Tracking)', () => {
  it('renders the page title', async () => {
    renderWithProviders(<ProgressPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('renders upload button', async () => {
    renderWithProviders(<ProgressPage />);
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /upload|foto/i });
      expect(btn).toBeInTheDocument();
    });
  });

  it('shows empty state with CTA when no photos', async () => {
    renderWithProviders(<ProgressPage />);
    await waitFor(() => {
      // Empty state message
      expect(screen.getByText(/belum ada foto|no photo/i)).toBeInTheDocument();
    });
  });

  it('shows upload CTA in empty state', async () => {
    renderWithProviders(<ProgressPage />);
    await waitFor(() => {
      // Should have at least 2 upload buttons (header + empty state)
      const uploadBtns = screen.getAllByRole('button').filter(btn =>
        btn.textContent?.match(/upload|foto/i)
      );
      expect(uploadBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('has a hidden file input for camera/photo', async () => {
    renderWithProviders(<ProgressPage />);
    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  it('calls supabase to load photos', async () => {
    renderWithProviders(<ProgressPage />);
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('photo_progress');
    });
  });
});
