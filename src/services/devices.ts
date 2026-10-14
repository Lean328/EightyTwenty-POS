// Hardware contracts: card terminal, receipt and kitchen printers, cash drawer.
// No hardware integration exists yet. Production builds use `unconnectedDevices` (every call fails safely
// and says so); development builds use the simulator in dev/simulatedDevices.ts.
import type { DeviceId, DeviceState, DeviceStates, Order } from '../domain/types';

export interface CardChargeRequest {
  method: 'card' | 'wallet';
  /** Cents, excluding tip and surcharge. */
  amountC: number;
  tipC: number;
  surchargeC: number;
  /** Idempotency reference; the terminal must never charge the same reference twice. */
  reference: string;
}

export type CardChargeResult =
  { status: 'approved'; transactionRef: string } | { status: 'declined' | 'unavailable' | 'error'; message: string };

export interface DeviceHub {
  /** Simulated devices are development-only and are labelled as such in the UI. */
  readonly simulated: boolean;
  /** Initial device states shown on the till. */
  initialStates(): DeviceStates;
  chargeCard(req: CardChargeRequest, states: DeviceStates, signal?: AbortSignal): Promise<CardChargeResult>;
  printKitchenDocket(order: Order, states: DeviceStates): boolean;
  printReceipt(order: Order, states: DeviceStates): boolean;
  openDrawer(states: DeviceStates): boolean;
}

export const DEVICE_IDS: DeviceId[] = ['receipt', 'kitchen', 'drawer', 'terminal'];

/** Production default until terminal/printer SDKs are integrated: nothing is pretended to work. */
export const unconnectedDevices: DeviceHub = {
  simulated: false,
  initialStates: () => Object.fromEntries(DEVICE_IDS.map((id) => [id, 'offline' as DeviceState])) as DeviceStates,
  chargeCard: async () => ({
    status: 'unavailable',
    message: 'No card terminal is connected to this till — no charge was made. Take cash or another method.',
  }),
  printKitchenDocket: () => false,
  printReceipt: () => false,
  openDrawer: () => false,
};
