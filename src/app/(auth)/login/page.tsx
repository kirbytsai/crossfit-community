'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const description = searchParams.get('description');
    
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_state':
          setError('Security validation failed. Please try again.');
          break;
        case 'no_code':
          setError('Authorization failed. Please try again.');
          break;
        case 'token_exchange_failed':
          setError('Failed to authenticate with LINE. Please try again.');
          break;
        case 'server_error':
          setError('Server error occurred. Please try again later.');
          break;
        default:
          setError(description || 'An error occurred during login.');
      }
    }
  }, [searchParams]);

  const handleLineLogin = () => {
    window.location.href = '/api/auth/line/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CrossFit Community
          </h1>
          <p className="text-gray-600">
            Track your WODs, connect with athletes
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button
            onClick={handleLineLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-white bg-[#00B900] hover:bg-[#00A000] rounded-md font-medium transition-colors"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13h4v6h-4zm0 8h4v2h-4z" />
            </svg>
            Login with LINE
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          By logging in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}