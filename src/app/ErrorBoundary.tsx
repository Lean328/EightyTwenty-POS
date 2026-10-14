import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StatusScreen } from './StatusScreen';

interface State {
  error: Error | null;
}

/** Last line of defence: an unexpected render error shows a recovery screen instead of a blank till. */
export class ErrorBoundary extends Component<{ children: ReactNode; onError?: () => void }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('POS render error', error, info.componentStack);
    this.props.onError?.();
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <StatusScreen title="Something went wrong on this screen" action={{ label: 'Reload the till', go: () => location.reload() }}>
        Your cart and any sales not yet synced are saved on this device. Reload to continue. If this keeps happening, contact EightyTwenty
        support.
      </StatusScreen>
    );
  }
}
