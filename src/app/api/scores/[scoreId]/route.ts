// src/app/api/scores/[scoreId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScoreModel from '@/models/Score';
import { verifyToken } from '@/lib/auth';

interface Params {
  params: {
    scoreId: string;
  };
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
    await dbConnect();

    const score = await ScoreModel.findById(params.scoreId)
      .populate('wodId');

    if (!score) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }

    // 確認這個成績屬於當前用戶
    if (score.userId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Get score error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
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

    await dbConnect();

    // 先檢查成績是否存在
    const score = await ScoreModel.findById(params.scoreId);
    if (!score) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }

    // 確認這個成績屬於當前用戶
    if (score.userId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 更新成績
    const updatedScore = await ScoreModel.findByIdAndUpdate(
      params.scoreId,
      { 
        performance: body.performance,
        details: body.details,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('wodId');

    return NextResponse.json({ 
      score: updatedScore 
    });
  } catch (error) {
    console.error('Update score error:', error);
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    await dbConnect();

    // 先檢查成績是否存在
    const score = await ScoreModel.findById(params.scoreId);
    if (!score) {
      return NextResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }

    // 確認這個成績屬於當前用戶
    if (score.userId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 刪除成績
    await ScoreModel.findByIdAndDelete(params.scoreId);

    return NextResponse.json({ 
      message: 'Score deleted successfully' 
    });
  } catch (error) {
    console.error('Delete score error:', error);
    return NextResponse.json(
      { error: 'Failed to delete score' },
      { status: 500 }
    );
  }
}