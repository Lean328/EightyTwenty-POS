// Cash shifts: opening float, cash in / out, close with drawer count and variance approval.
import { fmtC, shiftExpectedC } from '../../domain/ledger';
import type { CashMove, CashShift, ClosedShift, StaffMember } from '../../domain/types';
import { stamp, uid } from '../../lib/ids';
import type { PosStore } from '../store';
import { kickDrawer } from './orders';

export function openShift(store: PosStore, floatC: number): void {
  const st = store.staff();
  const sh: CashShift = {
    id: uid('SH'),
    cafe: store.state.cafe,
    staffId: st.id,
    staffName: st.name,
    openedAt: stamp(),
    float: floatC,
    cashSales: 0,
    cashRefunds: 0,
    moves: [],
    status: 'open',
  };
  store.setState({ shift: sh, dlg: { kind: 'shift' } });
  store.send({ type: 'shift.open', shift: sh });
  store.logAudit('Shift opened', `Opening float ${fmtC(floatC)}`, { amount: floatC, area: 'Cash' });
  store.say(`Shift open · float ${fmtC(floatC)}`);
}

export function cashMove(store: PosStore, type: 'in' | 'out', amountC: number, reason: string, approver: StaffMember | null): void {
  const shift = store.state.shift;
  if (!shift) return;
  const mv: CashMove = {
    id: uid('M'),
    type,
    amount: amountC,
    reason,
    by: store.staff().name,
    approver: approver ? approver.name : '',
    at: stamp(),
  };
  store.setState((s) => ({ shift: s.shift ? { ...s.shift, moves: [...s.shift.moves, mv] } : s.shift, dlg: { kind: 'shift' } }));
  store.send({ type: 'shift.cashMove', shiftId: shift.id, move: mv });
  store.send({
    type: 'transaction.record',
    record: {
      kind: type === 'in' ? 'cash-in' : 'cash-out',
      cafeId: shift.cafe,
      terminalId: store.config.terminalId,
      amountC: type === 'in' ? amountC : -amountC,
      gstC: 0,
      at: new Date().toISOString(),
      staff: mv.by,
      reference: mv.id,
    },
  });
  store.logAudit(type === 'in' ? 'Cash in' : 'Cash out', reason, {
    amount: type === 'in' ? amountC : -amountC,
    reason,
    approver: mv.approver,
    area: 'Cash',
  });
  if (store.state.toggles.openDrawer) kickDrawer(store);
}

export function closeShift(store: PosStore, countedC: number, noteText: string, approver: StaffMember | null): void {
  const sh = store.state.shift;
  if (!sh) return;
  const exp = shiftExpectedC(sh);
  const closed: ClosedShift = {
    ...sh,
    status: 'closed',
    closedAt: stamp(),
    closedBy: store.staff().name,
    counted: countedC,
    expected: exp,
    variance: countedC - exp,
    note: noteText,
    approvedBy: approver ? approver.name : '',
  };
  store.setState((s) => ({ shift: null, shifts: [closed, ...(s.shifts || [])], dlg: { kind: 'shift', summary: closed.id } }));
  store.send({ type: 'shift.close', shift: closed });
  store.logAudit('Shift closed', `Expected ${fmtC(exp)} · counted ${fmtC(countedC)} · variance ${fmtC(countedC - exp)}`, {
    amount: countedC - exp,
    reason: noteText,
    approver: closed.approvedBy,
    area: 'Cash',
  });
}
