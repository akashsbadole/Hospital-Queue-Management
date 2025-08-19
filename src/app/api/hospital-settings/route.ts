import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get hospital settings
    let settings = await db.hospitalSetting.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.hospitalSetting.create({
        data: {
          hospitalName: "Hospital Queue Management",
          primaryColor: "#3b82f6",
          secondaryColor: "#64748b"
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('Error fetching hospital settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospital settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      hospitalName,
      logoUrl,
      primaryColor,
      secondaryColor,
      address,
      phone,
      email,
      website
    } = await request.json();

    // Get current settings
    let settings = await db.hospitalSetting.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    let updatedSettings;

    if (settings) {
      // Update existing settings
      updatedSettings = await db.hospitalSetting.update({
        where: { id: settings.id },
        data: {
          ...(hospitalName !== undefined && { hospitalName }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website })
        }
      });
    } else {
      // Create new settings
      updatedSettings = await db.hospitalSetting.create({
        data: {
          hospitalName: hospitalName || "Hospital Queue Management",
          logoUrl,
          primaryColor: primaryColor || "#3b82f6",
          secondaryColor: secondaryColor || "#64748b",
          address,
          phone,
          email,
          website
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: updatedSettings
      }
    });
  } catch (error) {
    console.error('Error updating hospital settings:', error);
    return NextResponse.json(
      { error: 'Failed to update hospital settings' },
      { status: 500 }
    );
  }
}