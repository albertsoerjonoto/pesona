import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { LocaleProvider } from '@/lib/i18n/context';

/**
 * Mock Supabase client that returns empty/null data by default.
 * Override in individual tests via vi.mocked().
 */
export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      order: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/photo.jpg' } })),
    })),
  },
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
};

// Mock Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock useAuth
export const mockUser = { id: 'test-user-id', email: 'test@pesona.io' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

// Mock useDesktopLayout
vi.mock('@/hooks/useDesktopLayout', () => ({
  useDesktopLayout: () => ({ isExpanded: false, toggleLayout: vi.fn() }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Toast hook
vi.mock('@/components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    ToastContainer: null,
  }),
}));

/**
 * Render with all providers (LocaleProvider etc.)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <LocaleProvider>{children}</LocaleProvider>;
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
