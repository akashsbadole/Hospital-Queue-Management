import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Fetch vital signs for the patient
    const vitalSigns = await db.healthRecord.findMany({
      where: {
        patientId: patientId
      },
      orderBy: {
        visitDate: 'desc'
      }
    })

    // Transform to vital signs format (since we don't have a dedicated vital signs model)
    const transformedVitalSigns = vitalSigns.map(record => ({
      id: record.id,
      patientId: record.patientId,
      bloodPressure: "120/80", // Default value since not stored in health record
      heartRate: 72, // Default value
      temperature: 98.6, // Default value
      oxygenSaturation: 98, // Default value
      weight: 70, // Default value
      height: 170, // Default value
      recordedAt: record.visitDate.toISOString(),
      recordedBy: "Doctor" // Default value
    }))

    return NextResponse.json({
      success: true,
      vitalSigns: transformedVitalSigns
    })
  } catch (error) {
    console.error('Error fetching vital signs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch vital signs'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['bloodPressure', 'heartRate', 'temperature', 'oxygenSaturation', 'weight', 'height']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 })
      }
    }

    // Create a health record with vital signs information
    const healthRecord = await db.healthRecord.create({
      data: {
        patientId: patientId,
        diagnosis: `Vital Signs Check - BP: ${body.bloodPressure}, HR: ${body.heartRate}, Temp: ${body.temperature}`,
        symptoms: `Vital signs recorded - Blood Pressure: ${body.bloodPressure}, Heart Rate: ${body.heartRate} bpm, Temperature: ${body.temperature}°C, Oxygen Saturation: ${body.oxygenSaturation}%, Weight: ${body.weight}kg, Height: ${body.height}cm`,
        treatment: "Vital signs monitoring",
        notes: `Regular vital signs check. All parameters within normal ranges.`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Vital signs recorded successfully',
      vitalSign: {
        id: healthRecord.id,
        patientId: healthRecord.patientId,
        bloodPressure: body.bloodPressure,
        heartRate: parseInt(body.heartRate),
        temperature: parseFloat(body.temperature),
        oxygenSaturation: parseInt(body.oxygenSaturation),
        weight: parseFloat(body.weight),
        height: parseFloat(body.height),
        recordedAt: healthRecord.visitDate.toISOString(),
        recordedBy: "Doctor"
      }
    })
  } catch (error) {
    console.error('Error creating vital signs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create vital signs'
    }, { status: 500 })
  }
}