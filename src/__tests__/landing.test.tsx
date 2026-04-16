import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { renderWithProviders } from './helpers';
import LandingPage from '@/app/page';

describe('Landing Page', () => {
  it('renders the hero section', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/Jadi versi paling menarik dari/)).toBeInTheDocument();
    expect(screen.getByText('dirimu')).toBeInTheDocument();
  });

  it('renders the nav with login and signup links', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getAllByText('Pesona.io').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Masuk')).toBeInTheDocument();
    expect(screen.getAllByText('Daftar Gratis').length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 6 feature cards', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('Skincare Routine Personal')).toBeInTheDocument();
    expect(screen.getByText('Foto Progress Tracking')).toBeInTheDocument();
    expect(screen.getByText('AI Coach Bahasa Indonesia')).toBeInTheDocument();
    expect(screen.getByText('Rekomendasi Produk Lokal')).toBeInTheDocument();
    expect(screen.getByText('Paham Iklim Tropis')).toBeInTheDocument();
    expect(screen.getByText('Skin Analysis dengan AI Vision')).toBeInTheDocument();
  });

  it('renders the 4 how-it-works steps', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('Skin Quiz')).toBeInTheDocument();
    expect(screen.getByText('Dapat Routine')).toBeInTheDocument();
    expect(screen.getByText('Chat Sona')).toBeInTheDocument();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
  });

  it('renders the pricing section with Rp 59.000', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getAllByText(/59/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('.000')).toBeInTheDocument();
    expect(screen.getByText('/bulan')).toBeInTheDocument();
  });

  it('renders 4 FAQ items', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('Apakah ini layanan medis?')).toBeInTheDocument();
    expect(screen.getByText('Apakah produk yang direkomendasikan halal?')).toBeInTheDocument();
    expect(screen.getByText('Berapa harganya?')).toBeInTheDocument();
    expect(screen.getByText('Apakah AI coach bisa berbahasa Inggris?')).toBeInTheDocument();
  });

  it('renders CTA links pointing to /signup', () => {
    renderWithProviders(<LandingPage />);
    const signupLinks = screen.getAllByRole('link').filter(
      a => a.getAttribute('href') === '/signup'
    );
    expect(signupLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the footer disclaimer', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getAllByText(/Pesona adalah produk wellness/).length).toBeGreaterThanOrEqual(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(<LandingPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
