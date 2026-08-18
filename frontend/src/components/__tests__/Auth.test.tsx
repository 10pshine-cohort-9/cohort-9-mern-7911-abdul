import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Auth } from '../Auth';
import { api } from '../../utils/api';
import { ToastProvider } from '../Toast';

jest.mock('../../utils/api', () => ({
  api: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    getToken: jest.fn().mockReturnValue(null),
    setToken: jest.fn(),
  },
}));

const mockShowToast = jest.fn();
jest.mock('../Toast', () => {
  const original = jest.requireActual('../Toast');
  return {
    ...original,
    useToast: () => ({
      showToast: mockShowToast,
    }),
  };
});

describe('Auth Component', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Sign In form by default', () => {
    render(
      <ToastProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </ToastProvider>
    );

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument();
  });

  test('toggles to Sign Up form and renders Full Name input', () => {
    render(
      <ToastProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </ToastProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign Up$/i })).toBeInTheDocument();
  });

  test('shows validation error if email is missing on sign in submit', () => {
    render(
      <ToastProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </ToastProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    expect(mockShowToast).toHaveBeenCalledWith('Email is required', 'error');
    expect(api.signIn).not.toHaveBeenCalled();
  });

  test('shows validation error if password is too short on sign in submit', () => {
    render(
      <ToastProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    expect(mockShowToast).toHaveBeenCalledWith('Password must be at least 6 characters long', 'error');
    expect(api.signIn).not.toHaveBeenCalled();
  });

  test('calls api.signIn on valid form submit', async () => {
    (api.signIn as jest.Mock).mockResolvedValueOnce({
      success: true,
      token: 'fake-token',
      user: { id: '1', name: 'Test User', email: 'test@example.com', createdAt: '2026-08-18' },
    });

    render(
      <ToastProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.signIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      expect(api.setToken).toHaveBeenCalledWith('fake-token');
      expect(mockOnAuthSuccess).toHaveBeenCalledWith({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: '2026-08-18',
      });
    });
  });
});
