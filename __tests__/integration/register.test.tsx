import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignupScreen from '../app/signup';
import { AuthProvider } from '../app/contexts/AuthContext';
import { storage } from '../app/services/storage';

jest.mock('../app/services/storage', () => ({
  storage: {
    setTokens: jest.fn().mockResolvedValue(undefined),
    setUser: jest.fn().mockResolvedValue(undefined),
    getTokens: jest.fn().mockResolvedValue(null),
    getUser: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
  }),
}));

const mockLogin = jest.fn().mockResolvedValue({ success: true });

jest.mock('../app/contexts/AuthContext', () => {
  const actual = jest.requireActual('../app/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      logout: jest.fn(),
      isLoggedIn: false,
      isLoading: false,
      user: null,
    }),
  };
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Register Screen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render registration form', () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(<SignupScreen />);

    expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
    expect(getByPlaceholderText('Your best email')).toBeTruthy();
    expect(getByPlaceholderText('Create a strong password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('should show validation errors for empty fields', async () => {
    const { getByText } = renderWithProvider(<SignupScreen />);

    const signupButton = getByText('Create Account');
    fireEvent.press(signupButton);

    await waitFor(() => {
      expect(getByText('Full name is required')).toBeTruthy();
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('should show error for invalid email format', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Your best email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'password123');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Please enter a valid email')).toBeTruthy();
    });
  });

  it('should show error for short password', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Your best email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'short');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  it('should call login with correct payload on successful registration', async () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Your best email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'password123');

    const checkbox = getByText('I agree to the Terms of Serviceand Privacy Policy').parent?.parent?.findByType('View');
    if (checkbox) {
      fireEvent.press(checkbox);
    }

    await act(async () => {
      fireEvent.press(getByText('Create Account'));
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  it('should show error for duplicate email (409)', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Email already registered — try login',
    });

    const { getByPlaceholderText, getByText } = renderWithProvider(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Your best email'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'password123');

    const checkbox = getByText('I agree to the Terms of Serviceand Privacy Policy').parent?.parent?.findByType('View');
    if (checkbox) {
      fireEvent.press(checkbox);
    }

    await act(async () => {
      fireEvent.press(getByText('Create Account'));
    });

    await waitFor(() => {
      expect(getByText('Email already registered — try login')).toBeTruthy();
    });
  });

  it('should show field errors from API validation', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      fieldErrors: [
        { field: 'email', message: 'Email domain not allowed' },
      ],
    });

    const { getByPlaceholderText, getByText, queryByText } = renderWithProvider(<SignupScreen />);

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Your best email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Create a strong password'), 'password123');

    const checkbox = getByText('I agree to the Terms of Serviceand Privacy Policy').parent?.parent?.findByType('View');
    if (checkbox) {
      fireEvent.press(checkbox);
    }

    await act(async () => {
      fireEvent.press(getByText('Create Account'));
    });

    await waitFor(() => {
      expect(getByText('Email domain not allowed')).toBeTruthy();
    });
  });

  it('should show loading state while registering', async () => {
    let resolveLogin: (value: { success: boolean }) => void;
    mockLogin.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveLogin = resolve;
      });
    });

    const { getByText, queryByText } = renderWithProvider(<SignupScreen />);

    const fullNameInput = getByText('Enter your full name').parent?.parent as any;
    const emailInput = getByText('Your best email').parent?.parent as any;
    const passwordInput = getByText('Create a strong password').parent?.parent as any;

    if (fullNameInput) fireEvent.changeText(fullNameInput, 'John Doe');
    if (emailInput) fireEvent.changeText(emailInput, 'john@example.com');
    if (passwordInput) fireEvent.changeText(passwordInput, 'password123');

    const checkbox = getByText('I agree to the Terms of Serviceand Privacy Policy').parent?.parent?.findByType('View');
    if (checkbox) {
      fireEvent.press(checkbox);
    }

    await act(async () => {
      fireEvent.press(getByText('Create Account'));
    });

    expect(queryByText('Create Account')).toBeNull();
  });
});
