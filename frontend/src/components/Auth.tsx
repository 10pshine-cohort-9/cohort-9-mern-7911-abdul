import React, { useState } from 'react';
import { api, type UserResponse } from '../utils/api';
import { useToast } from './Toast';

interface AuthProps {
  onAuthSuccess: (user: UserResponse) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleToggle = () => {
    setIsLogin((prev) => !prev);
    setName('');
    setEmail('');
    setPassword('');
  };

  const validateForm = (): boolean => {
    if (!isLogin && !name.trim()) {
      showToast('Name is required', 'error');
      return false;
    }
    if (!email.trim()) {
      showToast('Email is required', 'error');
      return false;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
    if (!password) {
      showToast('Password is required', 'error');
      return false;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await api.signIn({ email, password });
        if (res.success && res.token && res.user) {
          api.setToken(res.token);
          showToast(res.message || 'Signed in successfully', 'success');
          onAuthSuccess(res.user);
        }
      } else {
        const res = await api.signUp({ name, email, password });
        if (res.success && res.token && res.user) {
          api.setToken(res.token);
          showToast(res.message || 'Registered successfully', 'success');
          onAuthSuccess(res.user);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to access your notes hub' : 'Sign up to start organizing your ideas'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">
                Full Name
              </label>
              <input
                id="name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Abdul Hanan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isLoading}>
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button type="button" className="btn-text" onClick={handleToggle} disabled={isLoading}>
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button type="button" className="btn-text" onClick={handleToggle} disabled={isLoading}>
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
