import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

// Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Validate token and get user info
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { user } = await userResponse.json();

    // Check if user has permission to view users
    if (user.role !== UserRoleEnum.SUPER_ADMIN && user.role !== UserRoleEnum.ADMIN) {
      console.error(`Unauthorized access attempt by user ${user.id} to get user ${params.id}`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch user
    const targetUser = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`User ${params.id} accessed by user ${user.id}`);
    return NextResponse.json({ user: targetUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Validate token and get user info
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { user } = await userResponse.json();

    // Check if user has permission to update users
    if (user.role !== UserRoleEnum.SUPER_ADMIN && user.role !== UserRoleEnum.ADMIN) {
      console.error(`Unauthorized access attempt by user ${user.id} to update user ${params.id}`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { name, role, department, password } = body;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate role if provided
    if (role && !Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check for SQL injection
    if (name && containsSQLInjection(name)) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (password !== undefined) updateData.password = password; // In production, this should be hashed

    // Update user
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        updatedAt: true
      }
    });

    console.log(`User ${params.id} updated by user ${user.id}`);
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Validate token and get user info
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { user } = await userResponse.json();

    // Only SUPER_ADMIN can delete users
    if (user.role !== UserRoleEnum.SUPER_ADMIN) {
      console.error(`Unauthorized access attempt by user ${user.id} to delete user ${params.id}`);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (user.id === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete user
    await db.user.delete({
      where: { id: params.id }
    });

    console.log(`User ${params.id} deleted by user ${user.id}`);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}