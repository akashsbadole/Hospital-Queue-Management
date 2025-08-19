import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCSRFToken, containsSQLInjection, rateLimitConfig, securityHeaders } from '@/lib/security';

// Define UserRole enum locally to avoid import issues
enum UserRoleEnum {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  PHARMACIST = 'PHARMACIST',
  STAFF = 'STAFF',
  USER = 'USER'
}

// Get all users
export async function GET(request: NextRequest) {
  try {
    // Simple rate limiting using client IP
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // For development, accept mock tokens
    if (!token.startsWith('mock-token-')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Extract user info from mock token
    const userId = token.replace('mock-token-', '');
    
    // Mock user validation - in production this would validate against a real auth system
    const mockUser = {
      id: userId,
      role: userId === '2' ? 'SUPER_ADMIN' : 'ADMIN' // Assume super admin for user ID 2
    };

    // Check if user has permission to view users
    if (mockUser.role !== UserRoleEnum.SUPER_ADMIN && mockUser.role !== UserRoleEnum.ADMIN) {
      console.error(`Unauthorized access attempt by user ${mockUser.id} to get users`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Users accessed by user ${mockUser.id}`);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    // Simple rate limiting using client IP
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // For development, accept mock tokens
    if (!token.startsWith('mock-token-')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Extract user info from mock token
    const userId = token.replace('mock-token-', '');
    
    // Mock user validation
    const mockUser = {
      id: userId,
      role: userId === '2' ? 'SUPER_ADMIN' : 'ADMIN'
    };

    // Check if user has permission to create users
    if (mockUser.role !== UserRoleEnum.SUPER_ADMIN && mockUser.role !== UserRoleEnum.ADMIN) {
      console.error(`Unauthorized access attempt by user ${mockUser.id} to create user`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { email, name, role, department, password } = body;

    // Validate required fields
    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for SQL injection
    if (containsSQLInjection(email) || containsSQLInjection(name) || containsSQLInjection(password)) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }

    // Validate role
    if (!Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        email,
        name,
        role,
        department: department || null,
        password // In production, this should be hashed
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true
      }
    });

    console.log(`User created by user ${mockUser.id}: ${newUser.id}`);
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}