// src/app/api/scores/stats/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { ScoreModel, WodModel } from '@/models'; // 使用 index 檔案
import { verifyToken } from '@/lib/auth';

interface Params {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const { userId } = await params;

    // 檢查權限：用戶只能查看自己的統計
    if (payload.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await dbConnect();
    
    // 確保 Wod model 被載入
    WodModel; // 這行確保 model 被初始化

    // 取得所有成績
    const scores = await ScoreModel.find({ userId })
      .populate('wodId', 'name classification.scoringType')
      .sort({ 'details.date': -1 });

    // 計算統計資料
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    // 本月訓練次數
    const thisMonthScores = scores.filter(s => new Date(s.details.date) >= thisMonth);
    const lastMonthScores = scores.filter(s => 
      new Date(s.details.date) >= lastMonth && 
      new Date(s.details.date) < thisMonth
    );

    // 計算連續訓練天數
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedScores = scores.sort((a, b) => 
      new Date(b.details.date).getTime() - new Date(a.details.date).getTime()
    );

    for (const score of sortedScores) {
      const scoreDate = new Date(score.details.date);
      scoreDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        tempStreak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          currentStreak = 1;
        }
      } else {
        const diffDays = Math.floor((lastDate.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
      lastDate = scoreDate;
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // 計算每種 WOD 類型的統計
    const wodTypeStats: Record<string, number> = {};
    scores.forEach(score => {
      const type = score.wodId.classification.scoringType;
      wodTypeStats[type] = (wodTypeStats[type] || 0) + 1;
    });

    // 計算 PR (Personal Records)
    const prMap = new Map<string, any>();
    scores.forEach(score => {
      const wodId = score.wodId._id.toString();
      const wodName = score.wodId.name;
      const scoringType = score.wodId.classification.scoringType;

      if (!prMap.has(wodId) || isBetterScore(score, prMap.get(wodId), scoringType)) {
        prMap.set(wodId, {
          wodName,
          score: score.performance.score,
          date: score.details.date,
          rxd: score.performance.rxd,
          scoringType
        });
      }
    });

    const stats = {
      totalWorkouts: scores.length,
      thisMonthWorkouts: thisMonthScores.length,
      lastMonthWorkouts: lastMonthScores.length,
      thisYearWorkouts: scores.filter(s => new Date(s.details.date) >= thisYear).length,
      currentStreak,
      longestStreak: maxStreak,
      averageWorkoutsPerWeek: calculateAveragePerWeek(scores),
      wodTypeDistribution: wodTypeStats,
      personalRecords: Array.from(prMap.values()).slice(0, 5), // Top 5 PRs
      recentWorkouts: scores.slice(0, 5).map(s => ({
        wodName: s.wodId.name,
        score: s.performance.score,
        date: s.details.date,
        rxd: s.performance.rxd
      })),
      feelingStats: calculateFeelingStats(scores),
      monthlyProgress: calculateMonthlyProgress(scores)
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// Helper functions
function isBetterScore(newScore: any, oldScore: any, scoringType: string): boolean {
  if (scoringType === 'For Time') {
    // Lower time is better
    const newTime = parseTimeToSeconds(newScore.performance.score);
    const oldTime = parseTimeToSeconds(oldScore.score);
    return newTime < oldTime;
  } else if (scoringType === 'AMRAP' || scoringType === 'Max Reps') {
    // Higher score is better
    return newScore.performance.scoreValue > oldScore.scoreValue;
  }
  return false;
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return parseInt(timeStr) || 0;
}

function calculateAveragePerWeek(scores: any[]): number {
  if (scores.length === 0) return 0;
  
  const sortedScores = scores.sort((a, b) => 
    new Date(a.details.date).getTime() - new Date(b.details.date).getTime()
  );
  
  const firstDate = new Date(sortedScores[0].details.date);
  const lastDate = new Date(sortedScores[sortedScores.length - 1].details.date);
  const weeks = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  return Math.round((scores.length / Math.max(weeks, 1)) * 10) / 10;
}

function calculateFeelingStats(scores: any[]): Record<number, number> {
  const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  scores.forEach(score => {
    if (score.details.feelingRating) {
      stats[score.details.feelingRating]++;
    }
  });
  return stats;
}

function calculateMonthlyProgress(scores: any[]): any[] {
  const monthlyData: Record<string, number> = {};
  
  scores.forEach(score => {
    const date = new Date(score.details.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  // Get last 6 months
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      month: monthKey,
      count: monthlyData[monthKey] || 0
    });
  }

  return result;
}