// src/app/api/scores/user/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScoreModel from '@/models/Score';
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
    const { searchParams } = new URL(request.url);
    
    // 檢查權限：用戶只能查看自己的成績
    if (payload.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const month = searchParams.get('month');
    const limit = parseInt(searchParams.get('limit') || '50');

    await dbConnect();

    let query: any = { userId };

    // 如果有月份篩選
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      query['details.date'] = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const scores = await ScoreModel.find(query)
      .populate('wodId', 'name classification.scoringType')
      .sort({ 'details.date': -1 })
      .limit(limit);

    console.log(`Found ${scores.length} scores for user ${userId}`);

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Get user scores error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}