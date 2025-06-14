// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScoreModel from '@/models/Score';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const body = await request.json();

    // 驗證必要欄位
    if (!body.wodId) {
      return NextResponse.json(
        { error: 'WOD ID is required' },
        { status: 400 }
      );
    }

    if (!body.performance?.score) {
      return NextResponse.json(
        { error: 'Score is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // 建立成績記錄
    const score = await ScoreModel.create({
      ...body,
      userId: payload.userId,
    });

    console.log('Score created:', score._id);

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Create score error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create score' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    await dbConnect();

    const scores = await ScoreModel.find({ userId: payload.userId })
      .populate('wodId', 'name classification.scoringType')
      .sort({ 'details.date': -1 })
      .limit(limit);

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Get scores error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}