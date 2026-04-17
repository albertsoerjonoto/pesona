import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockSupabaseClient } from './helpers';
import ProductsPage from '@/app/(app)/products/page';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Products Page', () => {
  it('renders the page header', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Produk Skincare|Skincare Products/)).toBeInTheDocument();
    });
  });

  it('renders the search input', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/cari produk|search/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('renders category filter chips', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Semua')).toBeInTheDocument();
      expect(screen.getByText('Cleanser')).toBeInTheDocument();
      expect(screen.getByText('Toner')).toBeInTheDocument();
      expect(screen.getByText('Serum')).toBeInTheDocument();
      expect(screen.getByText('Moisturizer')).toBeInTheDocument();
      expect(screen.getByText('Sunscreen')).toBeInTheDocument();
    });
  });

  it('renders skin type filter chips', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(screen.getByText('Semua Kulit')).toBeInTheDocument();
      expect(screen.getByText('Berminyak')).toBeInTheDocument();
      expect(screen.getByText('Kering')).toBeInTheDocument();
      expect(screen.getByText('Kombinasi')).toBeInTheDocument();
      expect(screen.getByText('Sensitif')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton initially', () => {
    renderWithProviders(<ProductsPage />);
    // Loading skeletons with animate-shimmer class
    const skeletons = document.querySelectorAll('.animate-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no products match', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      // After loading, with empty data should show "0 produk ditemukan"
      expect(screen.getByText(/0 produk ditemukan/)).toBeInTheDocument();
    });
  });

  it('allows typing in search', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/cari/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/cari/i);
    await user.type(input, 'Skintific');
    expect(input).toHaveValue('Skintific');
  });

  it('category chip toggles active state on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Serum')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Serum'));
    // The serum button should now have the active class (bg-accent)
    expect(screen.getByText('Serum').className).toContain('bg-accent');
  });

  it('calls supabase to load products', async () => {
    renderWithProviders(<ProductsPage />);
    await waitFor(() => {
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
    });
  });

  it('shows error state when fetch fails', async () => {
    // Override the from() mock to throw
    const originalFrom = mockSupabaseClient.from;
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(() => Promise.reject(new Error('Network error'))),
        })),
      })),
    })) as unknown as typeof mockSupabaseClient.from;

    renderWithProviders(<ProductsPage />);

    await waitFor(() => {
      // Error UI should appear
      const errorEl = screen.queryByText(/gagal memuat produk|failed to load products/i);
      expect(errorEl).toBeInTheDocument();
    });

    // Reset the mock for other tests
    mockSupabaseClient.from = originalFrom;
  });

  it('retry button calls load again after error', async () => {
    const user = userEvent.setup();
    // First call fails, second succeeds
    let callCount = 0;
    const originalFrom = mockSupabaseClient.from;
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(() => {
            callCount++;
            if (callCount === 1) return Promise.reject(new Error('fail'));
            return Promise.resolve({ data: [], error: null });
          }),
        })),
      })),
    })) as unknown as typeof mockSupabaseClient.from;

    renderWithProviders(<ProductsPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.queryByText(/gagal memuat produk|failed to load/i)).toBeInTheDocument();
    });

    // Click retry — i18n key: "Coba Lagi" or "Try Again"
    const retryBtn = screen.getByRole('button', { name: /coba lagi|try again/i });
    await user.click(retryBtn);

    // Wait for error to clear (second call succeeds)
    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    mockSupabaseClient.from = originalFrom;
  });
});
