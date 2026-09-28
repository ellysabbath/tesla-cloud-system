import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi } from '../../api/api';

const ResetNow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken =
    (location.state as { resetToken?: string } | null)?.resetToken ?? '';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetToken) {
      setError(
        'Your reset session has expired. Please start again from the reset page.'
      );
      return;
    }

    if (!formData.password) {
      setError('Please enter a new password');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        resetToken,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.success) {
        // Backend already issued JWTs — the user is signed in
        navigate('/dashboard');
      } else {
        setError(response.message || 'Could not reset the password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold">
            TESLA CLOUD
          </Link>
          <h1 className="text-2xl font-bold mt-4">Set New Password</h1>
          <p className="text-gray-600 mt-2">
            Choose a strong password for your account
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          {!resetToken && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6 text-sm">
              No active reset session. Please{' '}
              <Link
                to="/password-reset-request"
                className="font-medium underline"
              >
                start again
              </Link>
              .
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="New Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password (min 6 characters)"
              required
              
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
              
            />

            <Button
              type="submit"
              fullWidth
              disabled={isLoading || !resetToken}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Remember your password?{' '}
            <Link to="/signin" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetNow;