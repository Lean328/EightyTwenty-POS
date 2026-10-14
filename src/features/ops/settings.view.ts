import type { ChangeEvent } from 'react';
import type { BusinessRuleKey, DeviceId, DeviceState, LocationField, TillToggles } from '../../domain/types';
import { removeKey } from '../../lib/storage';
import { kickDrawer } from '../../state/actions/orders';
import { setOnline } from '../../state/actions/sync';
import type { PosStore } from '../../state/store';
import { gate, scope, tab, toggleStyle } from './common';

type Input = ChangeEvent<HTMLInputElement>;

export function buildSettings(store: PosStore) {
  const s = store.state,
    { focusCafe: cafeId } = scope(store);
  const loc = store.location(cafeId);
  const canEdit = store.can('settings');
  const sim = store.devices.simulated;
  const cf = s.cafeFields[cafeId] || {};
  const pushSettings = () => {
    const { rules, toggles, cafeFields } = store.state;
    store.sendDebounced('settings', { type: 'settings.update', patch: { rules, toggles, cafeFields } });
  };
  const field = (k: string, key: LocationField) => ({
    k,
    v: cf[key] != null ? cf[key] : loc?.[key] || '',
    readOnly: !canEdit,
    set: (e: Input) => {
      if (!store.can('settings')) return;
      store.setState((st) => ({ cafeFields: { ...st.cafeFields, [cafeId]: { ...(st.cafeFields[cafeId] || {}), [key]: e.target.value } } }));
      pushSettings();
    },
  });
  const rule = (k: string, sub: string, key: BusinessRuleKey, def: string) => ({
    k,
    sub,
    v: s.rules[key] != null ? s.rules[key] : def,
    readOnly: !canEdit,
    set: (e: Input) => {
      if (!store.can('settings')) return;
      store.setState((st) => ({ rules: { ...st.rules, [key]: e.target.value } }));
      pushSettings();
    },
  });
  const tg = (k: string, sub: string, key: keyof TillToggles) => ({
    k,
    sub,
    on: !!s.toggles[key],
    ...toggleStyle(!!s.toggles[key]),
    toggle: () =>
      gate(store, 'settings', `Change “${k}”`, () => {
        store.setState((st) => ({ toggles: { ...st.toggles, [key]: !st.toggles[key] } }));
        pushSettings();
      }),
  });
  const dev = s.devices;
  const devDefs: [DeviceId, string, string][] = [
    ['receipt', 'Receipt printer', 'Epson TM-m30III · LAN 192.168.1.40'],
    ['kitchen', 'Kitchen docket printer', 'Epson TM-T82X · LAN 192.168.1.41'],
    ['drawer', 'Cash drawer', 'Connected via receipt printer'],
    ['terminal', 'Card terminal', 'Tyro / Square Terminal · pairing pending'],
  ];
  const devices = devDefs.map(([id, name, sub]) => {
    const st = dev[id] || 'online';
    const optDefs: [DeviceState, string][] = [
      ['online', 'Online'],
      ['offline', 'Offline'],
      ...(id === 'receipt' || id === 'kitchen' ? ([['paper', 'Paper out']] as [DeviceState, string][]) : []),
    ];
    return {
      id,
      name,
      sub: sim ? sub : 'Integration pending — not connected to this till',
      state: !sim ? 'Not connected' : st === 'online' ? 'Online' : st === 'paper' ? 'Paper out' : 'Offline',
      bg: sim && st === 'online' ? '#EEF1E4' : '#FBE9E4',
      fg: sim && st === 'online' ? '#4E6538' : '#8A2E1C',
      // Device states can only be switched by hand in the development simulator.
      opts: sim
        ? optDefs.map(([v, l]) => ({
            v,
            l,
            on: st === v,
            ...tab(st === v),
            pick: () => {
              store.setState({ devices: { ...store.state.devices, [id]: v } });
              store.logAudit('Device status changed', `${name} → ${l} (simulated)`, { area: 'Devices' });
            },
          }))
        : [],
      test: () => {
        if (!sim) return store.say(`${name} is not connected to this till yet`);
        if (id === 'drawer') {
          if (kickDrawer(store)) store.say('Drawer kicked (simulated)');
          return;
        }
        if (id === 'terminal')
          return store.say(st === 'online' ? 'Terminal responded · ready (simulated)' : 'Terminal not responding (simulated)');
        store.say(
          st === 'online'
            ? `Test page sent to ${name} (simulated)`
            : `${name} ${st === 'paper' ? 'is out of paper' : 'is offline'} — nothing printed`,
        );
      },
    };
  });
  const net = toggleStyle(s.online, '#3E6B47');
  const integrations = sim
    ? [
        {
          name: 'Payments terminal',
          sub: 'Card · Apple Pay · Google Pay · real integration pending',
          state: dev.terminal === 'online' ? 'simulated' : 'offline',
          bg: dev.terminal === 'online' ? '#E9C89E' : '#FBE9E4',
          fg: dev.terminal === 'online' ? '#2C1A12' : '#8A2E1C',
        },
        { name: 'Square eGift', sub: 'Online gift card sales', state: 'demo', bg: '#E9C89E', fg: '#2C1A12' },
        { name: 'Apple Wallet passes', sub: 'Loyalty card in Wallet', state: 'demo', bg: '#E9C89E', fg: '#2C1A12' },
      ]
    : [
        { name: 'Payments terminal', sub: 'Card · Apple Pay · Google Pay', state: 'not connected', bg: '#FBE9E4', fg: '#8A2E1C' },
        { name: 'Square eGift', sub: 'Online gift card sales', state: 'not connected', bg: '#FBE9E4', fg: '#8A2E1C' },
        { name: 'Apple Wallet passes', sub: 'Loyalty card in Wallet', state: 'not connected', bg: '#FBE9E4', fg: '#8A2E1C' },
      ];
  return {
    setCafe: {
      name: loc?.name || '',
      fields: [
        field('Display name', 'name'),
        field('Address', 'address'),
        field('Phone', 'phone'),
        field('Opening hours', 'hours'),
        field('Email', 'email'),
      ],
    },
    setRules: [
      rule('GST', 'included in all prices', 'gst', '10%'),
      rule('Card surcharge', 'card and wallet payments', 'surcharge', '2.95%'),
      rule('Delivery fee', 'percentage of order', 'delivery', '10%'),
      rule('Pickup lead time', 'shown on app and web', 'lead', '15 min'),
      rule('Order slot interval', 'online pickup slots', 'slot', '5 min'),
      rule('Last online order', 'before closing', 'cutoff', '30 min'),
    ],
    setToggles: [
      tg('Kitchen docket printer', 'print a ticket when an order is sent to kitchen', 'kitchen'),
      tg('Auto-print customer receipt', 'otherwise offer on screen', 'receipt'),
      tg('Prompt for tips on card', 'terminal tip screen', 'tips'),
      tg('Open cash drawer on cash sale', '', 'openDrawer'),
      tg('Stamp loyalty automatically', 'when a customer is attached and buys a coffee', 'autoStamp'),
    ],
    devices,
    netLine: s.online
      ? `Online${(s.queue || []).length ? ' · ' + s.queue.length + ' waiting to sync' : ' · all synced'}`
      : `Offline · ${(s.queue || []).length} queued on this till`,
    netOn: s.online,
    netBg: net.bg,
    netKnob: net.knob,
    /** The connection can only be switched off by hand in the development simulator. */
    netCanToggle: store.config.devTools,
    toggleNet: () => {
      if (store.config.devTools) setOnline(store, !s.online);
    },
    openSync: () => store.setState({ dlg: { kind: 'sync' } }),
    integrations,
    /** Development only: clear this browser's local data and reload the sample data. */
    canResetDemo: store.backend.kind === 'local' && store.config.devTools,
    resetDemo: () => {
      if (store.backend.kind !== 'local' || !store.config.devTools) return;
      store.stopPersisting();
      ['records', 'session', 'outbox', 'order-seq', 'dev-pins', 'dev-staff'].forEach(removeKey);
      location.reload();
    },
  };
}

export type SettingsView = ReturnType<typeof buildSettings>;
