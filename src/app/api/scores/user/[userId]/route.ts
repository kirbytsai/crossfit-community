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

    // 使用者只能查看自己的成績
    if (payload.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    await dbConnect();

    let query: any = { userId };

    // 如果有指定月份，過濾該月份的成績
    if (month) {
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      query['details.date'] = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const scores = await ScoreModel.find(query)
      .populate('wodId')
      .sort({ 'details.date': -1 });

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Get user scores error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}