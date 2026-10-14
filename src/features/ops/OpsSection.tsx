import { useStore } from '../../app/storeContext';
import type { SectionRoute } from '../../state/types';
import { buildCatering, buildReservations } from './bookings.view';
import { Catering } from './Catering';
import { Customers } from './Customers';
import { Dashboard } from './Dashboard';
import { buildDashboard } from './dashboard.view';
import { GiftCards } from './GiftCards';
import { buildCustomers, buildGift, buildLoyalty } from './guests.view';
import { Inventory } from './Inventory';
import { buildInventory } from './inventory.view';
import { Loyalty } from './Loyalty';
import { OrdersBoard } from './OrdersBoard';
import { buildOrders } from './orders.view';
import { Reports } from './Reports';
import { buildReports } from './reports.view';
import { Reservations } from './Reservations';
import { Settings } from './Settings';
import { buildSettings } from './settings.view';
import { StaffRoles } from './StaffRoles';
import { buildStaff } from './staff.view';

/** The active back-office page. Only the visible page's view-model is built. */
export function OpsSection({ route }: { route: SectionRoute }) {
  const store = useStore();
  switch (route) {
    case 'dashboard':
      return <Dashboard o={buildDashboard(store)} />;
    case 'orders':
      return <OrdersBoard o={buildOrders(store)} />;
    case 'reservations':
      return <Reservations o={buildReservations(store)} />;
    case 'catering':
      return <Catering o={buildCatering(store)} />;
    case 'customers':
      return <Customers o={buildCustomers(store)} />;
    case 'loyalty':
      return <Loyalty o={buildLoyalty(store)} />;
    case 'gift':
      return <GiftCards o={buildGift(store)} />;
    case 'inventory':
      return <Inventory o={buildInventory(store)} />;
    case 'reports':
      return <Reports o={buildReports(store)} />;
    case 'staff':
      return <StaffRoles o={buildStaff(store)} />;
    case 'settings':
      return <Settings o={buildSettings(store)} />;
  }
}
