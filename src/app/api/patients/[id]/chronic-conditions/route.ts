import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Fetch health records for the patient that might contain chronic condition information
    const healthRecords = await db.healthRecord.findMany({
      where: {
        patientId: patientId
      },
      orderBy: {
        visitDate: 'desc'
      }
    })

    // Transform to chronic conditions format (extracting from diagnosis field)
    const chronicConditions = healthRecords
      .filter(record => {
        // Look for keywords that suggest chronic conditions
        const chronicKeywords = ['diabetes', 'hypertension', 'asthma', 'arthritis', 'heart disease', 'chronic', 'depression', 'anxiety']
        return chronicKeywords.some(keyword => 
          record.diagnosis.toLowerCase().includes(keyword) || 
          (record.symptoms && record.symptoms.toLowerCase().includes(keyword))
        )
      })
      .map(record => ({
        id: record.id,
        patientId: record.patientId,
        condition: record.diagnosis,
        diagnosisDate: record.visitDate.toISOString().split('T')[0],
        severity: 'moderate' as const, // Default severity
        treatment: record.treatment || 'Under treatment',
        notes: record.notes || 'Chronic condition being monitored'
      }))

    return NextResponse.json({
      success: true,
      chronicConditions: chronicConditions
    })
  } catch (error) {
    console.error('Error fetching chronic conditions:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chronic conditions'
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
    const requiredFields = ['condition', 'diagnosisDate', 'severity', 'treatment']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 })
      }
    }

    // Create a health record with chronic condition information
    const healthRecord = await db.healthRecord.create({
      data: {
        patientId: patientId,
        diagnosis: body.condition,
        symptoms: `Chronic condition: ${body.condition}. Severity: ${body.severity}. Treatment: ${body.treatment}`,
        treatment: body.treatment,
        prescription: body.notes || `Ongoing treatment for ${body.condition}`,
        notes: body.notes || `Chronic condition diagnosed on ${body.diagnosisDate}. ${body.severity} severity.`,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Chronic condition recorded successfully',
      chronicCondition: {
        id: healthRecord.id,
        patientId: healthRecord.patientId,
        condition: body.condition,
        diagnosisDate: body.diagnosisDate,
        severity: body.severity,
        treatment: body.treatment,
        notes: body.notes || ''
      }
    })
  } catch (error) {
    console.error('Error creating chronic condition:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create chronic condition'
    }, { status: 500 })
  }
}