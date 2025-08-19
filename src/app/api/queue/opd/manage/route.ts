import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Server } from 'socket.io'

export async function POST(request: NextRequest) {
  try {
    // Check maintenance mode
    const maintenance = await db.maintenanceMode.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (maintenance?.isEnabled) {
      return NextResponse.json({
        success: false,
        error: 'System is under maintenance. Queue operations are disabled.',
        maintenance: true
      }, { status: 503 });
    }

    const body = await request.json()
    const { action, queueId, entryId } = body

    console.log('Queue management action:', { action, queueId, entryId })

    switch (action) {
      case 'CALL_NEXT': {
        // Find the next waiting patient in the queue
        const nextEntry = await db.oPDQueue.findFirst({
          where: {
            departmentId: queueId,
            status: 'WAITING'
          },
          orderBy: [
            { priority: 'desc' }, // Emergency first, then Urgent, then Normal
            { createdAt: 'asc' }  // First come, first served within priority
          ]
        })

        if (!nextEntry) {
          return NextResponse.json({
            success: false,
            error: 'No patients waiting in queue'
          }, { status: 404 })
        }

        // Update the entry to CALLED status
        const updatedEntry = await db.oPDQueue.update({
          where: { id: nextEntry.id },
          data: {
            status: 'CALLED',
            calledAt: new Date()
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        })

        // Emit socket event for real-time update
        // Note: Socket.IO server is already running in server.ts, we'll emit through global io
        try {
          if (global.io) {
            global.io.emit('queue-updated', {
              action: 'CALL_NEXT',
              departmentId: queueId,
              entry: updatedEntry
            })
          }
        } catch (socketError) {
          console.log('Socket.IO emit failed:', socketError)
          // Continue even if socket emit fails
        }

        return NextResponse.json({
          success: true,
          data: {
            message: 'Next patient called successfully',
            calledToken: updatedEntry.tokenNumber,
            patient: updatedEntry.patient
          }
        })
      }

      case 'START_SERVING': {
        if (!entryId) {
          return NextResponse.json({
            success: false,
            error: 'Entry ID is required'
          }, { status: 400 })
        }

        // Update the entry to SERVING status
        const updatedEntry = await db.oPDQueue.update({
          where: { id: entryId },
          data: {
            status: 'SERVING',
            servingAt: new Date()
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        })

        // Emit socket event for real-time update
        try {
          if (global.io) {
            global.io.emit('queue-updated', {
              action: 'START_SERVING',
              entry: updatedEntry
            })
          }
        } catch (socketError) {
          console.log('Socket.IO emit failed:', socketError)
          // Continue even if socket emit fails
        }

        return NextResponse.json({
          success: true,
          data: {
            message: 'Started serving patient successfully',
            entry: updatedEntry
          }
        })
      }

      case 'COMPLETE_SERVING': {
        if (!entryId) {
          return NextResponse.json({
            success: false,
            error: 'Entry ID is required'
          }, { status: 400 })
        }

        // Update the entry to COMPLETED status
        const updatedEntry = await db.oPDQueue.update({
          where: { id: entryId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        })

        // Emit socket event for real-time update
        try {
          if (global.io) {
            global.io.emit('queue-updated', {
              action: 'COMPLETE_SERVING',
              entry: updatedEntry
            })
          }
        } catch (socketError) {
          console.log('Socket.IO emit failed:', socketError)
          // Continue even if socket emit fails
        }

        return NextResponse.json({
          success: true,
          data: {
            message: 'Completed serving patient successfully',
            entry: updatedEntry
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in queue management:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process queue management action'
    }, { status: 500 })
  }
}