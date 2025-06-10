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
    const { personalInfo } = body;

    console.log('Received personalInfo:', JSON.stringify(personalInfo, null, 2));

    // Validate personal info
    if (personalInfo.height && (personalInfo.height < 0 || personalInfo.height > 300)) {
      return NextResponse.json(
        { error: 'Invalid height value' },
        { status: 400 }
      );
    }

    if (personalInfo.weight && (personalInfo.weight < 0 || personalInfo.weight > 500)) {
      return NextResponse.json(
        { error: 'Invalid weight value' },
        { status: 400 }
      );
    }

    if (personalInfo.birthDate) {
      const birthDate = new Date(personalInfo.birthDate);
      const today = new Date();
      if (birthDate > today) {
        return NextResponse.json(
          { error: 'Birth date cannot be in the future' },
          { status: 400 }
        );
      }
    }

    // Validate injury notes
    if (personalInfo.injuryNotes && Array.isArray(personalInfo.injuryNotes)) {
      for (const injury of personalInfo.injuryNotes) {
        if (!injury.date || !injury.note) {
          return NextResponse.json(
            { error: 'Each injury note must have both date and note' },
            { status: 400 }
          );
        }
      }
    }

    await dbConnect();
    
    // 建立更新物件
    const updateData: any = {
      'personalInfo.height': personalInfo.height || undefined,
      'personalInfo.weight': personalInfo.weight || undefined,
      'personalInfo.gender': personalInfo.gender || undefined,
    };

    // 處理 birthDate
    if (personalInfo.birthDate) {
      updateData['personalInfo.birthDate'] = new Date(personalInfo.birthDate);
    }

    // 處理 injuryNotes
    if (personalInfo.injuryNotes) {
      updateData['personalInfo.injuryNotes'] = personalInfo.injuryNotes.map((injury: any) => ({
        date: new Date(injury.date),
        note: injury.note
      }));
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
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
      user 
    });
  } catch (error) {
    console.error('Update personal info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}