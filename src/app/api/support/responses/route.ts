import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, userId, content, isInternal = false, attachments } = body

    // Create response
    const response = await db.supportTicketResponse.create({
      data: {
        ticketId,
        userId,
        content,
        isInternal,
        attachments: attachments ? JSON.stringify(attachments) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            status: true
          }
        }
      }
    })

    // Update ticket status if it's a customer response
    if (!isInternal) {
      await db.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // Emit socket event for real-time notification
    try {
      if (global.io) {
        global.io.emit('new-ticket-response', {
          response,
          ticketId,
          message: 'New response added to ticket'
        })
      }
    } catch (socketError) {
      console.log('Socket.IO emit failed:', socketError)
    }

    return NextResponse.json({
      success: true,
      data: {
        response
      }
    })
  } catch (error) {
    console.error('Error creating response:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create response'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')

    if (!ticketId) {
      return NextResponse.json({
        success: false,
        error: 'Ticket ID is required'
      }, { status: 400 })
    }

    const responses = await db.supportTicketResponse.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        responses: responses.map(response => ({
          ...response,
          attachments: response.attachments ? JSON.parse(response.attachments) : []
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch responses'
    }, { status: 500 })
  }
}