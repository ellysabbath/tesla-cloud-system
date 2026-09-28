import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi } from '../../api/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Optional info message passed from Register / AccountVerify / PasswordReset
  const incomingInfo =
    (location.state as { info?: string } | null)?.info ?? '';

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [error, setError] = useState('');
  const [info, setInfo] = useState(incomingInfo);
  const [needsVerification, setNeedsVerification] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    keepMeLoggedIn: false,
  });

  // ============================================================
  // Input change
  // ============================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ============================================================
  // Submit login
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setNeedsVerification(false);

    if (!formData.username.trim() || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login(formData);

      if (response.success) {
        // JWT access + refresh are now held in memory inside api.ts.
        // No localStorage is used.
        navigate('/dashboard');
        return;
      }

      // Unverified account → show a resend button
      if (
        response.success === false &&
        (response as { requiresVerification?: boolean }).requiresVerification
      ) {
        setNeedsVerification(true);
        setError(
          response.message ||
            'Please verify your email before logging in.'
        );
        return;
      }

      setError(response.message || 'Invalid credentials');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        'Could not reach the server. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Resend verification email
  // ============================================================
  const handleResendVerification = async () => {
    const email = formData.username.trim();
    if (!email) {
      setError('Enter your email above, then click Resend.');
      return;
    }

    setIsResending(true);
    setError('');
    setInfo('');

    try {
      const response = await authApi.resendVerification(email);

      if (response.success) {
        setInfo(
          response.message ||
            'If that email is registered, a new verification link has been sent.'
        );
        setNeedsVerification(false);
      } else {
        setError(response.message || 'Could not resend the verification email.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold">
            TESLA CLOUD
          </Link>
          <h1 className="text-2xl font-bold mt-4">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Info banner (from Register / AccountVerify / PasswordReset) */}
          {info && !error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6 text-sm flex items-start gap-2">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>{info}</span>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              <div>{error}</div>

              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-3 text-red-800 font-medium underline hover:no-underline disabled:opacity-50"
                >
                  {isResending
                    ? 'Sending...'
                    : 'Resend verification email →'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Username or Email"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username: eg. TESLA-2026-0001"
              required
              autoComplete="username"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="keepMeLoggedIn"
                  name="keepMeLoggedIn"
                  checked={formData.keepMeLoggedIn}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label
                  htmlFor="keepMeLoggedIn"
                  className="text-sm text-gray-600"
                >
                  Keep me logged in
                </label>
              </div>
              <Link
                to="/password-reset-request"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;