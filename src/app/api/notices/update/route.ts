import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Notice ID is required'
      }, { status: 400 })
    }

    const updatedNotice = await db.staffNotice.update({
      where: { id: body.id },
      data: {
        title: body.title,
        content: body.content,
        type: body.type,
        targetRole: body.targetRole,
        priority: body.priority,
        isActive: body.isActive !== undefined ? body.isActive : true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        notice: updatedNotice,
        message: 'Notice updated successfully'
      }
    })
  } catch (error) {
    console.error('Error updating notice:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update notice'
    }, { status: 500 })
  }
}