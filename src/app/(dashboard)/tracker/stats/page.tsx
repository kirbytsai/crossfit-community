// src/app/(dashboard)/tracker/stats/page.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Stats {
  totalWorkouts: number;
  thisMonthWorkouts: number;
  lastMonthWorkouts: number;
  thisYearWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  averageWorkoutsPerWeek: number;
  wodTypeDistribution: Record<string, number>;
  personalRecords: Array<{
    wodName: string;
    score: string;
    date: string;
    rxd: boolean;
    scoringType: string;
  }>;
  recentWorkouts: Array<{
    wodName: string;
    score: string;
    date: string;
    rxd: boolean;
  }>;
  feelingStats: Record<number, number>;
  monthlyProgress: Array<{
    month: string;
    count: number;
  }>;
}

export default function TrackerStatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/scores/stats/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const wodTypeData = Object.entries(stats.wodTypeDistribution).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const feelingData = [
    { name: '😵 Very Hard', value: stats.feelingStats[1] || 0 },
    { name: '😓 Hard', value: stats.feelingStats[2] || 0 },
    { name: '😊 Moderate', value: stats.feelingStats[3] || 0 },
    { name: '💪 Good', value: stats.feelingStats[4] || 0 },
    { name: '🔥 Great', value: stats.feelingStats[5] || 0 },
  ];

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <h1 className="text-4xl font-bold text-slate-900">Progress & Statistics</h1>
          <p className="text-slate-600 mt-2">Visualize your CrossFit journey</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600">Total Workouts</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.totalWorkouts}</div>
            <div className="text-xs text-slate-500 mt-1">All time</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600">This Year</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.thisYearWorkouts}</div>
            <div className="text-xs text-slate-500 mt-1">Since January</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600">Current Streak</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.currentStreak}</div>
            <div className="text-xs text-slate-500 mt-1">Consecutive days</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="text-sm text-slate-600">Longest Streak</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.longestStreak}</div>
            <div className="text-xs text-slate-500 mt-1">Personal best</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatMonth(value as string)}
                />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* WOD Type Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">WOD Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={wodTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {wodTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Feeling Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Workout Feeling Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feelingData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Training Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Average per week</span>
                <span className="font-semibold text-slate-900">{stats.averageWorkoutsPerWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">This month vs last</span>
                <span className="font-semibold text-slate-900">
                  {stats.thisMonthWorkouts} vs {stats.lastMonthWorkouts}
                  {stats.thisMonthWorkouts > stats.lastMonthWorkouts && (
                    <span className="text-green-600 text-sm ml-2">
                      ↑ {((stats.thisMonthWorkouts - stats.lastMonthWorkouts) / stats.lastMonthWorkouts * 100).toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-6">
                <h4 className="font-medium text-slate-900 mb-2">Most frequent WOD types:</h4>
                {Object.entries(stats.wodTypeDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center mt-2">
                      <span className="text-slate-600">{type}</span>
                      <span className="font-medium">{count} times</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* Personal Records */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Personal Records</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">WOD</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.personalRecords.map((pr, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{pr.wodName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pr.score}</span>
                        {pr.rxd && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            RX
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{pr.scoringType}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(pr.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}