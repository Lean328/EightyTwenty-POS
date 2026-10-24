import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalSession, getAccessToken, refreshSession, signIn } from './authSession';

describe('Rotating refresh tokens', () => {
  beforeEach(() => clearLocalSession());

  afterEach(() => {
    clearLocalSession();
    vi.unstubAllGlobals();
  });

  it('shares one refresh request between concurrent callers', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let refreshCalls = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return Response.json({ access: 'access-1', refresh: 'refresh-1' });
        }
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          await gate;
          return Response.json({ access: 'access-2', refresh: 'refresh-2' });
        }
        throw new Error(`Unexpected URL: ${url}`);
      }),
    );

    await signIn('https://api.test', 'manager@example.com', 'test-password');

    const first = refreshSession('https://api.test', 'access-1');
    const second = refreshSession('https://api.test', 'access-1');

    try {
      expect(refreshCalls).toBe(1);
    } finally {
      release();
    }

    expect(await Promise.all([first, second])).toEqual(['access-2', 'access-2']);
    expect(getAccessToken()).toBe('access-2');
  });

  it('uses the rotated refresh token for the next refresh', async () => {
    const submitted: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return Response.json({ access: 'access-1', refresh: 'refresh-1' });
        }
        if (url.endsWith('/auth/refresh')) {
          const body = JSON.parse(String(init?.body)) as { refresh: string };
          submitted.push(body.refresh);
          const version = submitted.length + 1;
          return Response.json({ access: `access-${version}`, refresh: `refresh-${version}` });
        }
        throw new Error(`Unexpected URL: ${url}`);
      }),
    );

    await signIn('https://api.test', 'manager@example.com', 'test-password');
    await refreshSession('https://api.test', 'access-1');
    await refreshSession('https://api.test', 'access-2');

    expect(submitted).toEqual(['refresh-1', 'refresh-2']);
    expect(getAccessToken()).toBe('access-3');
  });
});
