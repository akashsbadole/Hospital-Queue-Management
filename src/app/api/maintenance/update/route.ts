import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { id, message, startTime, endTime, createdBy } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Maintenance ID is required' },
        { status: 400 }
      );
    }

    const updatedMaintenance = await db.maintenanceMode.update({
      where: { id },
      data: {
        message,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        createdBy
      }
    });

    return NextResponse.json(updatedMaintenance);
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance mode' },
      { status: 500 }
    );
  }
}