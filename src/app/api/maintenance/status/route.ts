import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get maintenance mode status
    const maintenance = await db.maintenanceMode.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!maintenance) {
      // Create default maintenance mode record if none exists
      const defaultMaintenance = await db.maintenanceMode.create({
        data: {
          isEnabled: false,
          message: 'System is under maintenance. Please check back later.'
        }
      });
      return NextResponse.json(defaultMaintenance);
    }

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance status' },
      { status: 500 }
    );
  }
}