import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Get all prescriptions
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (patientId) where.patientId = patientId
    if (doctorId) where.doctorId = doctorId

    // Fetch prescriptions with pagination
    const [prescriptions, total] = await Promise.all([
      db.prescription.findMany({
        where,
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
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          issuedDate: 'desc'
        },
        skip,
        take: limit
      }),
      db.prescription.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prescriptions'
    }, { status: 500 })
  }
}

// Create new prescription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, doctorId, diagnosis, medications, notes } = body

    console.log('Prescription creation request:', body)

    // Validate required fields
    if (!patientId || !diagnosis || !medications) {
      console.log('Missing required fields:', { patientId: !!patientId, diagnosis: !!diagnosis, medications: !!medications })
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: patientId, diagnosis, medications'
      }, { status: 400 })
    }

    // Validate medications array
    if (!Array.isArray(medications) || medications.length === 0) {
      console.log('Invalid medications:', medications)
      return NextResponse.json({
        success: false,
        error: 'Medications must be a non-empty array'
      }, { status: 400 })
    }

    // Check if patient exists
    const patient = await db.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      console.log('Patient not found:', patientId)
      return NextResponse.json({
        success: false,
        error: 'Patient not found'
      }, { status: 404 })
    }

    // Create prescription
    const prescription = await db.prescription.create({
      data: {
        patientId,
        doctorId: doctorId || null,
        diagnosis,
        medications: JSON.stringify(medications),
        notes: notes || null
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
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    console.log('Prescription created successfully:', prescription.id)

    // Add patient to pharmacy queue if prescription has medications
    if (medications && medications.length > 0) {
      try {
        // Get pharmacy department
        const pharmacyDept = await db.department.findFirst({
          where: { name: { contains: 'pharmacy', mode: 'insensitive' } }
        })

        if (pharmacyDept) {
          // Get the next token number for pharmacy queue
          const lastQueue = await db.pharmacyQueue.findFirst({
            orderBy: { tokenNumber: 'desc' }
          })

          const nextTokenNumber = lastQueue ? parseInt(lastQueue.tokenNumber) + 1 : 1

          // Add to pharmacy queue
          await db.pharmacyQueue.create({
            data: {
              tokenNumber: nextTokenNumber.toString(),
              patientId: patientId,
              departmentId: pharmacyDept.id,
              status: 'WAITING',
              priority: 'NORMAL',
              notes: `Prescription ID: ${prescription.id}`
            }
          })
          console.log('Patient added to pharmacy queue successfully')
        }
      } catch (queueError) {
        console.error('Error adding patient to pharmacy queue:', queueError)
        // Don't fail the prescription creation if queue addition fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        prescription,
        message: 'Prescription created successfully'
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create prescription'
    }, { status: 500 })
  }
}