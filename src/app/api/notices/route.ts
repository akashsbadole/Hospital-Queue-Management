import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch active staff notices, ordered by priority (highest first)
    const notices = await db.staffNotice.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: {
        notices: notices
      }
    })
  } catch (error) {
    console.error('Error fetching notices:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notices'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'content', 'type']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 })
      }
    }

    // Create notice
    const notice = await db.staffNotice.create({
      data: {
        title: body.title,
        content: body.content,
        type: body.type,
        targetRole: body.targetRole || null,
        priority: body.priority || 0,
        createdBy: body.createdBy || 'admin'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        notice: notice,
        message: 'Notice created successfully'
      }
    })
  } catch (error) {
    console.error('Error creating notice:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create notice'
    }, { status: 500 })
  }
}