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
      const response = await fetch('/api/wods/my-wods');
      const data = await response.json();
      
      console.log('Fetched WODs:', data);
      
      if (response.ok) {
        setWods(data.wods || []);
        
        if (preSelectedWodId && data.wods) {
          const preSelectedWod = data.wods.find((w: WOD) => w._id === preSelectedWodId);
          if (preSelectedWod) {
            setSelectedWod(preSelectedWod);
          }
        }
      } else {
        console.error('Failed to fetch WODs:', data);
        toast.error(data.error || 'Failed to load WODs');
      }
    } catch (error) {
      console.error('Failed to fetch WODs:', error);
      toast.error('Failed to load WODs');
    } finally {
      setIsLoadingWods(false);
    }
  };

  // 格式化動作顯示
  const formatMovement = (movement: any) => {
    let result = '';
    if (movement.reps) {
      result += `${movement.reps} `;
    }
    result += movement.name;
    if (movement.weight?.male || movement.weight?.female) {
      result += ` (${movement.weight.male || movement.weight.female})`;
    }
    return result;
  };

  // 格式化 WOD 結構顯示
  const formatWodStructure = (wod: WOD) => {
    if (!wod.structure?.movements) return '';
    
    const movements = wod.structure.movements.map(formatMovement);
    
    if (wod.structure.rounds && wod.structure.rounds > 1) {
      return `${wod.structure.rounds} rounds of: ${movements.join(', ')}`;
    } else if (wod.classification.scoringType === 'AMRAP' && wod.structure.timeLimit) {
      const timeInMinutes = Math.floor(wod.structure.timeLimit / 60);
      return `${timeInMinutes} min AMRAP: ${movements.join(', ')}`;
    } else if (wod.classification.scoringType === 'EMOM' && wod.structure.timeLimit) {
      const timeInMinutes = Math.floor(wod.structure.timeLimit / 60);
      return `${timeInMinutes} min EMOM: ${movements.join(', ')}`;
    } else {
      return `For Time: ${movements.join(', ')}`;
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
      return notes;
    }
  };

  const calculateScoreValue = (): number => {
    if (!selectedWod) return 0;

    const scoringType = selectedWod.classification.scoringType;

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

    if (!selectedWodId) {
      toast.error('Please select a WOD');
      return;
    }

    const score = formatScore();
    if (!score && selectedWod?.classification.scoringType !== 'Not Scored') {
      toast.error('Please enter a score');
      return;
    }

    setIsSaving(true);

    try {
      const scoreData = {
        wodId: selectedWodId,
        performance: {
          score: score || 'Completed',
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

      console.log('Submitting score data:', scoreData);

      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      const result = await response.json();
      console.log('Save response:', result);

      if (response.ok) {
        toast.success('Score recorded successfully!');
        router.push('/tracker');
      } else {
        throw new Error(result.error || 'Failed to save score');
      }
    } catch (error) {
      console.error('Save score error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save score');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoadingWods) {
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
              href="/tracker"
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back to Tracker
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Record New Score</h1>
          <p className="text-slate-600 mt-2">
            Record your performance for a workout
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WOD Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select WOD *
              </label>
              <select
                value={selectedWodId}
                onChange={(e) => setSelectedWodId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a WOD...</option>
                {wods.map((wod) => (
                  <option key={wod._id} value={wod._id}>
                    {wod.name} - {wod.classification.scoringType}
                  </option>
                ))}
              </select>
            </div>

            {/* WOD Details Display */}
            {selectedWod && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-medium text-slate-900 mb-2">WOD Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedWod.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedWod.classification.scoringType}
                  </div>
                  {selectedWod.classification.difficulty && (
                    <div>
                      <span className="font-medium">Difficulty:</span> {selectedWod.classification.difficulty}/5
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Workout:</span> {formatWodStructure(selectedWod)}
                  </div>
                  {selectedWod.description && (
                    <div>
                      <span className="font-medium">Description:</span> {selectedWod.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Score Input */}
            {selectedWod && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Score ({selectedWod.classification.scoringType}) *
                </label>
                
                {selectedWod.classification.scoringType === 'For Time' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={scoreTime.minutes || ''}
                      onChange={(e) => setScoreTime(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                      min="0"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      placeholder="Seconds"
                      value={scoreTime.seconds || ''}
                      onChange={(e) => setScoreTime(prev => ({ ...prev, seconds: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                      min="0"
                      max="59"
                    />
                  </div>
                )}

                {selectedWod.classification.scoringType === 'AMRAP' && (
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Completed rounds"
                      value={scoreRounds || ''}
                      onChange={(e) => setScoreRounds(e.target.value ? parseInt(e.target.value) : '')}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Additional reps (optional)"
                      value={scoreReps || ''}
                      onChange={(e) => setScoreReps(e.target.value ? parseInt(e.target.value) : '')}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                      min="0"
                    />
                  </div>
                )}

                {selectedWod.classification.scoringType === 'Max Reps' && (
                  <input
                    type="number"
                    placeholder="Total reps"
                    value={scoreReps || ''}
                    onChange={(e) => setScoreReps(e.target.value ? parseInt(e.target.value) : '')}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                    min="0"
                  />
                )}

                {(selectedWod.classification.scoringType === 'Max Weight' || 
                  selectedWod.classification.scoringType === 'Not Scored') && (
                  <input
                    type="text"
                    placeholder="Enter score or description"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  />
                )}
              </div>
            )}

            {/* RX/Scaled */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Performance Level
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="performance"
                    checked={rxd}
                    onChange={() => { setRxd(true); setScaled(false); }}
                    className="mr-2"
                  />
                  RX (As Prescribed)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="performance"
                    checked={scaled}
                    onChange={() => { setRxd(false); setScaled(true); }}
                    className="mr-2"
                  />
                  Scaled
                </label>
              </div>
            </div>

            {/* Feeling Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How did it feel? (1 = Very Hard, 5 = Very Easy)
              </label>
              <select
                value={feelingRating}
                onChange={(e) => setFeelingRating(parseInt(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1 - Very Hard 😵</option>
                <option value={2}>2 - Hard 😓</option>
                <option value={3}>3 - Moderate 😊</option>
                <option value={4}>4 - Easy 💪</option>
                <option value={5}>5 - Very Easy 🔥</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this workout..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving || !selectedWodId}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Score'}
              </button>
              <Link
                href="/tracker"
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}