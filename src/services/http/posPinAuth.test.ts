import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalSession, getAccessToken } from './authSession';
import { createPosPinAuth } from './posPinAuth';

const staff = { id: 'staff-1', name: 'Test Staff', initials: 'TS', role: 'cashier', cafe: 'demo', shift: '' };
const body = () => ({ access: 'new-pin-token', expiresAt: Math.floor(Date.now() / 1000) + 900, staff, permissions: ['pos', 'kitchen'] });
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });

beforeEach(() => clearLocalSession());

describe('Django PIN authentication', () => {
  it('sends a device credential and PIN, then uses the returned staff token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(body()));
    const auth = createPosPinAuth({
      baseUrl: 'http://localhost:8000',
      terminalId: 'TILL-1',
      getDeviceCredential: () => 'TILL-1:secret',
      fetchImpl,
    });
    const result = await auth.signIn('1234', 'staff-1');
    expect(result.staff.id).toBe('staff-1');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/pos/auth/pin');
    expect(init.headers).toMatchObject({ 'X-Pos-Device': 'TILL-1:secret', 'X-Terminal-Id': 'TILL-1' });
    expect(init.credentials).toBe('omit');
    expect(JSON.parse(init.body)).toEqual({ pin: '1234', expectedStaffId: 'staff-1' });
    expect(getAccessToken()).toBe('new-pin-token');
    auth.signOut();
    expect(getAccessToken()).toBeNull();
  });

  it('rejects malformed PINs without sending a request', async () => {
    const fetchImpl = vi.fn();
    const auth = createPosPinAuth({ baseUrl: '', terminalId: 'T', getDeviceCredential: () => 'T:s', fetchImpl });
    await expect(auth.signIn('123')).rejects.toThrow('4-digit');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not accept a token for a different selected employee', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(body()));
    const auth = createPosPinAuth({ baseUrl: '', terminalId: 'T', getDeviceCredential: () => 'T:s', fetchImpl });
    await expect(auth.signIn('1234', 'other')).rejects.toThrow('selected staff');
    expect(getAccessToken()).toBeNull();
  });

  it('keeps server lockout errors instead of treating them as a successful sign-in', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ error: { message: 'Wait before trying again.' } }, 429));
    const auth = createPosPinAuth({ baseUrl: '', terminalId: 'T', getDeviceCredential: () => 'T:s', fetchImpl });
    await expect(auth.verifyPin('1234')).rejects.toThrow('Wait before trying again');
    expect(getAccessToken()).toBeNull();
  });

  it('does not store a late response after sign-out', async () => {
    let finish!: (result: Response) => void;
    const fetchImpl = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    const auth = createPosPinAuth({ baseUrl: '', terminalId: 'T', getDeviceCredential: () => 'T:s', fetchImpl });
    const pending = auth.signIn('1234');
    auth.signOut();
    finish(response(body()));
    await expect(pending).rejects.toThrow('superseded');
    expect(getAccessToken()).toBeNull();
  });
});

it('the demo verifier also rejects a PIN for the wrong selected employee', async () => {
  const { createLocalBackend } = await import('../../dev/localBackend');
  const backend = createLocalBackend();
  await expect(backend.staffAuth.verifyPin('2468', { expectedStaffId: 's3' })).resolves.toBeNull();
  await expect(backend.staffAuth.verifyPin('2468', { expectedStaffId: 's1' })).resolves.toMatchObject({ staff: { id: 's1' } });
});
