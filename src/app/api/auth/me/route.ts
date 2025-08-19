import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock user data for demonstration
    const mockUser = {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      role: "SUPER_ADMIN",
      department: {
        id: "1",
        name: "Administration"
      }
    }

    return NextResponse.json({ user: mockUser })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}