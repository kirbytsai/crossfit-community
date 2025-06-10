'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {user.profilePicture && (
                <Image
                  src={user.profilePicture}
                  alt={user.displayName}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{user.displayName}</h2>
                <p className="text-gray-600">@{user.username}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">User ID: {user.id}</p>
            </div>

            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}