import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { LocaleProvider } from '@/lib/i18n/context';

/**
 * Proxy-style mock Supabase query builder — chainable and always resolves
 * with empty/null data. Any method call returns the same proxy, so all
 * .eq().order().limit().single() chains terminate successfully.
 *
 * Terminal methods (single, maybeSingle, limit, then) return a Promise.
 * Builder methods (select, eq, neq, not, gte, order, etc.) return the proxy.
 */
function createQueryBuilder(defaultData: unknown = null) {
  const builder: Record<string, unknown> = {};

  const terminalMethods = new Set(['single', 'maybeSingle']);

  const chainableMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'contains', 'not', 'or', 'filter',
    'order', 'limit', 'range', 'offset',
  ];

  for (const method of chainableMethods) {
    builder[method] = vi.fn(() => builder);
  }

  for (const method of terminalMethods) {
    builder[method] = vi.fn(() =>
      Promise.resolve({ data: defaultData, error: null })
    );
  }

  // Make the builder thenable so `await query` works at any point
  builder.then = (resolve: (value: { data: unknown; error: null }) => unknown) =>
    resolve({ data: Array.isArray(defaultData) ? defaultData : [], error: null });

  return builder;
}

/**
 * Mock Supabase client — default: all reads return empty.
 */
export const mockSupabaseClient = {
  from: vi.fn(() => createQueryBuilder()),
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
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
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
