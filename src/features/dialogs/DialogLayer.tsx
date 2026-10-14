import { useStore } from '../../app/storeContext';
import { closeDialog } from '../../state/actions/auth';
import type { PosStore } from '../../state/store';
import type { Dialog } from '../../state/types';
import { CustomerDialog } from './CustomerDialog';
import { DiscountDialog } from './DiscountDialog';
import { ItemDialog } from './ItemDialog';
import {
  buildOrderActionDialog,
  buildPayDialog,
  buildReceiptDialog,
  buildShiftDialog,
  buildSyncDialog,
  buildTableDialog,
} from './money-dialogs.view';
import { NoteDialog } from './NoteDialog';
import { OrderActionDialog } from './OrderActionDialog';
import { PayDialog } from './PayDialog';
import { PickDialog } from './PickDialog';
import { PinDialog } from './PinDialog';
import { ReceiptDialog } from './ReceiptDialog';
import { ShiftDialog } from './ShiftDialog';
import { StaffDialog } from './StaffDialog';
import { SyncDialog } from './SyncDialog';
import { TableDialog } from './TableDialog';
import {
  buildCustomerDialog,
  buildDiscountDialog,
  buildItemDialog,
  buildNoteDialog,
  buildPickDialog,
  buildPinDialog,
  buildStaffDialog,
} from './till-dialogs.view';

/** Backdrop plus the one open dialog. */
export function DialogLayer() {
  const store = useStore();
  const d = store.state.dlg;
  if (!d) return null;
  return (
    <>
      <div
        onClick={() => closeDialog(store)}
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(44,26,18,.42)', animation: 'fadeIn .18s ease' }}
      />
      {renderDialog(store, d)}
    </>
  );
}

function renderDialog(store: PosStore, d: Dialog) {
  switch (d.kind) {
    case 'item':
      return <ItemDialog d={buildItemDialog(store, d)} />;
    case 'customer':
      return <CustomerDialog d={buildCustomerDialog(store, d)} />;
    case 'discount':
      return <DiscountDialog d={buildDiscountDialog(store, d)} />;
    case 'pay':
      return <PayDialog d={buildPayDialog(store, d)} />;
    case 'receipt': {
      const v = buildReceiptDialog(store, d);
      return v ? <ReceiptDialog d={v} /> : null;
    }
    case 'shift': {
      const v = buildShiftDialog(store, d);
      return v ? <ShiftDialog d={v} /> : null;
    }
    case 'ordact': {
      const v = buildOrderActionDialog(store, d);
      return v ? <OrderActionDialog d={v} /> : null;
    }
    case 'table': {
      const v = buildTableDialog(store, d);
      return v ? <TableDialog d={v} /> : null;
    }
    case 'sync':
      return <SyncDialog d={buildSyncDialog(store)} />;
    case 'pin':
      return <PinDialog d={buildPinDialog(store, d)} />;
    case 'note':
      return <NoteDialog d={buildNoteDialog(store)} />;
    case 'cafe':
    case 'tablePick':
      return <PickDialog d={buildPickDialog(store, d)} />;
    case 'staff':
      return <StaffDialog d={buildStaffDialog(store)} />;
  }
}
