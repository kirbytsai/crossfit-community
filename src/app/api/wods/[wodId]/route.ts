import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import WodModel from '@/models/Wod';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

interface Params {
  params: Promise<{
    wodId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { wodId } = await params;

    console.log('Getting WOD with ID:', wodId);

    if (!mongoose.Types.ObjectId.isValid(wodId)) {
      return NextResponse.json(
        { error: 'Invalid WOD ID format' },
        { status: 400 }
      );
    }

    await dbConnect();

    const wod = await WodModel.findById(wodId).lean();

    if (!wod) {
      return NextResponse.json(
        { error: 'WOD not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ wod });
  } catch (error) {
    console.error('Get WOD error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WOD' },
      { status: 500 }
    );
  }
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
    const { wodId } = await params;
    const body = await request.json();

    await dbConnect();

    // Check ownership
    const wod = await WodModel.findById(wodId);
    if (!wod) {
      return NextResponse.json(
        { error: 'WOD not found' },
        { status: 404 }
      );
    }

    if (wod.metadata.createdBy.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'You can only edit your own WODs' },
        { status: 403 }
      );
    }

    // Update WOD
    const updatedWod = await WodModel.findByIdAndUpdate(
      wodId,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ wod: updatedWod });
  } catch (error) {
    console.error('Update WOD error:', error);
    return NextResponse.json(
      { error: 'Failed to update WOD' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const { wodId } = await params;

    await dbConnect();

    // Check ownership
    const wod = await WodModel.findById(wodId);
    if (!wod) {
      return NextResponse.json(
        { error: 'WOD not found' },
        { status: 404 }
      );
    }

    if (wod.metadata.createdBy.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'You can only delete your own WODs' },
        { status: 403 }
      );
    }

    await WodModel.findByIdAndDelete(wodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete WOD error:', error);
    return NextResponse.json(
      { error: 'Failed to delete WOD' },
      { status: 500 }
    );
  }
}