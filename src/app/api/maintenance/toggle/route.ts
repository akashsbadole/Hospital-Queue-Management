import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { isEnabled, message, startTime, endTime, createdBy } = await request.json();

    // Get current maintenance mode
    const currentMaintenance = await db.maintenanceMode.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (currentMaintenance) {
      // Update existing maintenance mode
      const updatedMaintenance = await db.maintenanceMode.update({
        where: { id: currentMaintenance.id },
        data: {
          isEnabled: isEnabled ?? currentMaintenance.isEnabled,
          message: message ?? currentMaintenance.message,
          startTime: startTime ? new Date(startTime) : currentMaintenance.startTime,
          endTime: endTime ? new Date(endTime) : currentMaintenance.endTime,
          createdBy: createdBy ?? currentMaintenance.createdBy
        }
      });
      return NextResponse.json(updatedMaintenance);
    } else {
      // Create new maintenance mode record
      const newMaintenance = await db.maintenanceMode.create({
        data: {
          isEnabled: isEnabled ?? false,
          message: message ?? 'System is under maintenance. Please check back later.',
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          createdBy: createdBy
        }
      });
      return NextResponse.json(newMaintenance);
    }
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to toggle maintenance mode' },
      { status: 500 }
    );
  }
}