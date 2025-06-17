// src/app/api/users/[userId]/route.ts
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

    await dbConnect();
    
    const user = await UserModel.findById(userId).select('-lineUserId');

    if (!user) {
      throw new NotFoundError('User');
    }

    // 只有用戶本人可以查看完整資料
    if (payload.userId !== userId) {
      // 返回公開資料
      return NextResponse.json({
        user: {
          _id: user._id,
          username: user.username,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          bio: user.bio,
        }
      });
    }

    return NextResponse.json({ user });
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
    const { userId } = await params;
    const body = await request.json();

    // 驗證 userId 格式
    await validate(z.object({ userId: commonValidations.objectId }), { userId });

    // 只能更新自己的資料
    if (payload.userId !== userId) {
      throw new AuthorizationError();
    }

    // 驗證更新資料
    const validatedData = await validate(userValidations.updateProfile, body);

    await dbConnect();

    // 如果要更新 username，檢查是否已存在
    if (validatedData.username) {
      const existingUser = await UserModel.findOne({
        username: validatedData.username,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        throw new ValidationError('Username already taken');
      }
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $set: {
          ...validatedData,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-lineUserId');

    if (!user) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ user });
  } catch (error) {
    const { status, response } = handleError(error);
    return NextResponse.json(response, { status });
  }
}