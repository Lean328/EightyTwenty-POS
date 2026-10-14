import { useStore } from '../../app/storeContext';
import { OpsLayout } from './OpsLayout';
import { buildOpsShell } from './ops.view';

/** Entry point of the back-office chunk (loaded separately from the till). */
export default function OpsScreen() {
  const store = useStore();
  return <OpsLayout v={buildOpsShell(store)} />;
}
