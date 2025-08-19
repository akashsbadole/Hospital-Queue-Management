import { NextRequest, NextResponse } from 'next/server'
import { validatePatientData, sanitizePatientData, validateLoginCredentials } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Parse and validate input
    const body = await request.json()
    
    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate patient data
    const validation = validatePatientData(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Sanitize input data
    const sanitizedData = sanitizePatientData(body)

    // Generate queue token (mock implementation)
    const queueToken = `Q${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    
    // Mock patient ID generation
    const patientId = `PAT${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`

    // In a real implementation, you would save to database here
    // For now, we'll just return success response
    
    // Log the registration (in production, use proper logging)
    console.log('Patient registration:', {
      patientId,
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      email: sanitizedData.email,
      queueToken
    })

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        queueToken,
        message: 'Patient registered successfully'
      }
    })

  } catch (error) {
    console.error('Patient registration error:', error)
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}