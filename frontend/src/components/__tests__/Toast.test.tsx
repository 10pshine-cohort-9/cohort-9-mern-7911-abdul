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
    expect(() => render(<BadComponent />)).toThrow('useToast must be used within a ToastProvider');
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
