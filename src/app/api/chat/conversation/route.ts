import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId } = body

    // Create a new conversation
    const conversation = await db.chatConversation.create({
      data: {
        userId,
        sessionId,
        title: `Chat ${new Date().toLocaleString()}`
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        conversation
      }
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create conversation'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const conversations = await db.chatConversation.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1 // Get first message for preview
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      data: {
        conversations
      }
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conversations'
    }, { status: 500 })
  }
}