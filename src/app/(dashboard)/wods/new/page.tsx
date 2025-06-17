// src/app/(dashboard)/wods/new/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WOD } from '@/types';
import { validateField, validationRules, getErrorMessage, handleApiResponse, FormErrors } from '@/lib/clientValidations';
import { LoadingSpinner, FormField, Alert, ConfirmDialog } from '@/components/ui';

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // 驗證單個欄位
  const validateSingleField = (fieldName: string, value: unknown) => {
    let error: string | undefined;

    switch (fieldName) {
      case 'name':
        error = validateField(fieldName, value, validationRules.wodName);
        break;
      case 'movements':
        const movementsArray = value as Movement[];
        if (movementsArray.filter(m => m.name.trim()).length === 0) {
          error = 'At least one movement is required';
        }
        break;
      case 'timeLimit':
        if ((scoringType === 'AMRAP' || scoringType === 'EMOM') && !value) {
          error = 'Time limit is required for this workout type';
        }
        break;
    }

    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  };

  // 驗證所有欄位
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 驗證名稱
    const nameError = validateField('name', name, validationRules.wodName);
    if (nameError) newErrors.name = nameError;

    // 驗證動作
    if (movements.filter(m => m.name.trim()).length === 0) {
      newErrors.movements = 'At least one movement is required';
    }

    // 驗證時間限制
    if ((scoringType === 'AMRAP' || scoringType === 'EMOM') && !timeLimit) {
      newErrors.timeLimit = 'Time limit is required for this workout type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addMovement = () => {
    setMovements([...movements, { name: '' }]);
  };

  const removeMovement = (index: number) => {
    if (movements.length > 1) {
      setMovements(movements.filter((_, i) => i !== index));
    }
  };

  const updateMovement = (index: number, field: keyof Movement, value: unknown) => {
    const updated = [...movements];
    updated[index] = { ...updated[index], [field]: value };
    setMovements(updated);
    
    // 驗證動作
    if (field === 'name') {
      validateSingleField('movements', updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmDialog(false);
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
          type: scoringType === 'AMRAP' ? 'time-based' : scoringType === 'For Time' ? 'rounds' : 'max-effort',
          rounds: rounds ? Number(rounds) : undefined,
          timeLimit: timeLimit ? Number(timeLimit) * 60 : undefined,
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

      const result = await handleApiResponse<{ wod: WOD }>(response);
      
      toast.success('WOD created successfully!');
      router.push(`/wods/${result.wod._id}`);
    } catch (error) {
      console.error('Create WOD error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/wods"
              className="text-slate-600 hover:text-slate-900"
            >
              ← Back to My WODs
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create New WOD</h1>
          <p className="text-slate-600 mt-2">
            Design your custom workout and share it with the community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <FormField label="WOD Name" required error={errors.name}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    validateSingleField('name', e.target.value);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Murph, Fran, Custom Hero WOD"
                />
              </FormField>

              <FormField label="Description" error={errors.description}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the workout, its purpose, or any special instructions..."
                />
              </FormField>

              <FormField label="Scoring Type" required>
                <select
                  value={scoringType}
                  onChange={(e) => {
                    setScoringType(e.target.value);
                    // Clear time limit error if changing from AMRAP/EMOM
                    if (errors.timeLimit) {
                      setErrors(prev => ({ ...prev, timeLimit: undefined }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="For Time">For Time</option>
                  <option value="AMRAP">AMRAP</option>
                  <option value="EMOM">EMOM</option>
                  <option value="Tabata">Tabata</option>
                  <option value="Max Reps">Max Reps</option>
                  <option value="Max Weight">Max Weight</option>
                  <option value="Not Scored">Not Scored</option>
                </select>
              </FormField>

              {scoringType === 'For Time' && (
                <FormField label="Rounds">
                  <input
                    type="number"
                    min="1"
                    value={rounds}
                    onChange={(e) => setRounds(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="3"
                  />
                </FormField>
              )}

              {(scoringType === 'AMRAP' || scoringType === 'EMOM') && (
                <FormField label="Time Limit (minutes)" required error={errors.timeLimit}>
                  <input
                    type="number"
                    min="1"
                    value={timeLimit}
                    onChange={(e) => {
                      setTimeLimit(e.target.value ? parseInt(e.target.value) : '');
                      validateSingleField('timeLimit', e.target.value);
                    }}
                    className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.timeLimit ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="20"
                  />
                </FormField>
              )}
            </div>
          </div>

          {/* Movements Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Movements</h2>
              {errors.movements && (
                <span className="text-sm text-red-600">{errors.movements}</span>
              )}
            </div>

            <div className="space-y-4">
              {movements.map((movement, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={movement.name}
                      onChange={(e) => updateMovement(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Movement name"
                      list={`movements-${index}`}
                    />
                    <datalist id={`movements-${index}`}>
                      {commonMovements.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                  
                  <input
                    type="number"
                    value={movement.reps || ''}
                    onChange={(e) => updateMovement(index, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Reps"
                    min="1"
                  />
                  
                  <input
                    type="text"
                    value={movement.weight?.male || ''}
                    onChange={(e) => updateMovement(index, 'weight', { ...movement.weight, male: e.target.value })}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="M weight"
                  />
                  
                  <input
                    type="text"
                    value={movement.weight?.female || ''}
                    onChange={(e) => updateMovement(index, 'weight', { ...movement.weight, female: e.target.value })}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="F weight"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeMovement(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={movements.length === 1}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMovement}
              className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
            >
              + Add Movement
            </button>
          </div>

          {/* Equipment & Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Equipment & Settings</h2>
            
            <div className="space-y-6">
              <FormField label="Equipment Needed">
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((eq) => (
                    <label key={eq} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={equipment.includes(eq)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEquipment([...equipment, eq]);
                          } else {
                            setEquipment(equipment.filter(e => e !== eq));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-slate-700">{eq}</span>
                    </label>
                  ))}
                </div>
              </FormField>

              <FormField label="Difficulty Level">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        difficulty === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  1 = Beginner, 5 = Elite Athlete
                </p>
              </FormField>

              <FormField label="Visibility">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-slate-700">
                    Make this WOD public (visible to other users)
                  </span>
                </label>
              </FormField>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/wods')}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                'Create WOD'
              )}
            </button>
          </div>
        </form>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title="Create WOD"
          message="Are you sure you want to create this WOD? You can edit it later if needed."
          confirmText="Create"
          cancelText="Review"
          onConfirm={confirmSubmit}
          onCancel={() => setShowConfirmDialog(false)}
        />
      </div>
    </div>
  );
}