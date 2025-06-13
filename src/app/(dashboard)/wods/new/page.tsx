'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Movement {
  name: string;
  reps?: number;
  weight?: {
    male: string;
    female: string;
  };
  notes?: string;
}

export default function NewWodPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scoringType, setScoringType] = useState<string>('For Time');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [rounds, setRounds] = useState<number | ''>('');
  const [movements, setMovements] = useState<Movement[]>([{ name: '' }]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [isPublic, setIsPublic] = useState(true);

  // Equipment options
  const equipmentOptions = [
    'Barbell', 'Dumbbell', 'Kettlebell', 'Pull-up Bar', 'Rings',
    'Box', 'Wall Ball', 'Rope', 'Rower', 'Bike', 'Ski Erg',
    'Medicine Ball', 'Slam Ball', 'TRX', 'Bands', 'No Equipment'
  ];

  // Common movements
  const commonMovements = [
    'Air Squat', 'Back Squat', 'Front Squat', 'Overhead Squat',
    'Deadlift', 'Sumo Deadlift', 'Romanian Deadlift',
    'Clean', 'Power Clean', 'Hang Clean', 'Clean & Jerk',
    'Snatch', 'Power Snatch', 'Hang Snatch',
    'Press', 'Push Press', 'Push Jerk', 'Split Jerk',
    'Pull-up', 'Chest to Bar', 'Muscle-up', 'Ring Muscle-up',
    'Push-up', 'Handstand Push-up', 'Ring Dip', 'Bar Dip',
    'Box Jump', 'Burpee', 'Burpee Box Jump', 'Wall Ball',
    'Kettlebell Swing', 'Turkish Get-up', 'Thruster',
    'Row', 'Run', 'Double Under', 'Single Under',
    'Toes to Bar', 'Knees to Elbow', 'Sit-up', 'V-up'
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const addMovement = () => {
    setMovements([...movements, { name: '' }]);
  };

  const removeMovement = (index: number) => {
    setMovements(movements.filter((_, i) => i !== index));
  };

  const updateMovement = (index: number, field: keyof Movement, value: any) => {
    const updated = [...movements];
    updated[index] = { ...updated[index], [field]: value };
    setMovements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a WOD name');
      return;
    }

    if (movements.filter(m => m.name.trim()).length === 0) {
      toast.error('Please add at least one movement');
      return;
    }

    setIsSaving(true);

    try {
      const wodData = {
        name: name.trim(),
        description: description.trim(),
        classification: {
          scoringType,
          equipment,
          movements: movements.filter(m => m.name).map(m => m.name),
          difficulty,
          estimatedDuration: scoringType === 'AMRAP' ? Number(timeLimit) : undefined,
        },
        structure: {
          type: scoringType === 'AMRAP' ? 'time-based' : 'rounds',
          rounds: scoringType !== 'AMRAP' ? Number(rounds) || undefined : undefined,
          timeLimit: scoringType === 'AMRAP' ? Number(timeLimit) * 60 : undefined, // Convert to seconds
          movements: movements.filter(m => m.name.trim()),
        },
        metadata: {
          isPublic,
        },
      };

      const response = await fetch('/api/wods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wodData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('WOD created successfully!');
        router.push('/wods');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create WOD');
      }
    } catch (error) {
      console.error('Create WOD error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create WOD');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
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
            href="/wods"
            className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block"
          >
            ← Back to My WODs
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Create New WOD</h1>
          <p className="text-slate-600 mt-2">Design your custom workout</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WOD Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="e.g., Monday Madness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                  placeholder="Describe the workout focus or goals..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Scoring Type *
                  </label>
                  <select
                    value={scoringType}
                    onChange={(e) => setScoringType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="For Time">For Time</option>
                    <option value="AMRAP">AMRAP</option>
                    <option value="EMOM">EMOM</option>
                    <option value="Tabata">Tabata</option>
                    <option value="Max Reps">Max Reps</option>
                    <option value="Max Weight">Max Weight</option>
                    <option value="Not Scored">Not Scored</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {scoringType === 'AMRAP' ? 'Time Limit (minutes)' : 'Rounds'}
                  </label>
                  {scoringType === 'AMRAP' ? (
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="e.g., 20"
                      min="1"
                    />
                  ) : (
                    <input
                      type="number"
                      value={rounds}
                      onChange={(e) => setRounds(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="e.g., 3"
                      min="1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Movements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Movements</h2>
            
            <div className="space-y-4">
              {movements.map((movement, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={movement.name}
                      onChange={(e) => updateMovement(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="Movement name"
                      list={`movements-${index}`}
                    />
                    <datalist id={`movements-${index}`}>
                      {commonMovements.map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                  <input
                    type="number"
                    value={movement.reps || ''}
                    onChange={(e) => updateMovement(index, 'reps', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Reps"
                  />
                  <button
                    type="button"
                    onClick={() => removeMovement(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMovement}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                + Add Movement
              </button>
            </div>
          </div>

          {/* Equipment & Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Equipment & Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Equipment Needed
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {equipmentOptions.map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipment.includes(item)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEquipment([...equipment, item]);
                          } else {
                            setEquipment(equipment.filter(eq => eq !== item));
                          }
                        }}
                        className="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                      />
                      <span className="text-sm text-slate-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Difficulty Level
                </label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        difficulty === level
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <h3 className="font-medium text-slate-900">Visibility</h3>
                  <p className="text-sm text-slate-600">
                    {isPublic ? 'Other users can see this WOD' : 'Only you can see this WOD'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link
              href="/wods"
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create WOD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}