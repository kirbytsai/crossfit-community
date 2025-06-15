// src/components/TrainingCalendar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Score, WOD } from '@/types';

interface ScoreWithWod extends Score {
  wodId: WOD;
}

interface TrainingCalendarProps {
  scores: ScoreWithWod[];
}

export default function TrainingCalendar({ scores }: TrainingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthScores, setMonthScores] = useState<Map<string, ScoreWithWod[]>>(new Map());

  useEffect(() => {
    // Group scores by date
    const scoresByDate = new Map<string, ScoreWithWod[]>();
    scores.forEach(score => {
      const dateStr = new Date(score.details.date).toDateString();
      if (!scoresByDate.has(dateStr)) {
        scoresByDate.set(dateStr, []);
      }
      scoresByDate.get(dateStr)!.push(score);
    });
    setMonthScores(scoresByDate);
  }, [scores]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getScoresForDate = (date: Date): ScoreWithWod[] => {
    const dateStr = date.toDateString();
    return monthScores.get(dateStr) || [];
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-slate-50"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayScores = getScoresForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasWorkout = dayScores.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-slate-200 p-2 cursor-pointer transition-colors hover:bg-slate-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${hasWorkout ? 'bg-green-50' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {day}
            </span>
            {hasWorkout && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">{dayScores.length}</span>
              </div>
            )}
          </div>
          {dayScores.length > 0 && (
            <div className="mt-1">
              {dayScores.slice(0, 2).map((score, idx) => (
                <div key={idx} className="text-xs text-slate-600 truncate">
                  {score.wodId.name}
                </div>
              ))}
              {dayScores.length > 2 && (
                <div className="text-xs text-slate-400">+{dayScores.length - 2} more</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Training Calendar</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-slate-700 font-medium">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Days of Week Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          {getScoresForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getScoresForDate(selectedDate).map((score) => (
                <div key={score._id} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">{score.wodId.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        {score.performance.score}
                        {score.performance.rxd && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">RX</span>
                        )}
                      </div>
                    </div>
                    {score.details.feelingRating && (
                      <div className="text-xl">
                        {[null, '😵', '😓', '😊', '💪', '🔥'][score.details.feelingRating]}
                      </div>
                    )}
                  </div>
                  {score.details.notes && (
                    <p className="text-sm text-slate-600 mt-2">{score.details.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No workouts recorded on this day</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-slate-200 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-300"></div>
          <span className="text-slate-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-slate-200"></div>
          <span className="text-slate-600">Has workouts</span>
        </div>
      </div>
    </div>
  );
}