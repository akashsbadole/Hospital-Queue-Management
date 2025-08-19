import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId, messages } = body

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create system prompt for hospital assistant
    const systemPrompt = `You are a helpful hospital assistant for a hospital queue management system. 
    Your role is to help patients and staff with:
    - Queue status and wait times
    - Appointment information
    - Hospital services and departments
    - General medical information (but always advise to consult doctors for specific medical advice)
    - Navigation and hospital information
    - Basic troubleshooting

    Always be helpful, professional, and empathetic. If you don't know something, admit it and suggest creating a support ticket.
    Keep responses concise but informative.

    Current context: This is a hospital queue management system with OPD, Pharmacy, and various departments.
    Users can be patients or staff members.`

    // Format messages for the AI
    const aiMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...messages.map((msg: any) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    // Get AI response
    const completion = await zai.chat.completions.create({
      messages: aiMessages,
      temperature: 0.7,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from AI')
    }

    return NextResponse.json({
      success: true,
      data: {
        response,
        conversationId
      }
    })

  } catch (error) {
    console.error('Error getting AI response:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get AI response'
    }, { status: 500 })
  }
}