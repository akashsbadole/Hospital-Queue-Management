import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch patients from database
    const patients = await db.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
        dateOfBirth: true,
        bloodGroup: true,
        address: true,
        city: true,
        state: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        patients: patients
      }
    })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch patients'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'age', 'gender']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 })
      }
    }

    // Create patient
    const patient = await db.patient.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        age: parseInt(body.age),
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        bloodGroup: body.bloodGroup || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        country: body.country || 'India',
        postalCode: body.postalCode || null,
        emergencyContact: body.emergencyContact || null,
        emergencyPhone: body.emergencyPhone || null,
        caste: body.caste || null,
        religion: body.religion || null,
        hasBPLCard: body.hasBPLCard || false,
        bplCardNumber: body.bplCardNumber || null,
        hasYellowCard: body.hasYellowCard || false,
        yellowCardNumber: body.yellowCardNumber || null,
        aadhaarNumber: body.aadhaarNumber || null,
        panNumber: body.panNumber || null,
        nationality: body.nationality || 'Indian',
        maritalStatus: body.maritalStatus || null,
        occupation: body.occupation || null,
        annualIncome: body.annualIncome || null,
        education: body.education || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        patient: patient,
        message: 'Patient created successfully'
      }
    })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create patient'
    }, { status: 500 })
  }
}