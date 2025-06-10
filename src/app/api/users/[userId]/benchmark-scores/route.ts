import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import { verifyToken } from '@/lib/auth';

interface Params {
  params: Promise<{
    userId: string;
  }>;
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
    const { userId } = await params;

    if (payload.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { wodName, score, date } = body;

    // Validate WOD name
    const validWods = [
      'fran', 'grace', 'helen', 'diane', 'elizabeth', 'cindy', 'annie', 
      'kelly', 'jackie', 'karen', 'amanda', 'murph', 'chelsea', 'mary',
      'angie', 'barbara', 'eva', 'lynne', 'nicole', 'isabel'
    ];
    if (!validWods.includes(wodName.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid WOD name' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Prepare the score object
    const scoreData: any = {
      date: date || new Date(),
      rxd: score.rxd || false
    };

    // Add the appropriate score field based on what's provided
    if (score.time !== undefined) scoreData.time = score.time;
    if (score.rounds !== undefined) scoreData.rounds = score.rounds;
    if (score.reps !== undefined) scoreData.reps = score.reps;
    if (score.weight !== undefined) scoreData.weight = score.weight;

    // Update using dot notation to update specific benchmark
    const updatePath = `crossfitData.benchmarkScores.${wodName.toLowerCase()}`;
    
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          [updatePath]: scoreData
        } 
      },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      user,
      message: `${wodName.toUpperCase()} score updated successfully`
    });
  } catch (error) {
    console.error('Update benchmark score error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    await dbConnect();
    const user = await UserModel.findById(userId).select('crossfitData.benchmarkScores');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      benchmarkScores: user.crossfitData?.benchmarkScores || {}
    });
  } catch (error) {
    console.error('Get benchmark scores error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}