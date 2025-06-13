'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WOD } from '@/types';

export default function WodsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [wods, setWods] = useState<WOD[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchWods();
    }
  }, [user]);

  const fetchWods = async () => {
    try {
      const response = await fetch(`/api/wods/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setWods(data.wods);
      } else {
        const error = await response.json();
        console.error('Failed to fetch WODs:', error);
      }
    } catch (error) {
      console.error('Failed to fetch WODs:', error);
      toast.error('Failed to load WODs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (wodId: string) => {
    if (!confirm('Are you sure you want to delete this WOD?')) return;

    try {
      const response = await fetch(`/api/wods/${wodId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('WOD deleted successfully');
        setWods(wods.filter(wod => wod._id !== wodId));
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete WOD');
    }
  };

  const filteredWods = wods.filter(wod => {
    if (filter === 'public') return wod.metadata.isPublic;
    if (filter === 'private') return !wod.metadata.isPublic;
    return true;
  });

  const getScoringTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'For Time': 'bg-blue-100 text-blue-800',
      'AMRAP': 'bg-green-100 text-green-800',
      'EMOM': 'bg-purple-100 text-purple-800',
      'Tabata': 'bg-orange-100 text-orange-800',
      'Max Reps': 'bg-yellow-100 text-yellow-800',
      'Max Weight': 'bg-red-100 text-red-800',
      'Not Scored': 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">My WODs</h1>
          <p className="text-slate-600 mt-2">Create and manage your custom workouts</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({wods.length})
            </button>
            <button
              onClick={() => setFilter('public')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'public'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Public ({wods.filter(w => w.metadata.isPublic).length})
            </button>
            <button
              onClick={() => setFilter('private')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'private'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Private ({wods.filter(w => !w.metadata.isPublic).length})
            </button>
          </div>
          <Link
            href="/wods/new"
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Create New WOD
          </Link>
        </div>

        {/* WODs Grid */}
        {filteredWods.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-500 mb-4">
              {filter === 'all' 
                ? "You haven't created any WODs yet" 
                : `No ${filter} WODs found`}
            </p>
            {filter === 'all' && (
              <Link
                href="/wods/new"
                className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Create Your First WOD
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWods.map((wod) => (
              <div
                key={wod._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{wod.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${wod.metadata.isPublic ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {wod.metadata.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                {wod.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{wod.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getScoringTypeColor(wod.classification.scoringType)}`}>
                    {wod.classification.scoringType}
                  </span>
                  {wod.classification.difficulty && (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-800">
                      Level {wod.classification.difficulty}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    href={`/wods/${wod._id}`}
                    className="text-sm font-medium text-slate-900 hover:text-slate-700"
                  >
                    View Details →
                  </Link>
                  <button
                    onClick={() => handleDelete(wod._id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}