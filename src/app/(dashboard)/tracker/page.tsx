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

export default function TrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scores, setScores] = useState<ScoreWithWod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchScores();
    }
  }, [user, filterMonth]);

  const fetchScores = async () => {
    try {
      const response = await fetch(`/api/scores/user/${user?.id}?month=${filterMonth}`);
      if (response.ok) {
        const data = await response.json();
        setScores(data.scores);
      }
    } catch (error) {
      console.error('Failed to fetch scores:', error);
      toast.error('Failed to load workout history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatScore = (score: ScoreWithWod) => {
    const scoringType = score.wodId.classification.scoringType;
    
    if (scoringType === 'For Time') {
      return score.performance.score;
    } else if (scoringType === 'AMRAP') {
      return score.performance.score;
    } else {
      return score.performance.score;
    }
  };

  const getFeelingEmoji = (rating?: number) => {
    if (!rating) return '';
    const emojis = ['😵', '😓', '😊', '💪', '🔥'];
    return emojis[rating - 1];
  };

  const groupScoresByDate = (scores: ScoreWithWod[]) => {
    const grouped: Record<string, ScoreWithWod[]> = {};
    scores.forEach(score => {
      const date = new Date(score.details.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(score);
    });
    return grouped;
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

  const groupedScores = groupScoresByDate(scores);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">My Tracker</h1>
          <p className="text-slate-600 mt-2">Track your workout history and progress</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <div className="text-sm text-slate-600">
              {scores.length} workout{scores.length !== 1 ? 's' : ''} recorded
            </div>
          </div>
          <Link
            href="/tracker/new"
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Record New Score
          </Link>
        </div>

        {/* Scores List */}
        {Object.keys(groupedScores).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-500 mb-4">
              No workouts recorded for {new Date(filterMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <Link
              href="/tracker/new"
              className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Record Your First Workout
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedScores).map(([date, dayScores]) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">{date}</h2>
                <div className="space-y-3">
                  {dayScores.map((score) => (
                    <div
                      key={score._id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            {score.wodId.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="font-mono text-lg text-slate-900">
                              {formatScore(score)}
                            </span>
                            {score.performance.rxd && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                RX
                              </span>
                            )}
                            {score.performance.scaled && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Scaled
                              </span>
                            )}
                            {score.details.feelingRating && (
                              <span className="text-2xl" title={`Feeling: ${score.details.feelingRating}/5`}>
                                {getFeelingEmoji(score.details.feelingRating)}
                              </span>
                            )}
                          </div>
                          {score.details.notes && (
                            <p className="mt-3 text-sm text-slate-600">{score.details.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Link
                            href={`/tracker/${score._id}`}
                            className="text-sm text-slate-600 hover:text-slate-900"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}