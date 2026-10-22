import type { Permission, StaffMember } from '../../domain/types';
import { clearLocalSession, getAccessToken, setPinAccessToken } from './authSession';
import { ApiError, createHttpClient } from './httpClient';

export interface PosPinSession {
  access: string;
  expiresAt: number;
  staff: StaffMember;
  permissions: Permission[];
}

export function createPosPinAuth(options: {
  baseUrl: string;
  terminalId: string;
  getDeviceCredential: () => string | null;
  fetchImpl?: typeof fetch;
}) {
  const client = createHttpClient({
    ...options,
    timeoutMs: 15_000,
    getAccessToken,
  });
  let generation = 0;

  async function signIn(pin: string, expectedStaffId?: string): Promise<PosPinSession> {
    if (!/^[0-9]{4}$/.test(pin)) throw new Error('Enter a 4-digit PIN.');
    if (!options.getDeviceCredential()) throw new Error('Pair this device first.');
    const current = ++generation;
    // Switching staff must not keep the previous staff token after a failed attempt.
    clearLocalSession();
    const response = await client.post<PosPinSession>('/api/v1/pos/auth/pin', {
      pin,
      ...(expectedStaffId ? { expectedStaffId } : {}),
    });
    if (current !== generation) throw new Error('Sign-in was superseded. Try again.');
    if (
      !response.access ||
      !response.staff?.id ||
      !Array.isArray(response.permissions) ||
      !Number.isFinite(response.expiresAt) ||
      response.expiresAt * 1000 <= Date.now()
    ) {
      throw new Error('Invalid PIN session response.');
    }
    if (expectedStaffId && response.staff.id !== expectedStaffId) {
      throw new Error('PIN does not belong to the selected staff member.');
    }
    setPinAccessToken(response.access);
    return response;
  }

  function signOut() {
    generation += 1;
    clearLocalSession();
  }

  async function verifyPin(pin: string, expectedStaffId?: string) {
    try {
      const response = await signIn(pin, expectedStaffId);
      return { staff: response.staff, permissions: response.permissions };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
      throw error;
    }
  }

  return { signIn, signOut, verifyPin };
}
