'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WOD } from '@/types';

interface PageProps {
  params: Promise<{
    wodId: string;
  }>;
}

export default function WodDetailPage({ params }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [wod, setWod] = useState<WOD | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Unwrap params using React.use()
  const { wodId } = use(params);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (wodId) {
      fetchWod();
    }
  }, [wodId]);

  const fetchWod = async () => {
    try {
      console.log('Fetching WOD with ID:', wodId);
      const response = await fetch(`/api/wods/${wodId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('WOD data:', data);
        setWod(data.wod);
      } else {
        const error = await response.json();
        console.error('API error:', error);
        toast.error(error.error || 'Failed to load WOD');
        router.push('/wods');
      }
    } catch (error) {
      console.error('Failed to fetch WOD:', error);
      toast.error('Failed to load WOD');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this WOD?')) return;

    try {
      const response = await fetch(`/api/wods/${wodId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('WOD deleted successfully');
        router.push('/wods');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete WOD');
    }
  };

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

  if (!wod) {
    return null;
  }

  const isOwner = user?.id === (typeof wod.metadata.createdBy === 'string' ? wod.metadata.createdBy : wod.metadata.createdBy._id);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/wods"
            className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
          >
            ← Back to My WODs
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{wod.name}</h1>
              {wod.description && (
                <p className="text-slate-600 mt-2">{wod.description}</p>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Link
                  href={`/wods/${wod._id}/edit`}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WOD Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoringTypeColor(wod.classification.scoringType)}`}>
              {wod.classification.scoringType}
            </span>
            {wod.classification.difficulty && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                Level {wod.classification.difficulty}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${wod.metadata.isPublic ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
              {wod.metadata.isPublic ? 'Public' : 'Private'}
            </span>
          </div>

          {/* Workout Structure */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Workout Structure</h2>
            {wod.classification.scoringType === 'AMRAP' && wod.structure.timeLimit && (
              <p className="text-slate-700 mb-3">
                {Math.floor(wod.structure.timeLimit / 60)} minute AMRAP
              </p>
            )}
            {wod.structure.rounds && (
              <p className="text-slate-700 mb-3">
                {wod.structure.rounds} rounds for time
              </p>
            )}
          </div>

          {/* Movements */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Movements</h2>
            <div className="space-y-2">
              {wod.structure.movements.map((movement, index) => (
                <div key={index} className="flex items-center gap-3 text-slate-700">
                  <span className="font-mono text-sm text-slate-500">{index + 1}.</span>
                  <span className="font-medium">{movement.name}</span>
                  {movement.reps && (
                    <span className="text-slate-600">× {movement.reps} reps</span>
                  )}
                  {movement.weight && (
                    <span className="text-slate-600">
                      @ {movement.weight.male}/{movement.weight.female} lb
                    </span>
                  )}
                  {movement.notes && (
                    <span className="text-sm text-slate-500">({movement.notes})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          {wod.classification.equipment && wod.classification.equipment.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Equipment Needed</h2>
              <div className="flex flex-wrap gap-2">
                {wod.classification.equipment.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Record Your Score</h2>
          <p className="text-slate-600 mb-4">
            Ready to tackle this WOD? Track your performance in My Tracker.
          </p>
          <Link
            href={`/tracker/new?wodId=${wod._id}`}
            className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Record Score
          </Link>
        </div>

        {/* Metadata */}
        <div className="mt-6 text-sm text-slate-500">
          Created on {new Date(wod.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  );
}