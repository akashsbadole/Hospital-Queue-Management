import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check maintenance mode
    const maintenance = await db.maintenanceMode.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch real queue entries from database
    const entries = await db.oPDQueue.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate estimated wait time for each entry
    const entriesWithWaitTime = entries.map(entry => {
      const waitTime = entry.status === 'WAITING' 
        ? Math.floor((new Date().getTime() - new Date(entry.createdAt).getTime()) / (1000 * 60))
        : entry.calledAt 
          ? Math.floor((new Date(entry.calledAt).getTime() - new Date(entry.createdAt).getTime()) / (1000 * 60))
          : 0

      return {
        id: entry.id,
        queueId: entry.departmentId,
        patientId: entry.patientId,
        patient: entry.patient,
        department: {
          ...entry.department,
          code: entry.department.name.substring(0, 3).toUpperCase()
        },
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        priority: entry.priority,
        notes: entry.notes,
        calledAt: entry.calledAt,
        servingAt: entry.servingAt,
        completedAt: entry.completedAt,
        createdAt: entry.createdAt,
        estimatedWaitTime: waitTime
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        queueEntries: entriesWithWaitTime,
        maintenance: maintenance || null
      }
    })
  } catch (error) {
    console.error('Error fetching queue status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch queue status'
    }, { status: 500 })
  }
}