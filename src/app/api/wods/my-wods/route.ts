// src/app/api/wods/my-wods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WodModel from '@/models/Wod';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    console.log('Fetching WODs for current user:', payload.userId);

    await dbConnect();
    
    // 獲取當前用戶的 WODs
    const wods = await WodModel.find({
      'metadata.createdBy': payload.userId
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log('Found WODs:', wods.length);

    return NextResponse.json({ 
      wods,
      total: wods.length 
    });
  } catch (error) {
    console.error('Get my WODs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}