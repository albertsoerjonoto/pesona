import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockSupabaseClient } from './helpers';
import ChatPage from '@/app/(app)/chat/page';

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe('Chat Page', () => {
  it('renders the Sona header', async () => {
    renderWithProviders(<ChatPage />);
    expect(screen.getByText('Sona')).toBeInTheDocument();
    expect(screen.getByText('AI Coach')).toBeInTheDocument();
  });

  it('renders welcome message when no history', async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument();
    });
  });

  it('renders welcome capabilities list', async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText(/skincare routine pagi/i)).toBeInTheDocument();
      expect(screen.getByText(/produk sesuai jenis kulit/i)).toBeInTheDocument();
      expect(screen.getByText(/kondisi kulit dari foto/i)).toBeInTheDocument();
      expect(screen.getByText(/iklim tropis Indonesia/i)).toBeInTheDocument();
    });
  });

  it('renders quick suggestion chips', async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument();
    });
    // Quick chips should be visible when no messages
    const chips = screen.getAllByRole('button').filter(
      btn => !btn.querySelector('svg') // Exclude the send button
    );
    expect(chips.length).toBeGreaterThanOrEqual(4);
  });

  it('renders textarea input with placeholder', async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument();
    });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders send button', async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument();
    });
    // Send button should exist (contains an SVG arrow icon)
    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons.find(btn => btn.querySelector('svg'));
    expect(sendBtn).toBeTruthy();
  });

  it('send button is disabled when input is empty', async () => {
    renderWithProviders(<ChatPage />);
    await waitFor(() => {
      expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons.find(btn => btn.querySelector('svg'));
    expect(sendBtn).toHaveAttribute('disabled');
  });

  it('sends message on Enter key', async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Test response' }),
    });

    renderWithProviders(<ChatPage />);
    await waitFor(() => expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument());

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello Sona');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/coach', expect.anything());
    });
  });

  it('shows user message in chat after sending', async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Hai kak!' }),
    });

    renderWithProviders(<ChatPage />);
    await waitFor(() => expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument());

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My skin is oily');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('My skin is oily')).toBeInTheDocument();
    });
  });

  it('shows assistant response after sending', async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Hai kak! Kulit berminyak ya?' }),
    });

    renderWithProviders(<ChatPage />);
    await waitFor(() => expect(screen.getByText(/Halo, aku Sona!/)).toBeInTheDocument());

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Help me');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/Hai kak! Kulit berminyak ya\?/)).toBeInTheDocument();
    });
  });
});
