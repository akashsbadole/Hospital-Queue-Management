import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const purpose = searchParams.get('purpose')

    let whereClause: any = {}
    
    if (status && status !== 'all') {
      whereClause.status = status
    }
    
    if (purpose && purpose !== 'all') {
      whereClause.purpose = purpose
    }

    const visitors = await db.visitor.findMany({
      where: whereClause,
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
      },
      orderBy: {
        entryTime: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        visitors
      }
    })
  } catch (error) {
    console.error('Failed to fetch visitors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch visitors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      firstName,
      lastName,
      phone,
      email,
      purpose,
      patientId,
      department,
      hostUserId,
      idProof,
      idProofNumber,
      notes
    } = body

    // Generate visitor number
    const visitorCount = await db.visitor.count()
    const visitorNumber = `V${String(visitorCount + 1).padStart(4, '0')}`

    // Generate QR code data
    const qrData = JSON.stringify({
      visitorNumber,
      firstName,
      lastName,
      purpose,
      entryTime: new Date().toISOString()
    })

    // Generate barcode data
    const barcodeData = visitorNumber

    const visitor = await db.visitor.create({
      data: {
        visitorNumber,
        firstName,
        lastName,
        phone,
        email,
        purpose,
        patientId,
        department,
        hostUserId,
        idProof,
        idProofNumber,
        qrCode: qrData,
        barcode: barcodeData,
        notes,
        entryTime: new Date()
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
    console.error('Failed to create visitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create visitor' },
      { status: 500 }
    )
  }
}