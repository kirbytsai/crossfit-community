// src/app/(dashboard)/tracker/[scoreId]/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Score, WOD } from '@/types';

interface ScoreWithWod extends Score {
  wodId: WOD;
}

interface PageProps {
  params: Promise<{
    scoreId: string;
  }>;
}

export default function ScoreDetailPage({ params }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<ScoreWithWod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scoreId, setScoreId] = useState<string>('');

  // 解開 params Promise
  useEffect(() => {
    params.then(p => setScoreId(p.scoreId));
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && scoreId) {
      fetchScore();
    }
  }, [user, scoreId]);

  const fetchScore = async () => {
    try {
      const response = await fetch(`/api/scores/${scoreId}`);
      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
      } else if (response.status === 404) {
        toast.error('Score not found');
        router.push('/tracker');
      }
    } catch (error) {
      console.error('Failed to fetch score:', error);
      toast.error('Failed to load score details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this score?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/scores/${scoreId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Score deleted successfully');
        router.push('/tracker');
      } else {
        throw new Error('Failed to delete score');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete score');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFeelingEmoji = (rating?: number) => {
    if (!rating) return '';
    const emojis = ['😵', '😓', '😊', '💪', '🔥'];
    return emojis[rating - 1];
  };

  const formatMovement = (movement: any) => {
    let result = movement.name;
    if (movement.reps) {
      result = `${movement.reps} ${result}`;
    }
    if (movement.weight?.male || movement.weight?.female) {
      result += ` (${movement.weight.male || movement.weight.female})`;
    }
    return result;
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

  if (!score) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/tracker"
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back to Tracker
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{score.wodId.name}</h1>
              <p className="text-slate-600 mt-2">
                {new Date(score.details.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/tracker/${scoreId}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Score Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Performance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Score</p>
              <p className="text-3xl font-bold text-slate-900">{score.performance.score}</p>
            </div>
            
            <div>
              <p className="text-sm text-slate-600 mb-1">Type</p>
              <div className="flex items-center gap-2">
                <p className="text-lg text-slate-900">{score.performance.scoringType}</p>
                {score.performance.rxd && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    RX
                  </span>
                )}
                {score.performance.scaled && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Scaled
                  </span>
                )}
              </div>
            </div>

            {score.details.feelingRating && (
              <div>
                <p className="text-sm text-slate-600 mb-1">How it felt</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{getFeelingEmoji(score.details.feelingRating)}</span>
                  <span className="text-lg text-slate-700">{score.details.feelingRating}/5</span>
                </div>
              </div>
            )}
          </div>

          {score.details.notes && (
            <div className="mt-6">
              <p className="text-sm text-slate-600 mb-2">Notes</p>
              <p className="text-slate-700 whitespace-pre-wrap">{score.details.notes}</p>
            </div>
          )}
        </div>

        {/* WOD Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Workout Details</h2>
          
          {score.wodId.description && (
            <p className="text-slate-700 mb-4">{score.wodId.description}</p>
          )}

          {/* Movements */}
          {score.wodId.structure?.movements && score.wodId.structure.movements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Movements</h3>
              <ul className="space-y-2">
                {score.wodId.structure.movements.map((movement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-slate-400 mr-2">•</span>
                    <span className="text-slate-700">{formatMovement(movement)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Workout Structure */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {score.wodId.structure?.rounds && (
              <div>
                <p className="text-sm text-slate-600">Rounds</p>
                <p className="font-semibold text-slate-900">{score.wodId.structure.rounds}</p>
              </div>
            )}
            
            {score.wodId.structure?.timeLimit && (
              <div>
                <p className="text-sm text-slate-600">Time Limit</p>
                <p className="font-semibold text-slate-900">
                  {Math.floor(score.wodId.structure.timeLimit / 60)} min
                </p>
              </div>
            )}

            {score.wodId.classification?.difficulty && (
              <div>
                <p className="text-sm text-slate-600">Difficulty</p>
                <p className="font-semibold text-slate-900">
                  Level {score.wodId.classification.difficulty}
                </p>
              </div>
            )}
          </div>

          {/* Equipment */}
          {score.wodId.classification?.equipment && score.wodId.classification.equipment.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2">Equipment</p>
              <div className="flex flex-wrap gap-2">
                {score.wodId.classification.equipment.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}