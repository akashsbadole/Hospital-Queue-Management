import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitor = await db.visitor.update({
      where: { id: params.id },
      data: {
        exitTime: new Date(),
        status: 'EXITED'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            gender: true
          }
        },
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        visitor
      }
    })
  } catch (error) {
    console.error('Failed to record visitor exit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record visitor exit' },
      { status: 500 }
    )
  }
}