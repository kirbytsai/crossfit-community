// src/app/api/scores/[scoreId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScoreModel from '@/models/Score';
import { verifyToken } from '@/lib/auth';
import { validate, scoreValidations, commonValidations } from '@/lib/validations';
import { handleError, AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errors';

interface Params {
  params: Promise<{
    scoreId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const { scoreId } = await params;

    // 驗證 scoreId 格式
    await validate(z.object({ scoreId: commonValidations.objectId }), { scoreId });

    await dbConnect();

    const score = await ScoreModel.findById(scoreId)
      .populate('wodId');

    if (!score) {
      throw new NotFoundError('Score');
    }

    // 確認這個成績屬於當前用戶
    if (score.userId.toString() !== payload.userId) {
      throw new AuthorizationError();
    }

    return NextResponse.json({ score });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const { scoreId } = await params;
    const body = await request.json();

    // 驗證 scoreId 格式
    await validate(z.object({ scoreId: commonValidations.objectId }), { scoreId });

    // 驗證更新資料
    const validatedData = await validate(scoreValidations.update, body);

    await dbConnect();

    // 先檢查成績是否存在
    const score = await ScoreModel.findById(scoreId);
    if (!score) {
      throw new NotFoundError('Score');
    }

    // 確認這個成績屬於當前用戶
    if (score.userId.toString() !== payload.userId) {
      throw new AuthorizationError();
    }

    // 準備更新資料
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.performance) {
      updateData.performance = {
        ...score.performance,
        ...validatedData.performance,
      };
    }

    if (validatedData.details) {
      updateData.details = {
        ...score.details,
        ...validatedData.details,
        date: validatedData.details.date ? new Date(validatedData.details.date) : score.details.date,
      };
    }

    // 更新成績
    const updatedScore = await ScoreModel.findByIdAndUpdate(
      scoreId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('wodId');

    return NextResponse.json({ score: updatedScore });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const { scoreId } = await params;

    // 驗證 scoreId 格式
    await validate(z.object({ scoreId: commonValidations.objectId }), { scoreId });

    await dbConnect();

    // 先檢查成績是否存在
    const score = await ScoreModel.findById(scoreId);
    if (!score) {
      throw new NotFoundError('Score');
    }

    // 確認這個成績屬於當前用戶
    if (score.userId.toString() !== payload.userId) {
      throw new AuthorizationError();
    }

    // 刪除成績
    await ScoreModel.findByIdAndDelete(scoreId);

    return NextResponse.json({ 
      message: 'Score deleted successfully' 
    });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}

// 需要在檔案頂部加入
import { z } from 'zod';