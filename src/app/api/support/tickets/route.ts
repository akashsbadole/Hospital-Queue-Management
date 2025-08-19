import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Generate unique ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TICK-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      title,
      description,
      category = "GENERAL",
      priority = "MEDIUM",
      userId,
      patientId,
      email,
      phone,
      tags
    } = body

    // Create support ticket
    const ticketData: any = {
      ticketNumber: generateTicketNumber(),
      title,
      description,
      category,
      priority,
      tags: tags ? JSON.stringify(tags) : null
    }

    // Only add email and phone if they exist
    if (email) ticketData.email = email
    if (phone) ticketData.phone = phone

    // Only add userId and patientId if they exist and are not null
    if (userId && userId !== "null" && userId !== "") {
      ticketData.userId = userId
    }
    if (patientId && patientId !== "null" && patientId !== "") {
      ticketData.patientId = patientId
    }

    const ticket = await db.supportTicket.create({
      data: ticketData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    })

    // Emit socket event for real-time notification
    try {
      if (global.io) {
        global.io.emit('new-support-ticket', {
          ticket,
          message: 'New support ticket created'
        })
      }
    } catch (socketError) {
      console.log('Socket.IO emit failed:', socketError)
    }

    return NextResponse.json({
      success: true,
      data: {
        ticket
      }
    })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create support ticket'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')
    const assignedTo = searchParams.get('assignedTo')

    const whereClause: any = {}
    if (status) whereClause.status = status
    if (category) whereClause.category = category
    if (priority) whereClause.priority = priority
    if (userId) whereClause.userId = userId
    if (assignedTo) whereClause.assignedTo = assignedTo

    const tickets = await db.supportTicket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        tickets: tickets.map(ticket => ({
          ...ticket,
          tags: ticket.tags ? JSON.parse(ticket.tags) : [],
          attachments: ticket.attachments ? JSON.parse(ticket.attachments) : []
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch support tickets'
    }, { status: 500 })
  }
}