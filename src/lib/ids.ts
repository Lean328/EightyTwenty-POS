// Identifiers and timestamps used on records created by this till.

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Random id with a readable prefix, e.g. uid('P') → "P7K2Q9XMA". Uses the platform CSPRNG. */
export function uid(prefix = '', length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return prefix + out;
}

/** Current local time as HH:MM (24h). */
export const nowHM = (d = new Date()): string => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Human timestamp used in history, audit and sync logs, e.g. "9 Oct, 9:41 am". */
export const stamp = (d = new Date()): string =>
  d.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Today's short date as shown on gift card issue records, e.g. "9 Oct 2026". */
export const shortDate = (d = new Date()): string => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
