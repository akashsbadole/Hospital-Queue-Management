import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content, type, targetRole, priority, isActive } = await request.json();

    const updatedNotice = await db.staffNotice.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(type && { type }),
        ...(targetRole && { targetRole }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notice: updatedNotice
      }
    });
  } catch (error) {
    console.error('Error updating staff notice:', error);
    return NextResponse.json(
      { error: 'Failed to update staff notice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.staffNotice.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Staff notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting staff notice:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff notice' },
      { status: 500 }
    );
  }
}