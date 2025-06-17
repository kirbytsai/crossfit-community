// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScoreModel from '@/models/Score';
import WodModel from '@/models/Wod';
import { verifyToken } from '@/lib/auth';
import { validate, scoreValidations } from '@/lib/validations';
import { handleError, AuthenticationError, NotFoundError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // 認證檢查
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const body = await request.json();

    // 驗證輸入資料
    const validatedData = await validate(scoreValidations.create, body);

    await dbConnect();
    
    // 確保 Wod model 被載入
    WodModel;

    // 檢查 WOD 是否存在
    const wodExists = await WodModel.exists({ _id: validatedData.wodId });
    if (!wodExists) {
      throw new NotFoundError('WOD');
    }

    // 準備成績資料
    const scoreData = {
      userId: payload.userId,
      wodId: validatedData.wodId,
      performance: {
        score: validatedData.performance.score,
        scoreValue: validatedData.performance.scoreValue || 0,
        scoringType: validatedData.performance.scoringType,
        rxd: validatedData.performance.rxd || false,
        scaled: validatedData.performance.scaled || false,
      },
      details: {
        date: validatedData.details?.date ? new Date(validatedData.details.date) : new Date(),
        notes: validatedData.details?.notes || '',
        feelingRating: validatedData.details?.feelingRating || null,
      },
      social: {
        likes: [],
        isPublic: true,
      },
    };

    // 建立成績記錄
    const score = await ScoreModel.create(scoreData);

    console.log('Score created successfully:', score._id);

    // 回傳時 populate WOD 資訊
    const populatedScore = await ScoreModel.findById(score._id)
      .populate('wodId', 'name classification.scoringType');

    return NextResponse.json({ score: populatedScore }, { status: 201 });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);

    await dbConnect();
    
    // 確保 Wod model 被載入
    WodModel;

    const skip = (page - 1) * limit;
    
    const [scores, total] = await Promise.all([
      ScoreModel.find({ userId: payload.userId })
        .populate('wodId', 'name classification.scoringType')
        .sort({ 'details.date': -1 })
        .skip(skip)
        .limit(limit),
      ScoreModel.countDocuments({ userId: payload.userId }),
    ]);

    return NextResponse.json({
      scores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}