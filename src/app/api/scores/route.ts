import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ScoreModel from '@/models/Score';
import WodModel from '@/models/Wod';
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

    // Validate required fields
    if (!body.wodId || !body.performance?.score) {
      return NextResponse.json(
        { error: 'WOD ID and score are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify WOD exists
    const wod = await WodModel.findById(body.wodId);
    if (!wod) {
      return NextResponse.json(
        { error: 'WOD not found' },
        { status: 404 }
      );
    }

    // Create score
    const score = await ScoreModel.create({
      userId: payload.userId,
      wodId: body.wodId,
      performance: body.performance,
      details: body.details,
      social: {
        isPublic: body.isPublic !== false, // Default to public
      },
    });

    // Update WOD completed count
    await WodModel.findByIdAndUpdate(body.wodId, {
      $inc: { 'engagement.completedCount': 1 },
    });

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Create score error:', error);
    return NextResponse.json(
      { error: 'Failed to create score' },
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