import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi } from '../../api/api';

const PasswordResetRequest: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError('Please enter your email address');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.requestPasswordReset({ email: clean });

      if (response.success) {
        // Forward the email so the next page can prefill it
        navigate('/password-verify-codes', { state: { email: clean } });
      } else {
        setError(response.message || 'Could not send the reset code.');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(
        'Could not reach the server. Please check your connection and try again.'
      );
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
          <h1 className="text-2xl font-bold mt-4">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            Enter your email to receive a reset code
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              
            />

            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
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

export default PasswordResetRequest;