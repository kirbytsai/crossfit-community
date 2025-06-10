'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to CrossFit Community
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Track your WODs, connect with athletes, achieve your goals
          </p>

          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-lg">Welcome back, {user.displayName}!</p>
              <Link
                href="/profile"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Profile
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
            >
              Login with LINE
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}