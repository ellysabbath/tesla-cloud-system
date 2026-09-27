import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/api';

const AccountVerify: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyAccount = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setError('Invalid verification link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.verifyAccount(token);
        
        if (response.success) {
          setStatus('success');
          // Auto redirect after 3 seconds
          setTimeout(() => {
            navigate('/my-profile');
          }, 3000);
        } else {
          setStatus('error');
          setError(response.message);
        }
      } catch (err) {
        setStatus('error');
        setError('Verification failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold">
            TESLA CLOUD
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {isLoading || status === 'verifying' ? (
            <>
              <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-xl font-bold mb-2">Verifying Your Account</h1>
              <p className="text-gray-600">Please wait while we verify your account...</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2">Account Verified!</h1>
              <p className="text-gray-600 mb-6">
                Your account has been successfully verified. You will be redirected to your profile shortly.
              </p>
              <Link to="/my-profile">
                <Button fullWidth>Go to My Profile</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link to="/signup">
                <Button fullWidth>Try Again</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountVerify;