import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { assignedTo } = body

    const ticket = await db.supportTicket.update({
      where: { id: params.id },
      data: { assignedTo },
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
    console.error('Error assigning ticket:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to assign ticket'
    }, { status: 500 })
  }
}