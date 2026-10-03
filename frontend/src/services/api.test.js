import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBaseUrl } from './api';

describe('API base URL configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the local API for local development', () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(getBaseUrl('localhost')).toBe('http://localhost:3000/api');
    expect(getBaseUrl('127.0.0.1')).toBe('http://localhost:3000/api');
  });

  it('uses a configured public API for a separately hosted frontend', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/api');

    expect(getBaseUrl('app.example.com')).toBe('https://api.example.com/api');
  });

  it('does not send production users to a developer localhost API', () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');

    expect(getBaseUrl('app.example.com')).toBe('/api');
  });

  it('uses the same-origin API when no public API URL is configured', () => {
    vi.stubEnv('VITE_API_URL', '');

    expect(getBaseUrl('app.example.com')).toBe('/api');
  });
});
