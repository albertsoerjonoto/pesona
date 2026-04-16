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
      expect(screen.getByText('Produk Skincare')).toBeInTheDocument();
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
});
