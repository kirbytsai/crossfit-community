import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WodModel from '@/models/Wod';
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
        { error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { userId } = await params;
    
    console.log('Fetching WODs for user:', userId);
    console.log('Token payload userId:', payload.userId);

    // 使用者只能查看自己的 WODs（暫時）
    if (payload.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - User mismatch', expected: payload.userId, received: userId },
        { status: 403 }
      );
    }

    await dbConnect();
    
    const wods = await WodModel.findByUser(userId);
    console.log('Found WODs:', wods.length);

    return NextResponse.json({ wods });
  } catch (error) {
    console.error('Get user WODs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}