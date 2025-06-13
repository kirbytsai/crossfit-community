'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WOD } from '@/types';

export default function NewScorePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedWodId = searchParams.get('wodId');

  const [isSaving, setIsSaving] = useState(false);
  const [wods, setWods] = useState<WOD[]>([]);
  const [isLoadingWods, setIsLoadingWods] = useState(true);

  // Form states
  const [selectedWodId, setSelectedWodId] = useState(preSelectedWodId || '');
  const [selectedWod, setSelectedWod] = useState<WOD | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scoreTime, setScoreTime] = useState({ minutes: 0, seconds: 0 });
  const [scoreRounds, setScoreRounds] = useState<number | ''>('');
  const [scoreReps, setScoreReps] = useState<number | ''>('');
  const [rxd, setRxd] = useState(true);
  const [scaled, setScaled] = useState(false);
  const [notes, setNotes] = useState('');
  const [feelingRating, setFeelingRating] = useState<number>(3);

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

  useEffect(() => {
    if (selectedWodId && wods.length > 0) {
      const wod = wods.find(w => w._id === selectedWodId);
      setSelectedWod(wod || null);
    }
  }, [selectedWodId, wods]);

  const fetchWods = async () => {
    try {
      // 獲取使用者的 WODs
      const response = await fetch('/api/wods/my-wods');
      if (response.ok) {
        const data = await response.json();
        setWods(data.wods);
      }
    } catch (error) {
      console.error('Failed to fetch WODs:', error);
      toast.error('Failed to load WODs');
    } finally {
      setIsLoadingWods(false);
    }
  };

  const formatScore = (): string => {
    if (!selectedWod) return '';

    const scoringType = selectedWod.classification.scoringType;

    if (scoringType === 'For Time') {
      const totalSeconds = scoreTime.minutes * 60 + scoreTime.seconds;
      if (totalSeconds === 0) return '';
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else if (scoringType === 'AMRAP') {
      if (!scoreRounds) return '';
      return scoreReps ? `${scoreRounds} rounds + ${scoreReps} reps` : `${scoreRounds} rounds`;
    } else if (scoringType === 'Max Reps') {
      return scoreReps ? `${scoreReps} reps` : '';
    } else {
      return notes; // For other types, use notes as score
    }
  };

  const calculateScoreValue = (): number => {
    if (!selectedWod) return 0;

    const scoringType = selectedWod.classification.scoringType;

    if (scoringType === 'For Time') {
      return scoreTime.minutes * 60 + scoreTime.seconds;
    } else if (scoringType === 'AMRAP') {
      // For AMRAP, higher is better
      // Convert to a single number for ranking: rounds * 1000 + reps
      return (Number(scoreRounds) || 0) * 1000 + (Number(scoreReps) || 0);
    } else if (scoringType === 'Max Reps') {
      return Number(scoreReps) || 0;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWodId) {
      toast.error('Please select a WOD');
      return;
    }

    const score = formatScore();
    if (!score) {
      toast.error('Please enter a score');
      return;
    }

    setIsSaving(true);

    try {
      const scoreData = {
        wodId: selectedWodId,
        performance: {
          score,
          scoreValue: calculateScoreValue(),
          scoringType: selectedWod!.classification.scoringType,
          rxd,
          scaled,
        },
        details: {
          date: new Date(date),
          notes,
          feelingRating,
        },
      };

      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      if (response.ok) {
        toast.success('Score recorded successfully!');
        router.push('/tracker');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save score');
      }
    } catch (error) {
      console.error('Save score error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save score');
    } finally {
      setIsSaving(false);
    }
  };

  const feelingEmojis = [
    { rating: 1, emoji: '😵', label: 'Exhausted' },
    { rating: 2, emoji: '😓', label: 'Tough' },
    { rating: 3, emoji: '😊', label: 'Good' },
    { rating: 4, emoji: '💪', label: 'Strong' },
    { rating: 5, emoji: '🔥', label: 'Amazing' },
  ];

  if (loading || isLoadingWods) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tracker"
            className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
          >
            ← Back to My Tracker
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Record New Score</h1>
          <p className="text-slate-600 mt-2">Log your workout performance</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* WOD Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Workout Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select WOD *
                </label>
                <select
                  value={selectedWodId}
                  onChange={(e) => setSelectedWodId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                >
                  <option value="">Choose a WOD...</option>
                  {wods.map((wod) => (
                    <option key={wod._id} value={wod._id}>
                      {wod.name} ({wod.classification.scoringType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Score Input */}
          {selectedWod && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Score</h2>
              
              {/* WOD Info */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-slate-900">{selectedWod.name}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedWod.classification.scoringType}
                  {selectedWod.structure.rounds && ` - ${selectedWod.structure.rounds} rounds`}
                  {selectedWod.structure.timeLimit && ` - ${Math.floor(selectedWod.structure.timeLimit / 60)} min`}
                </p>
              </div>

              {/* Score Input Based on Type */}
              {selectedWod.classification.scoringType === 'For Time' && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    value={scoreTime.minutes || ''}
                    onChange={(e) => setScoreTime(prev => ({ ...prev, minutes: Number(e.target.value) }))}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-center"
                  />
                  <span className="text-slate-600 font-semibold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="SS"
                    value={scoreTime.seconds || ''}
                    onChange={(e) => setScoreTime(prev => ({ ...prev, seconds: Math.min(59, Number(e.target.value)) }))}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-center"
                  />
                </div>
              )}

              {selectedWod.classification.scoringType === 'AMRAP' && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    min="0"
                    placeholder="Rounds"
                    value={scoreRounds}
                    onChange={(e) => setScoreRounds(e.target.value ? Number(e.target.value) : '')}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                  <span className="text-slate-600">+</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Reps"
                    value={scoreReps}
                    onChange={(e) => setScoreReps(e.target.value ? Number(e.target.value) : '')}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              )}

              {selectedWod.classification.scoringType === 'Max Reps' && (
                <div className="mb-4">
                  <input
                    type="number"
                    min="0"
                    placeholder="Total Reps"
                    value={scoreReps}
                    onChange={(e) => setScoreReps(e.target.value ? Number(e.target.value) : '')}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              )}

              {/* RX/Scaled */}
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={rxd && !scaled}
                    onChange={() => { setRxd(true); setScaled(false); }}
                    className="h-4 w-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">RX</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={scaled && !rxd}
                    onChange={() => { setRxd(false); setScaled(true); }}
                    className="h-4 w-4 text-slate-900 border-slate-300 focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">Scaled</span>
                </label>
              </div>
            </div>
          )}

          {/* Notes & Feeling */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  How did you feel?
                </label>
                <div className="flex gap-3">
                  {feelingEmojis.map(({ rating, emoji, label }) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeelingRating(rating)}
                      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                        feelingRating === rating
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className="text-2xl mb-1">{emoji}</span>
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  placeholder="How was the workout? Any modifications? Strategy used?"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/tracker"
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving || !selectedWod}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}