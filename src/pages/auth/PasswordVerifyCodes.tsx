import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/api';

const PasswordVerifyCodes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const incomingEmail =
    (location.state as { email?: string } | null)?.email ?? '';

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [email, setEmail] = useState(incomingEmail);
  const [code, setCode] = useState('');

  // ---------- Verify ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.verifyResetCodes(cleanEmail, cleanCode);

      if (response.success) {
        const resetToken = response.resetToken;
        if (!resetToken) {
          setError('The server did not return a reset token. Please try again.');
          return;
        }
        navigate('/reset-now', { state: { resetToken } });
      } else {
        setError(response.message || 'Invalid or expired code.');
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Resend ----------
  const handleResend = async () => {
    setError('');
    setInfo('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Enter your email above, then click Resend.');
      return;
    }

    setIsResending(true);
    try {
      const response = await authApi.requestPasswordReset({
        email: cleanEmail,
      });
      if (response.success) {
        setInfo(
          'If that email is registered, a new reset code has been sent. Check your inbox.'
        );
      } else {
        setError(response.message || 'Could not resend the code.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // ---------- Input: only digits, max 6 ----------
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold">
            TESLA CLOUD
          </Link>
          <h1 className="text-2xl font-bold mt-4">Verify Reset Code</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code we sent to your email
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-[11px] text-gray-500 mt-2 text-center">
                The code expires 15 minutes after it was sent.
              </p>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordVerifyCodes;