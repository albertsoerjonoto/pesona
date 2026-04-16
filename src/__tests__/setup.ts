import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Ensure localStorage is available in test environment
// Some jsdom versions require a URL to enable localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = vi.fn();
