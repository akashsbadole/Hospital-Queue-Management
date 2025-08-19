import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, messages } = body

    // Save messages to database
    const savedMessages = await Promise.all(
      messages.map((msg: any) =>
        db.chatMessage.create({
          data: {
            conversationId,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata ? JSON.stringify(msg.metadata) : null
          }
        })
      )
    )

    // Update conversation timestamp
    await db.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      data: {
        messages: savedMessages
      }
    })
  } catch (error) {
    console.error('Error saving messages:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save messages'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({
        success: false,
        error: 'Conversation ID is required'
      }, { status: 400 })
    }

    const messages = await db.chatMessage.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map(msg => ({
          ...msg,
          metadata: msg.metadata ? JSON.parse(msg.metadata) : null
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch messages'
    }, { status: 500 })
  }
}