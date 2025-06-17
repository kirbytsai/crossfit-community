// src/app/api/users/[userId]/personal-info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { validate, userValidations, commonValidations } from '@/lib/validations';
import { handleError, AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

interface Params {
  params: Promise<{
    userId: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const { userId } = await params;
    const body = await request.json();

    // 驗證 userId 格式
    await validate(z.object({ userId: commonValidations.objectId }), { userId });

    // 只能更新自己的資料
    if (payload.userId !== userId) {
      throw new AuthorizationError();
    }

    // 驗證更新資料
    const validatedData = await validate(userValidations.updatePersonalInfo, body);

    await dbConnect();

    // 準備更新資料
    const updateData: Record<string, unknown> = {};
    
    if (validatedData.height !== undefined) {
      updateData['personalInfo.height'] = validatedData.height;
    }
    if (validatedData.weight !== undefined) {
      updateData['personalInfo.weight'] = validatedData.weight;
    }
    if (validatedData.age !== undefined) {
      updateData['personalInfo.age'] = validatedData.age;
    }
    if (validatedData.injuryNotes !== undefined) {
      updateData['personalInfo.injuryNotes'] = validatedData.injuryNotes;
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-lineUserId');

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ 
      success: true,
      user,
      message: 'Personal information updated successfully'
    });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      throw new AuthenticationError();
    }

    const payload = verifyToken(token);
    const { userId } = await params;

    // 驗證 userId 格式
    await validate(z.object({ userId: commonValidations.objectId }), { userId });

    // 只能查看自己的資料
    if (payload.userId !== userId) {
      throw new AuthorizationError();
    }

    await dbConnect();
    
    const user = await UserModel.findById(userId).select('personalInfo');

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ 
      personalInfo: user.personalInfo || {}
    });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}