import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { containsSQLInjection } from '@/lib/security';

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

// Get all receipts
export async function GET(request: NextRequest) {
  try {
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
      role: userId === '2' ? 'SUPER_ADMIN' : userId === '5' ? 'PHARMACIST' : 'ADMIN'
    };

    // Check if user has permission to view receipts
    if (mockUser.role !== UserRoleEnum.SUPER_ADMIN && mockUser.role !== UserRoleEnum.ADMIN && mockUser.role !== UserRoleEnum.PHARMACIST) {
      console.error(`Unauthorized access attempt by user ${mockUser.id} to get receipts`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    // Fetch receipts with pagination
    const [receipts, total] = await Promise.all([
      db.receipt.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.receipt.count({ where })
    ]);

    console.log(`Receipts accessed by user ${mockUser.id}`);
    return NextResponse.json({
      receipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new receipt
export async function POST(request: NextRequest) {
  try {
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
      role: userId === '2' ? 'SUPER_ADMIN' : userId === '5' ? 'PHARMACIST' : 'ADMIN'
    };

    // Check if user has permission to create receipts
    if (mockUser.role !== UserRoleEnum.SUPER_ADMIN && mockUser.role !== UserRoleEnum.ADMIN && mockUser.role !== UserRoleEnum.PHARMACIST) {
      console.error(`Unauthorized access attempt by user ${mockUser.id} to create receipt`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { patientId, type, amount, description, items, paymentMethod } = body;

    // Validate required fields
    if (!patientId || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for SQL injection
    if (containsSQLInjection(patientId) || containsSQLInjection(type) || containsSQLInjection(amount.toString())) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }

    // Check if patient exists
    const patient = await db.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Generate receipt number
    const receiptNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create receipt
    const receipt = await db.receipt.create({
      data: {
        patientId,
        userId: mockUser.id,
        receiptNumber,
        type,
        amount: parseFloat(amount),
        description: description || null,
        items: items || null,
        paymentMethod: paymentMethod || null,
        status: 'PAID'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log(`Receipt created by user ${mockUser.id}: ${receipt.id}`);
    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}