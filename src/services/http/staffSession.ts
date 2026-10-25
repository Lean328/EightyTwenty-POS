// The active PIN session. Pending commands retain their original session separately.
let staffToken: string | null = null;

export function getStaffToken(): string | null {
  return staffToken;
}

export function setStaffToken(token: string | null): void {
  staffToken = token;
}
