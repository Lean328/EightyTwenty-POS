// View-model for the kitchen display: header, connection state, tickets for this station, ready and recent rails.
import {
  elapsedMs,
  fmtElapsed,
  isOnBoard,
  isTracked,
  lineDietFlags,
  linePrep,
  lineStation,
  orderDietFlags,
  placedAtMs,
  PREP_HOLD_MESSAGE,
  prepHold,
  removedItems,
  STATION_FILTER_LABEL,
  STATION_LABEL,
  stationPrep,
  stationsOf,
  urgencyOf,
  inStation,
  type DietFlag,
  type StationFilter,
} from '../../domain/kitchen';
import { CHANNEL_LABEL, isIncoming, ORDER_TYPE_LABEL, tablesOf } from '../../domain/policies';
import type { Order, OrderLine, PrepStatus, Station } from '../../domain/types';
import { acceptOrder } from '../../state/actions/orders';
import { setOnline } from '../../state/actions/sync';
import {
  assignDevice,
  bumpStation,
  finishTicket,
  lockKitchen,
  recallTicket,
  setStation,
  toggleLine,
  toggleMute,
} from '../../state/actions/kitchen';
import type { PosStore } from '../../state/store';
import { devSim } from '../devSim';
import type { MonitorSnapshot } from './kitchenMonitor';

/** A ticket is highlighted as new for this long after it first appears. */
const FRESH_MS = 30_000;
const RECENT_COMPLETED = 6;

export const KDS = {
  ivory: '#FFFCF7',
  cream: '#F7F2EA',
  linen: '#ECE4D7',
  sand: '#E9C89E',
  caramel: '#B67A4B',
  caramelDark: '#8B5827',
  espresso: '#2C1A12',
  roast: '#3A2B24',
  muted: '#8C7A6E',
  foam: '#F5EDE2',
  green: '#3E6B47',
  greenBg: '#EEF1E4',
  greenFg: '#4E6538',
  red: '#8A2E1C',
  redBg: '#FBE9E4',
  redLine: '#9A4436',
} as const;

const CHANNEL_TONE = {
  pos: [KDS.linen, KDS.roast],
  web: [KDS.sand, KDS.espresso],
  app: [KDS.espresso, KDS.foam],
} as const;

const URGENCY_TONE = {
  ok: { bar: KDS.espresso, fg: KDS.foam, label: '' },
  warn: { bar: KDS.caramel, fg: KDS.ivory, label: 'Running late' },
  late: { bar: KDS.red, fg: '#FFFFFF', label: 'Overdue' },
} as const;

const PREP_LABEL: Record<PrepStatus, string> = { new: 'Not started', preparing: 'Preparing', ready: 'Ready' };

const firstName = (name?: string) => (name || '').split(' ')[0];

export interface KitchenViewInput {
  now: number;
  monitor: MonitorSnapshot;
  dismissAlert: (key: string) => void;
  /** Commands waiting in this device's outbox. */
  pending: number;
}

export function buildKitchenView(store: PosStore, { now, monitor, dismissAlert, pending }: KitchenViewInput) {
  const s = store.state;
  const { menuById } = s.catalog;
  const station = s.device.station;
  const signedIn = store.signedIn && store.can('kitchen');
  const here = s.orders.filter((o) => o.cafe === s.cafe);
  const customerOf = (o: Order) => s.customers.find((c) => c.id === o.customerId);

  const service = (o: Order) => {
    const c = customerOf(o);
    const tables = tablesOf(o);
    if (o.type === 'dinein') return `${ORDER_TYPE_LABEL.dinein}${tables.length ? ' · Table ' + tables.join(' + ') : ''}`;
    return `${ORDER_TYPE_LABEL[o.type]}${c ? ' · ' + firstName(c.name) : ''}`;
  };
  const numberParts = (id: string) => {
    const i = id.lastIndexOf('-');
    return i > 0 ? { prefix: id.slice(0, i + 1), number: id.slice(i + 1) } : { prefix: '', number: id };
  };

  // ----- tickets -----
  const boardFor = (st: StationFilter) => here.filter((o) => isOnBoard(o, st, menuById));
  const board = boardFor(station).sort((a, b) => placedAtMs(a, now) - placedAtMs(b, now));

  const lineView = (o: Order, l: OrderLine, held: boolean) => {
    const prep = linePrep(o, l);
    const diet = lineDietFlags(l);
    const dietText = new Set(diet.map((d) => d.text));
    return {
      key: l.key,
      qty: l.qty,
      name: l.name,
      mods: [...Object.values(l.sel || {}).flat(), ...(l.adjust || [])].filter((m) => !dietText.has(m)),
      note: l.note,
      diet,
      prep,
      prepLabel: PREP_LABEL[prep],
      /** Added after the kitchen started this order. */
      added: isTracked(o) && !l.prep && o.status !== 'ready',
      canToggle: signedIn && !held,
      toggle: () => toggleLine(store, o.id, l.key, prep),
    };
  };

  const ticket = (o: Order) => {
    const hold = prepHold(o);
    const held = !!hold;
    const stations = stationsOf(o, menuById);
    const ms = elapsedMs(o, now);
    const urgency = held ? 'ok' : urgencyOf(ms, station === 'all' ? stations : [station]);
    const tone = URGENCY_TONE[urgency];
    const [chanBg, chanFg] = CHANNEL_TONE[o.channel];
    const shown = (st: Station) => station === 'all' || st === station;
    const groups = stations.filter(shown).map((st) => {
      const state = stationPrep(o, st, menuById)!;
      return {
        station: st,
        label: STATION_LABEL[st],
        state,
        stateLabel: PREP_LABEL[state],
        lines: o.lines.filter((l) => lineStation(l, menuById) === st).map((l) => lineView(o, l, held)),
        action:
          station === 'all' && stations.length > 1 && signedIn && !held && state !== 'ready'
            ? { label: state === 'new' ? 'Start' : 'Ready', run: () => bumpStation(store, o.id, st, state) }
            : null,
      };
    });
    const elsewhere = stations
      .filter((st) => !shown(st))
      .map((st) => `${STATION_LABEL[st]} ${PREP_LABEL[stationPrep(o, st, menuById)!].toLowerCase()}`);
    const state = stationPrep(o, station, menuById)!;
    const lineFlags = o.lines.filter((l) => inStation(station, l, menuById)).flatMap(lineDietFlags);
    const alerts = dedupeFlags([...orderDietFlags(o, customerOf(o)), ...lineFlags]);
    const incoming = isIncoming(o);
    const primary =
      !signedIn || held
        ? null
        : state === 'new'
          ? { label: 'Start', tone: 'start' as const, run: () => bumpStation(store, o.id, station, 'new') }
          : state === 'preparing'
            ? {
                label: station === 'all' ? 'Order ready' : `${STATION_LABEL[station]} ready`,
                tone: 'ready' as const,
                run: () => bumpStation(store, o.id, station, 'preparing'),
              }
            : { label: 'Send to pickup', tone: 'ready' as const, run: () => finishTicket(store, o.id) };
    return {
      id: o.id,
      ...numberParts(o.id),
      source: CHANNEL_LABEL[o.channel],
      chanBg,
      chanFg,
      service: service(o),
      elapsed: fmtElapsed(ms),
      urgency,
      urgencyLabel: tone.label,
      barBg: held ? (hold === 'awaiting-acceptance' ? KDS.sand : KDS.redBg) : tone.bar,
      barFg: held ? (hold === 'awaiting-acceptance' ? KDS.espresso : KDS.red) : tone.fg,
      fresh: !!monitor.firstSeen[o.id] && now - monitor.firstSeen[o.id] < FRESH_MS,
      hold: hold
        ? {
            text: PREP_HOLD_MESSAGE[hold],
            danger: hold !== 'awaiting-acceptance',
            accept:
              incoming && store.can('orders')
                ? () => {
                    const cur = store.state.orders.find((x) => x.id === o.id);
                    if (cur && isIncoming(cur)) acceptOrder(store, o.id);
                  }
                : null,
          }
        : null,
      alerts,
      allergy: alerts.some((a) => a.severity === 'allergy'),
      note: o.note || '',
      removed: removedItems(o),
      queued: !!o.queued,
      groups,
      showGroupHeads: groups.length > 1,
      elsewhere: elsewhere.length ? `Also on this order: ${elsewhere.join(' · ')}` : '',
      primary,
    };
  };

  // ----- ready and recently completed -----
  const readyRows = here
    .filter((o) => {
      if (o.status === 'ready') return stationPrep(o, station, menuById) !== null;
      return station !== 'all' && (o.status === 'preparing' || o.status === 'new') && stationPrep(o, station, menuById) === 'ready';
    })
    .sort((a, b) => placedAtMs(a, now) - placedAtMs(b, now))
    .map((o) => {
      const waiting = o.status !== 'ready';
      const others = stationsOf(o, menuById).filter((st) => st !== station && stationPrep(o, st, menuById) !== 'ready');
      return {
        id: o.id,
        ...numberParts(o.id),
        service: service(o),
        label: waiting
          ? `Done here · waiting on ${others.map((st) => STATION_LABEL[st]).join(' + ')}`
          : o.type === 'delivery'
            ? 'Out for delivery'
            : 'Ready for pickup',
        waiting,
        recall: signedIn ? () => recallTicket(store, o.id, station) : null,
      };
    });
  const recentRows = here
    .filter((o) => o.status === 'completed' && stationPrep(o, station, menuById) !== null)
    .slice(0, RECENT_COMPLETED)
    .map((o) => ({ id: o.id, ...numberParts(o.id), service: service(o), summary: summaryOf(o, station, menuById) }));

  // ----- connection -----
  const local = store.backend.kind === 'local';
  const rejected = store.outbox.rejected.filter((r) => r.command.type === 'order.prep').length;
  const time = (iso: string) => (iso ? new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : '');
  const banner = !s.online
    ? {
        tone: 'danger' as const,
        title: 'Offline — working from this screen',
        body: `Ticket updates are saved here and sent when the connection returns${pending ? ` (${pending} waiting)` : ''}. New website and app orders cannot arrive until then.`,
      }
    : rejected
      ? {
          tone: 'danger' as const,
          title: `${rejected} kitchen update${rejected === 1 ? ' was' : 's were'} refused by the server`,
          body: 'The order changed elsewhere. Check those orders with the front counter.',
        }
      : s.orderFeed && !s.orderFeed.ok
        ? {
            tone: 'warn' as const,
            title: 'Reconnecting to the EightyTwenty server…',
            body: `Live order updates are paused${s.orderFeed.at ? ' since ' + time(s.orderFeed.at) : ''}. Tickets on screen may be out of date. Retrying automatically.`,
          }
        : pending
          ? {
              tone: 'warn' as const,
              title: `Sending ${pending} update${pending === 1 ? '' : 's'}…`,
              body: 'Waiting for the server to confirm. Retrying automatically.',
            }
          : s.offlineSince
            ? {
                tone: 'warn' as const,
                title: 'Started from saved data',
                body: `The server could not be reached at start-up. Tickets were saved ${new Date(s.offlineSince).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}.`,
              }
            : null;
  const conn = !s.online
    ? { label: 'Offline', bg: KDS.redBg, fg: KDS.red }
    : banner
      ? { label: pending ? `Syncing · ${pending}` : 'Reconnecting', bg: '#FBF0E1', fg: KDS.caramelDark }
      : { label: local ? 'Online · demo data' : 'Live', bg: KDS.greenBg, fg: KDS.greenFg };

  const st = signedIn ? store.staff() : null;
  const stationDefs: StationFilter[] = ['all', 'kitchen', 'bar'];
  // Replaced at build time: an http build drops the simulator buttons entirely.
  const devTools = import.meta.env.VITE_DATA_PROVIDER !== 'http' && store.config.devTools && local;

  return {
    cafeName: store.location(s.cafe)?.name || '',
    stationLabel: STATION_FILTER_LABEL[station],
    terminalId: store.config.terminalId,
    clock: new Date(now).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }),
    stations: stationDefs.map((id) => ({
      id,
      label: id === 'all' ? 'All' : id === 'kitchen' ? 'Food' : 'Drinks',
      count: boardFor(id).length,
      on: station === id,
      pick: () => setStation(store, id),
    })),
    conn,
    banner,
    /** Development provider: orders live in this browser only — nothing reaches other devices. */
    localNote: local ? 'Demo data on this device only — not shared with other devices.' : '',
    muted: s.device.muted,
    toggleMute: () => toggleMute(store),
    staffName: st ? st.name : '',
    staffInitials: st ? st.initials : '',
    staffRole: st ? store.roleLabel(st) : '',
    lock: () => lockKitchen(store),
    alerts: monitor.alerts.map((a) => ({ ...a, dismiss: () => dismissAlert(a.key) })),
    tickets: board.map(ticket),
    emptyText:
      station === 'all'
        ? 'No tickets. New orders appear here automatically.'
        : `No ${STATION_LABEL[station].toLowerCase()} tickets right now.`,
    readyRows,
    recentRows,
    readyCount: readyRows.filter((r) => !r.waiting).length,
    // settings sheet
    deviceSetBy: s.device.by
      ? `Set up by ${s.device.by}${s.device.at ? ' · ' + new Date(s.device.at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}`
      : '',
    switchToCounter: () => assignDevice(store, 'counter'),
    devTools,
    sims: devTools
      ? [
          { label: 'Website order', run: () => devSim(store, (m) => m.simulateInbound(store, 'web')) },
          { label: 'App order', run: () => devSim(store, (m) => m.simulateInbound(store, 'app')) },
          { label: 'Failed payment', run: () => devSim(store, (m) => m.simulateInbound(store, 'failed')) },
          { label: s.online ? 'Go offline' : 'Back online', run: () => setOnline(store, !s.online) },
        ]
      : [],
  };
}

const dedupeFlags = (flags: DietFlag[]): DietFlag[] => {
  const seen = new Map<string, DietFlag>();
  for (const f of flags) {
    const k = f.text.trim().toLowerCase();
    if (!seen.has(k)) seen.set(k, f);
  }
  return [...seen.values()];
};

const summaryOf = (o: Order, station: StationFilter, menuById: Parameters<typeof inStation>[2]) =>
  o.lines
    .filter((l) => inStation(station, l, menuById))
    .map((l) => (l.qty > 1 ? `${l.qty}× ` : '') + l.name)
    .join(', ');

export type KitchenView = ReturnType<typeof buildKitchenView>;
export type KitchenTicketView = KitchenView['tickets'][number];
