import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const updateData: any = { status }
    
    // If status is RESOLVED, set resolvedAt timestamp
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }

    const ticket = await db.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ticket
      }
    })
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update ticket status'
    }, { status: 500 })
  }
}