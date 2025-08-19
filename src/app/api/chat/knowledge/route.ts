import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, userId, patientId } = body

    // Search knowledge base for relevant answers
    const knowledgeBase = await db.chatbotKnowledge.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        priority: 'desc'
      }
    })

    // Simple keyword matching algorithm
    const messageLower = message.toLowerCase()
    let bestMatch = null
    let highestScore = 0

    for (const knowledge of knowledgeBase) {
      let score = 0
      
      // Check if question contains keywords
      const keywords = knowledge.keywords ? JSON.parse(knowledge.keywords) : []
      for (const keyword of keywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          score += 2
        }
      }

      // Check if message contains words from the question
      const questionWords = knowledge.question.toLowerCase().split(/\s+/)
      for (const word of questionWords) {
        if (word.length > 3 && messageLower.includes(word)) {
          score += 1
        }
      }

      // Category-specific scoring
      if (messageLower.includes('queue') && knowledge.category === 'QUEUE') score += 3
      if (messageLower.includes('pharmacy') && knowledge.category === 'PHARMACY') score += 3
      if (messageLower.includes('appointment') && knowledge.category === 'GENERAL') score += 2
      if (messageLower.includes('billing') && knowledge.category === 'BILLING') score += 3
      if (messageLower.includes('emergency') && knowledge.category === 'MEDICAL') score += 4

      if (score > highestScore) {
        highestScore = score
        bestMatch = knowledge
      }
    }

    // If we found a good match, return it
    if (bestMatch && highestScore >= 2) {
      return NextResponse.json({
        success: true,
        data: {
          answer: bestMatch.answer,
          category: bestMatch.category,
          confidence: Math.min(highestScore / 10, 1)
        }
      })
    }

    // No good match found
    return NextResponse.json({
      success: false,
      error: 'No relevant knowledge found'
    })

  } catch (error) {
    console.error('Error searching knowledge base:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to search knowledge base'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const knowledge = await db.chatbotKnowledge.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        priority: 'desc',
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        knowledge: knowledge.map(k => ({
          ...k,
          keywords: k.keywords ? JSON.parse(k.keywords) : []
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch knowledge base'
    }, { status: 500 })
  }
}