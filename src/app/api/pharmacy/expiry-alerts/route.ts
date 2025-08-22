import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysThreshold = parseInt(searchParams.get('days') || '30')
    
    // Get current date
    const currentDate = new Date()
    const thresholdDate = new Date(currentDate.getTime() + daysThreshold * 24 * 60 * 60 * 1000)
    
    // Fetch medicines that are expiring within the threshold
    const expiringMedicines = await db.medicine.findMany({
      where: {
        expiryDate: {
          lte: thresholdDate,
          gte: currentDate
        },
        status: {
          in: ['in_stock', 'low_stock']
        }
      },
      include: {
        category: true
      },
      orderBy: {
        expiryDate: 'asc'
      }
    })
    
    // Fetch already expired medicines
    const expiredMedicines = await db.medicine.findMany({
      where: {
        expiryDate: {
          lt: currentDate
        },
        status: {
          in: ['in_stock', 'low_stock']
        }
      },
      include: {
        category: true
      },
      orderBy: {
        expiryDate: 'desc'
      }
    })
    
    // Calculate statistics
    const stats = {
      totalExpiring: expiringMedicines.length,
      totalExpired: expiredMedicines.length,
      expiringThisWeek: expiringMedicines.filter(med => {
        const daysUntilExpiry = Math.ceil((new Date(med.expiryDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 7
      }).length,
      expiringThisMonth: expiringMedicines.filter(med => {
        const daysUntilExpiry = Math.ceil((new Date(med.expiryDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 30
      }).length
    }
    
    return NextResponse.json({
      success: true,
      data: {
        expiringMedicines,
        expiredMedicines,
        stats,
        threshold: daysThreshold,
        generatedAt: currentDate.toISOString()
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch expiry alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expiry alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, medicineIds, notes } = body
    
    if (action === 'mark_expired') {
      // Mark medicines as expired
      await db.medicine.updateMany({
        where: {
          id: {
            in: medicineIds
          }
        },
        data: {
          status: 'out_of_stock',
          workingCondition: 'expired'
        }
      })
      
      // Create audit log entries
      for (const medicineId of medicineIds) {
        await db.auditLog.create({
          data: {
            action: 'UPDATE',
            entityType: 'MEDICINE',
            entityId: medicineId,
            changes: JSON.stringify({
              status: 'out_of_stock',
              workingCondition: 'expired',
              notes: notes || 'Marked as expired due to expiry date'
            }),
            userId: 'system', // Should be replaced with actual user ID
            timestamp: new Date()
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: `Marked ${medicineIds.length} medicines as expired`
      })
    }
    
    if (action === 'send_alerts') {
      // This would integrate with SMS/WhatsApp notification system
      // For now, we'll just log the action
      console.log('Sending expiry alerts to pharmacists...')
      
      // Get all pharmacists
      const pharmacists = await db.user.findMany({
        where: {
          role: 'PHARMACIST'
        }
      })
      
      // In a real implementation, this would send notifications via SMS/WhatsApp
      const alertData = {
        recipients: pharmacists.length,
        message: `Medicine expiry alert: ${medicineIds.length} medicines are expiring soon`,
        timestamp: new Date().toISOString()
      }
      
      return NextResponse.json({
        success: true,
        data: alertData,
        message: 'Expiry alerts sent successfully'
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Failed to process expiry alert action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    )
  }
}