import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch hospital settings
    const settings = await db.hospitalSetting.findFirst({
      where: {
        isActive: true
      }
    })

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await db.hospitalSetting.create({
        data: {
          hospitalName: 'Hospital Queue Management',
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          isActive: true
        }
      })
      return NextResponse.json({
        success: true,
        data: {
          settings: defaultSettings
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        settings: settings
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get current settings
    const currentSettings = await db.hospitalSetting.findFirst({
      where: {
        isActive: true
      }
    })

    if (currentSettings) {
      // Update existing settings
      const updatedSettings = await db.hospitalSetting.update({
        where: { id: currentSettings.id },
        data: {
          hospitalName: body.hospitalName || currentSettings.hospitalName,
          logoUrl: body.logoUrl || currentSettings.logoUrl,
          primaryColor: body.primaryColor || currentSettings.primaryColor,
          secondaryColor: body.secondaryColor || currentSettings.secondaryColor,
          address: body.address || currentSettings.address,
          phone: body.phone || currentSettings.phone,
          email: body.email || currentSettings.email,
          website: body.website || currentSettings.website
        }
      })
      return NextResponse.json({
        success: true,
        data: {
          settings: updatedSettings,
          message: 'Settings updated successfully'
        }
      })
    } else {
      // Create new settings
      const newSettings = await db.hospitalSetting.create({
        data: {
          hospitalName: body.hospitalName || 'Hospital Queue Management',
          logoUrl: body.logoUrl,
          primaryColor: body.primaryColor || '#3b82f6',
          secondaryColor: body.secondaryColor || '#64748b',
          address: body.address,
          phone: body.phone,
          email: body.email,
          website: body.website,
          isActive: true
        }
      })
      return NextResponse.json({
        success: true,
        data: {
          settings: newSettings,
          message: 'Settings created successfully'
        }
      })
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 })
  }
}