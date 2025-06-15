// src/app/(dashboard)/tracker/[scoreId]/edit/page.tsx
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

export default function EditScorePage({ params }: PageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<ScoreWithWod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scoreId, setScoreId] = useState<string>('');

  // Form fields
  const [scoreTime, setScoreTime] = useState({ minutes: 0, seconds: 0 });
  const [scoreRounds, setScoreRounds] = useState('');
  const [scoreReps, setScoreReps] = useState('');
  const [rxd, setRxd] = useState(false);
  const [scaled, setScaled] = useState(false);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [feelingRating, setFeelingRating] = useState<number>(3);

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
        initializeForm(data.score);
      } else if (response.status === 404) {
        toast.error('Score not found');
        router.push('/tracker');
      }
    } catch (error) {
      console.error('Failed to fetch score:', error);
      toast.error('Failed to load score');
      router.push('/tracker');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeForm = (scoreData: ScoreWithWod) => {
    const scoringType = scoreData.wodId.classification.scoringType;
    
    if (scoringType === 'For Time') {
      const timeParts = scoreData.performance.score.split(':');
      setScoreTime({
        minutes: parseInt(timeParts[0]) || 0,
        seconds: parseInt(timeParts[1]) || 0
      });
    } else if (scoringType === 'AMRAP') {
      const amrapMatch = scoreData.performance.score.match(/(\d+)\s*rounds?(?:\s*\+\s*(\d+)\s*reps?)?/i);
      if (amrapMatch) {
        setScoreRounds(amrapMatch[1] || '');
        setScoreReps(amrapMatch[2] || '');
      }
    } else if (scoringType === 'Max Reps') {
      const repsMatch = scoreData.performance.score.match(/(\d+)\s*reps?/i);
      if (repsMatch) {
        setScoreReps(repsMatch[1] || '');
      }
    }

    setRxd(scoreData.performance.rxd || false);
    setScaled(scoreData.performance.scaled || false);
    setDate(new Date(scoreData.details.date).toISOString().split('T')[0]);
    setNotes(scoreData.details.notes || '');
    setFeelingRating(scoreData.details.feelingRating || 3);
  };

  const formatScore = (): string => {
    if (!score) return '';
    const scoringType = score.wodId.classification.scoringType;

    if (scoringType === 'For Time') {
      return `${scoreTime.minutes.toString().padStart(2, '0')}:${scoreTime.seconds.toString().padStart(2, '0')}`;
    } else if (scoringType === 'AMRAP') {
      return scoreReps ? `${scoreRounds} rounds + ${scoreReps} reps` : `${scoreRounds} rounds`;
    } else if (scoringType === 'Max Reps') {
      return scoreReps ? `${scoreReps} reps` : '';
    } else {
      return notes;
    }
  };

  const calculateScoreValue = (): number => {
    if (!score) return 0;
    const scoringType = score.wodId.classification.scoringType;

    if (scoringType === 'For Time') {
      return scoreTime.minutes * 60 + scoreTime.seconds;
    } else if (scoringType === 'AMRAP') {
      return (Number(scoreRounds) || 0) * 1000 + (Number(scoreReps) || 0);
    } else if (scoringType === 'Max Reps') {
      return Number(scoreReps) || 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedScore = formatScore();
    if (!formattedScore && score?.wodId.classification.scoringType !== 'Not Scored') {
      toast.error('Please enter a score');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        performance: {
          score: formattedScore || 'Completed',
          scoreValue: calculateScoreValue(),
          scoringType: score!.wodId.classification.scoringType,
          rxd,
          scaled,
        },
        details: {
          date: new Date(date),
          notes,
          feelingRating,
        },
      };

      const response = await fetch(`/api/scores/${scoreId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Score updated successfully!');
        router.push(`/tracker/${scoreId}`);
      } else {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      console.error('Update score error:', error);
      toast.error('Failed to update score');
    } finally {
      setIsSaving(false);
    }
  };

  const renderScoreInput = () => {
    if (!score) return null;
    const scoringType = score.wodId.classification.scoringType;

    if (scoringType === 'For Time') {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Time *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="99"
              value={scoreTime.minutes}
              onChange={(e) => setScoreTime({ ...scoreTime, minutes: parseInt(e.target.value) || 0 })}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="00"
              required
            />
            <span className="text-slate-600">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={scoreTime.seconds}
              onChange={(e) => setScoreTime({ ...scoreTime, seconds: parseInt(e.target.value) || 0 })}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="00"
              required
            />
            <span className="text-slate-600">min:sec</span>
          </div>
        </div>
      );
    } else if (scoringType === 'AMRAP') {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Score *
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              value={scoreRounds}
              onChange={(e) => setScoreRounds(e.target.value)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              required
            />
            <span className="text-slate-600">rounds +</span>
            <input
              type="number"
              min="0"
              value={scoreReps}
              onChange={(e) => setScoreReps(e.target.value)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <span className="text-slate-600">reps</span>
          </div>
        </div>
      );
    } else if (scoringType === 'Max Reps') {
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Total Reps *
          </label>
          <input
            type="number"
            min="0"
            value={scoreReps}
            onChange={(e) => setScoreReps(e.target.value)}
            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            required
          />
        </div>
      );
    }
    return null;
  };

  if (loading || isLoading || !score) {
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href={`/tracker/${scoreId}`}
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back to Details
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Score</h1>
          <p className="text-slate-600 mt-2">
            Update your performance for {score.wodId.name}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WOD Info (Read-only) */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900">{score.wodId.name}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {score.wodId.classification.scoringType}
              </p>
            </div>

            {/* Score Input */}
            {renderScoreInput()}

            {/* RX/Scaled */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Performance Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rxd}
                    onChange={(e) => {
                      setRxd(e.target.checked);
                      if (e.target.checked) setScaled(false);
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-slate-700">RX</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scaled}
                    onChange={(e) => {
                      setScaled(e.target.checked);
                      if (e.target.checked) setRxd(false);
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-slate-700">Scaled</span>
                </label>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Feeling Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How did it feel?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFeelingRating(rating)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      feelingRating === rating
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">
                      {rating === 1 && '😵'}
                      {rating === 2 && '😓'}
                      {rating === 3 && '😊'}
                      {rating === 4 && '💪'}
                      {rating === 5 && '🔥'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any notes about your performance..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href={`/tracker/${scoreId}`}
                className="flex-1 px-6 py-2.5 text-center border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}