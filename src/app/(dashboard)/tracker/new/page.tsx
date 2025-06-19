// src/app/(dashboard)/tracker/new/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WOD } from '@/types';
import { ChevronDown, Search, X, Clock, Dumbbell, Hash, Calendar } from 'lucide-react';

// WOD Filter Selector Component
interface WODFilterSelectorProps {
  wods: WOD[];
  selectedWodId: string;
  onWodSelect: (wodId: string) => void;
  placeholder?: string;
}

function WODFilterSelector({ 
  wods, 
  selectedWodId, 
  onWodSelect,
  placeholder = "Select a WOD..."
}: WODFilterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterScoringType, setFilterScoringType] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 獲取所有唯一的標籤
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    wods.forEach(wod => {
      wod.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [wods]);

  // 獲取所有唯一的 WOD 類型
  const allTypes = useMemo(() => {
    const typesSet = new Set<string>();
    wods.forEach(wod => {
      if (wod.classification?.type) {
        typesSet.add(wod.classification.type);
      }
    });
    return Array.from(typesSet).sort();
  }, [wods]);

  // 獲取所有唯一的計分類型
  const allScoringTypes = useMemo(() => {
    const scoringTypesSet = new Set<string>();
    wods.forEach(wod => {
      if (wod.classification?.scoringType) {
        scoringTypesSet.add(wod.classification.scoringType);
      }
    });
    return Array.from(scoringTypesSet).sort();
  }, [wods]);

  // 篩選 WODs
  const filteredWods = useMemo(() => {
    return wods.filter(wod => {
      // 搜尋詞篩選
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = wod.name.toLowerCase().includes(searchLower);
        const movementMatch = wod.movements?.some(m => 
          m.name.toLowerCase().includes(searchLower)
        );
        if (!nameMatch && !movementMatch) return false;
      }

      // 類型篩選
      if (filterType !== 'all' && wod.classification?.type !== filterType) {
        return false;
      }

      // 計分類型篩選
      if (filterScoringType !== 'all' && wod.classification?.scoringType !== filterScoringType) {
        return false;
      }

      // 範圍篩選
      if (filterScope !== 'all' && wod.scope !== filterScope) {
        return false;
      }

      // 標籤篩選
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => 
          wod.tags?.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [wods, searchTerm, filterType, filterScoringType, filterScope, selectedTags]);

  // 獲取選中的 WOD
  const selectedWod = useMemo(() => {
    return wods.find(wod => wod._id === selectedWodId);
  }, [wods, selectedWodId]);

  // 重置所有篩選條件
  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterScoringType('all');
    setFilterScope('all');
    setSelectedTags([]);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 處理標籤選擇
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.wod-selector-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="wod-selector-container relative">
      {/* 選擇按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg flex items-center justify-between bg-white hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <span className={selectedWod ? 'text-slate-900' : 'text-slate-500'}>
          {selectedWod ? selectedWod.name : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* 搜尋欄 */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search WODs or movements..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* 篩選器 */}
          <div className="p-3 border-b border-slate-200 space-y-3">
            {/* 第一行篩選器 */}
            <div className="grid grid-cols-3 gap-2">
              {/* WOD 類型 */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="all">All Types</option>
                {allTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* 計分類型 */}
              <select
                value={filterScoringType}
                onChange={(e) => setFilterScoringType(e.target.value)}
                className="px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="all">All Scoring</option>
                {allScoringTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* 範圍 */}
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="all">All WODs</option>
                <option value="public">Public</option>
                <option value="personal">My WODs</option>
              </select>
            </div>

            {/* 標籤篩選 */}
            {allTags.length > 0 && (
              <div>
                <div className="text-xs text-slate-600 mb-1">Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTag(tag);
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 清除篩選按鈕 */}
            {(searchTerm || filterType !== 'all' || filterScoringType !== 'all' || 
              filterScope !== 'all' || selectedTags.length > 0) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetFilters();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>

          {/* WOD 列表 */}
          <div className="max-h-64 overflow-y-auto">
            {filteredWods.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                No WODs found matching your criteria
              </div>
            ) : (
              <div className="p-1">
                {filteredWods.map(wod => (
                  <button
                    key={wod._id}
                    type="button"
                    onClick={() => {
                      onWodSelect(wod._id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 rounded-md transition-colors ${
                      wod._id === selectedWodId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{wod.name}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="w-3 h-3" />
                            {wod.classification?.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {wod.classification?.scoringType}
                          </span>
                          {wod.scope === 'personal' && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              Personal
                            </span>
                          )}
                        </div>
                        {wod.tags && wod.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Hash className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {wod.tags.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 ml-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(wod.createdAt)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 結果統計 */}
          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
            Showing {filteredWods.length} of {wods.length} WODs
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
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

  const formatScore = (): string => {
    if (!selectedWod) return '';

    const scoringType = selectedWod.classification.scoringType;

    if (scoringType === 'For Time') {
      if (scoreTime.minutes || scoreTime.seconds) {
        return `${scoreTime.minutes}:${scoreTime.seconds.toString().padStart(2, '0')}`;
      }
    } else if (scoringType === 'AMRAP') {
      if (scoreRounds && scoreReps) {
        return `${scoreRounds} rounds + ${scoreReps} reps`;
      } else if (scoreRounds) {
        return `${scoreRounds} rounds`;
      }
    } else if (scoringType === 'Max Reps') {
      return scoreReps ? `${scoreReps} reps` : '';
    }
    return notes || 'Completed';
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
            {/* WOD Selection - 使用新的篩選選擇器 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select WOD *
              </label>
              <WODFilterSelector
                wods={wods}
                selectedWodId={selectedWodId}
                onWodSelect={setSelectedWodId}
                placeholder="Choose a WOD..."
              />
            </div>

            {/* WOD Preview */}
            {selectedWod && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">
                  {selectedWod.name}
                </h3>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Type: {selectedWod.classification.type}</p>
                  <p>Scoring: {selectedWod.classification.scoringType}</p>
                  {selectedWod.classification.timeType && (
                    <p>Time: {selectedWod.classification.timeType}</p>
                  )}
                  {selectedWod.movements && selectedWod.movements.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Movements:</p>
                      <ul className="list-disc list-inside">
                        {selectedWod.movements.map((movement, index) => (
                          <li key={index}>{formatMovement(movement)}</li>
                        ))}
                      </ul>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                {selectedWod.classification.scoringType === 'Not Scored' && (
                  <p className="text-sm text-slate-600">
                    This workout is not scored. Mark as completed when done.
                  </p>
                )}
              </div>
            )}

            {/* RX/Scaled */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Performance
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rxd}
                    onChange={(e) => {
                      setRxd(e.target.checked);
                      if (e.target.checked) setScaled(false);
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">RX</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scaled}
                    onChange={(e) => {
                      setScaled(e.target.checked);
                      if (e.target.checked) setRxd(false);
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Scaled</span>
                </label>
              </div>
            </div>

            {/* How did you feel? */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How did you feel?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFeelingRating(rating)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      feelingRating === rating
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">
                      {rating === 1 ? '😵' : rating === 2 ? '😓' : rating === 3 ? '😊' : rating === 4 ? '💪' : '🔥'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional notes about your workout..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Score'}
              </button>
              <Link
                href="/tracker"
                className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
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