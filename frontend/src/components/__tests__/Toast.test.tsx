import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast } from '../Toast';

const TestComponent: React.FC = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => showToast('Success Message', 'success')}>
        Show Success
      </button>
      <button type="button" onClick={() => showToast('Error Message', 'error')}>
        Show Error
      </button>
      <button type="button" onClick={() => showToast('Default Info')}>
        Show Info
      </button>
    </div>
  );
};

const BadComponent: React.FC = () => {
  useToast();
  return <div>Bad</div>;
};

describe('Toast Component and Provider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('throws error when useToast is used outside ToastProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyReportError = jest.fn();
    const originalReportError = window.reportError;
    window.reportError = spyReportError;

    const errorHandler = jest.fn((e) => e.preventDefault());
    window.addEventListener('error', errorHandler);

    let caughtSyncError: Error | null = null;
    try {
      render(<BadComponent />);
    } catch (e) {
      caughtSyncError = e instanceof Error ? e : new Error(String(e));
    }

    const hasExpectedError = 
      caughtSyncError?.message.includes('useToast must be used within a ToastProvider') ||
      spyReportError.mock.calls.some(call => call[0] instanceof Error && call[0].message.includes('useToast must be used within a ToastProvider')) ||
      errorHandler.mock.calls.some(call => call[0] && (call[0].message || '').includes('useToast must be used within a ToastProvider')) ||
      consoleError.mock.calls.some(call => {
        const msg = call[0] instanceof Error ? call[0].message : String(call[0]);
        return msg.includes('useToast must be used within a ToastProvider');
      });

    expect(hasExpectedError).toBe(true);

    window.removeEventListener('error', errorHandler);
    window.reportError = originalReportError;
    consoleError.mockRestore();
  });

  test('shows and removes toast notification successfully', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    const toast = screen.getByText('Success Message');
    expect(toast).toBeInTheDocument();
    expect(toast.parentElement).toHaveClass('toast-success');

    // Click to dismiss
    const closeBtn = screen.getByLabelText('Dismiss notification');
    fireEvent.click(closeBtn);
    expect(toast).not.toBeInTheDocument();
  });

  test('auto dismisses toast after timeout', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));
    const toast = screen.getByText('Error Message');
    expect(toast).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    expect(toast).not.toBeInTheDocument();
  });

  test('renders multiple types of toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    const toast = screen.getByText('Default Info');
    expect(toast).toBeInTheDocument();
    expect(toast.parentElement).toHaveClass('toast-info');
  });
});
