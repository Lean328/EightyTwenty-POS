import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SyncDialog } from './SyncDialog';

describe('sync dialog', () => {
  it('shows a rejected order and the server message', () => {
    const retry = vi.fn();
    const d = {
      close: vi.fn(),
      syncNow: vi.fn(),
      statusLine: '1 change rejected · manager review required',
      canToggle: false,
      hasConflicts: false,
      hasQueue: false,
      hasLog: false,
      devTools: false,
      devices: [],
      rejected: [{
        id: 'command-1',
        label: 'order.create · ORDER-1',
        error: 'Order rejected',
        canRetry: true,
        retry,
      }],
    } as unknown as ComponentProps<typeof SyncDialog>['d'];

    render(<SyncDialog d={d} />);

    expect(screen.getByText('Changes needing review')).toBeInTheDocument();
    expect(screen.getByText('order.create · ORDER-1')).toBeInTheDocument();
    expect(screen.getByText('Order rejected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry order after review' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
