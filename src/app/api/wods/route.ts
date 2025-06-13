import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
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
    if (!body.name || !body.classification?.scoringType) {
      return NextResponse.json(
        { error: 'Name and scoring type are required' },
        { status: 400 }
      );
    }

    if (!body.structure?.movements || body.structure.movements.length === 0) {
      return NextResponse.json(
        { error: 'At least one movement is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create WOD
    const wod = await WodModel.create({
      ...body,
      metadata: {
        ...body.metadata,
        createdBy: payload.userId,
      },
    });

    return NextResponse.json({ wod });
  } catch (error) {
    console.error('Create WOD error:', error);
    return NextResponse.json(
      { error: 'Failed to create WOD' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const isPublic = searchParams.get('public') === 'true';

    await dbConnect();

    let query: any = {};
    if (isPublic) {
      query['metadata.isPublic'] = true;
    }

    const wods = await WodModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('metadata.createdBy', 'username displayName profilePicture');

    return NextResponse.json({ wods });
  } catch (error) {
    console.error('Get WODs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WODs' },
      { status: 500 }
    );
  }
}