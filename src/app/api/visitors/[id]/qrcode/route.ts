import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitor = await db.visitor.findUnique({
      where: { id: params.id },
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

    if (!visitor) {
      return NextResponse.json(
        { success: false, error: 'Visitor not found' },
        { status: 404 }
      )
    }

    // Generate QR code (simplified - in production, use a proper QR code library)
    const qrCodeData = visitor.qrCode || JSON.stringify({
      visitorNumber: visitor.visitorNumber,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      purpose: visitor.purpose,
      entryTime: visitor.entryTime
    })

    // For now, we'll return a placeholder QR code URL
    // In production, you would generate an actual QR code image
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`

    return NextResponse.json({
      success: true,
      data: {
        visitorNumber: visitor.visitorNumber,
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        purpose: visitor.purpose,
        entryTime: visitor.entryTime,
        qrCode: qrCodeUrl
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}