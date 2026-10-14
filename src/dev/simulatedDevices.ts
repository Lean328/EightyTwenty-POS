// DEVELOPMENT-ONLY device simulator. Device states are switched by hand in Settings → Devices; the card
// "terminal" waits ~1s and approves unless told to decline. Every message that reaches staff says "(simulated)".
import type { DeviceHub } from '../services/devices';

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

export const simulatedDevices: DeviceHub = {
  simulated: true,
  initialStates: () => ({ receipt: 'online', kitchen: 'online', drawer: 'online', terminal: 'online' }),
  chargeCard: async (req, states, signal) => {
    await wait(1100, signal);
    if (states.terminal !== 'online')
      return {
        status: 'unavailable',
        message: 'Card terminal not responding (simulated) — no charge was made. Check the terminal and retry.',
      };
    return { status: 'approved', transactionRef: 'SIM-' + req.reference };
  },
  printKitchenDocket: (_order, states) => states.kitchen === 'online',
  printReceipt: (_order, states) => states.receipt === 'online',
  openDrawer: (states) => states.drawer === 'online',
};
