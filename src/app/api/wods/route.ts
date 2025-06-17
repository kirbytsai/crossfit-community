// src/app/api/wods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WodModel from '@/models/Wod';
import { verifyToken } from '@/lib/auth';
import { validate, wodValidations } from '@/lib/validations';
import { handleError, AuthenticationError } from '@/lib/errors';

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
    const validatedData = await validate(wodValidations.create, body);

    await dbConnect();

    // 建立 WOD
    const wod = await WodModel.create({
      ...validatedData,
      metadata: {
        ...validatedData.metadata,
        createdBy: payload.userId,
      },
    });

    console.log('WOD created:', wod._id);

    return NextResponse.json({ wod }, { status: 201 });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const isPublic = searchParams.get('public') === 'true';

    await dbConnect();

    interface WodQuery {
      'metadata.isPublic'?: boolean;
    }

    const query: WodQuery = {};
    if (isPublic) {
      query['metadata.isPublic'] = true;
    }

    const skip = (page - 1) * limit;
    
    const [wods, total] = await Promise.all([
      WodModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('metadata.createdBy', 'username displayName profilePicture')
        .lean(),
      WodModel.countDocuments(query),
    ]);

    return NextResponse.json({
      wods,
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