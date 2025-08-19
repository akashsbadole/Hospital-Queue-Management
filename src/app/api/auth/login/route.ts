import { NextRequest, NextResponse } from 'next/server'
import { validateLoginCredentials, generateSecureToken } from '@/lib/security'

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
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Validate login credentials
    const validationErrors = validateLoginCredentials(email, password)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationErrors 
        },
        { status: 400 }
      )
    }

    // Mock authentication - in real implementation, check against database
    const user = authenticateUser(email, password)
    
    if (!user) {
      // Log failed login attempt
      console.log('Failed login attempt:', { email })
      
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = generateSecureToken()
    
    // Log successful login
    console.log('Successful login:', { 
      email, 
      userId: user.id,
      role: user.role 
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        sessionToken,
        message: 'Login successful'
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    
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

// Mock authentication function
function authenticateUser(email: string, password: string) {
  // Mock user database
  const users = [
    {
      id: '1',
      email: 'super@hospital.com',
      password: 'password', // In real app, use hashed passwords
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN'
    },
    {
      id: '2',
      email: 'admin@hospital.com',
      password: 'password',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    },
    {
      id: '3',
      email: 'doctor@hospital.com',
      password: 'password',
      firstName: 'Doctor',
      lastName: 'Smith',
      role: 'DOCTOR'
    },
    {
      id: '4',
      email: 'nurse@hospital.com',
      password: 'password',
      firstName: 'Nurse',
      lastName: 'Johnson',
      role: 'NURSE'
    },
    {
      id: '5',
      email: 'pharmacist@hospital.com',
      password: 'password',
      firstName: 'Pharmacist',
      lastName: 'Brown',
      role: 'PHARMACIST'
    },
    {
      id: '6',
      email: 'staff@hospital.com',
      password: 'password',
      firstName: 'Staff',
      lastName: 'Member',
      role: 'STAFF'
    }
  ]

  // Find user by email and check password
  const user = users.find(u => u.email === email && u.password === password)
  
  if (user) {
    // Return user without password
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  
  return null
}