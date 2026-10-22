import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { config } from '../config/env';
import { PosPinSignIn } from './PosPinSignIn';
import { clearLocalSession, getAccessToken } from '../services/http/authSession';

beforeEach(() => {
  sessionStorage.clear();
  clearLocalSession();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('uses the original keypad to authenticate a real staff session', async () => {
  sessionStorage.setItem(`pos-device:${config.apiBaseUrl}:${config.terminalId}`, `${config.terminalId}:paired-secret`);
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        access: 'staff-jwt',
        expiresAt: Math.floor(Date.now() / 1000) + 900,
        staff: { id: 'real-staff', name: 'An Le', initials: 'AL', role: 'admin', cafe: 'demo-branch', shift: '' },
        permissions: ['*'],
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  const onSignedIn = vi.fn().mockResolvedValue(undefined);
  render(<PosPinSignIn onSignedIn={onSignedIn} />);
  for (const digit of ['1', '2', '3', '4']) fireEvent.click(screen.getByRole('button', { name: digit }));
  // A fifth tap while the first request is pending must not submit again.
  fireEvent.click(screen.getByRole('button', { name: '4' }));
  await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(getAccessToken()).toBe('staff-jwt');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ pin: '1234' });
});

it('requires device pairing before it displays staff PIN keys', () => {
  render(<PosPinSignIn onSignedIn={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Pair this POS device' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
});
