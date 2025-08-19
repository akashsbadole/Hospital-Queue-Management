import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportType, format = 'JSON' } = body

    if (!reportType) {
      return NextResponse.json({
        success: false,
        error: 'Report type is required'
      }, { status: 400 })
    }

    let reportData: any = {}
    let reportTitle = ''

    switch (reportType) {
      case 'PATIENTS':
        reportTitle = 'Patients Report'
        const patients = await db.patient.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            age: true,
            gender: true,
            bloodGroup: true,
            address: true,
            city: true,
            state: true,
            createdAt: true,
            isActive: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        reportData = {
          totalPatients: patients.length,
          activePatients: patients.filter(p => p.isActive).length,
          patients: patients,
          generatedAt: new Date().toISOString()
        }
        break

      case 'FINANCIAL':
        reportTitle = 'Financial Report'
        const receipts = await db.receipt.findMany({
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        const totalRevenue = receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0)
        const paidReceipts = receipts.filter(r => r.status === 'PAID')
        const pendingReceipts = receipts.filter(r => r.status === 'PENDING')

        reportData = {
          totalRevenue,
          totalTransactions: receipts.length,
          paidTransactions: paidReceipts.length,
          pendingTransactions: pendingReceipts.length,
          averageTransactionValue: receipts.length > 0 ? totalRevenue / receipts.length : 0,
          receipts: receipts,
          generatedAt: new Date().toISOString()
        }
        break

      case 'QUEUE':
        reportTitle = 'Queue Management Report'
        const opdQueues = await db.oPDQueue.findMany({
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            department: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        const pharmacyQueues = await db.pharmacyQueue.findMany({
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            department: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        const queueStats = {
          opd: {
            total: opdQueues.length,
            waiting: opdQueues.filter(q => q.status === 'WAITING').length,
            serving: opdQueues.filter(q => q.status === 'SERVING').length,
            completed: opdQueues.filter(q => q.status === 'COMPLETED').length,
            averageWaitTime: calculateAverageWaitTime(opdQueues)
          },
          pharmacy: {
            total: pharmacyQueues.length,
            waiting: pharmacyQueues.filter(q => q.status === 'WAITING').length,
            serving: pharmacyQueues.filter(q => q.status === 'SERVING').length,
            completed: pharmacyQueues.filter(q => q.status === 'COMPLETED').length,
            averageWaitTime: calculateAverageWaitTime(pharmacyQueues)
          }
        }

        reportData = {
          queueStats,
          opdQueues,
          pharmacyQueues,
          generatedAt: new Date().toISOString()
        }
        break

      case 'MEDICINE':
        reportTitle = 'Medicine Inventory Report'
        const medicines = await db.medicine.findMany({
          orderBy: {
            name: 'asc'
          }
        })

        const inventoryStats = {
          totalMedicines: medicines.length,
          activeMedicines: medicines.filter(m => m.isActive).length,
          lowStock: medicines.filter(m => m.quantity < 10).length,
          outOfStock: medicines.filter(m => m.quantity === 0).length,
          totalValue: medicines.reduce((sum, med) => sum + (med.quantity * med.sellingPrice), 0)
        }

        reportData = {
          inventoryStats,
          medicines: medicines,
          generatedAt: new Date().toISOString()
        }
        break

      case 'STAFF':
        reportTitle = 'Staff Report'
        const users = await db.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            department: true,
            isActive: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        const staffStats = {
          totalStaff: users.length,
          activeStaff: users.filter(u => u.isActive).length,
          byRole: {
            DOCTOR: users.filter(u => u.role === 'DOCTOR').length,
            NURSE: users.filter(u => u.role === 'NURSE').length,
            PHARMACIST: users.filter(u => u.role === 'PHARMACIST').length,
            STAFF: users.filter(u => u.role === 'STAFF').length,
            ADMIN: users.filter(u => u.role === 'ADMIN').length,
            SUPER_ADMIN: users.filter(u => u.role === 'SUPER_ADMIN').length
          }
        }

        reportData = {
          staffStats,
          users: users,
          generatedAt: new Date().toISOString()
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid report type'
        }, { status: 400 })
    }

    // Log the report generation
    await db.reportLog.create({
      data: {
        reportType,
        title: reportTitle,
        data: JSON.stringify(reportData),
        format,
        generatedBy: 'admin' // In real app, get from user session
      }
    })

    // Format the response based on the requested format
    if (format === 'CSV') {
      const csvContent = convertToCSV(reportData, reportType)
      return NextResponse.json({
        success: true,
        data: {
          report: reportData,
          csvContent,
          title: reportTitle,
          format: 'CSV'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        report: reportData,
        title: reportTitle,
        format: 'JSON'
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report'
    }, { status: 500 })
  }
}

function calculateAverageWaitTime(queues: any[]): number {
  const completedQueues = queues.filter(q => q.status === 'COMPLETED' && q.completedAt && q.createdAt)
  if (completedQueues.length === 0) return 0
  
  const totalWaitTime = completedQueues.reduce((sum, queue) => {
    const waitTime = new Date(queue.completedAt).getTime() - new Date(queue.createdAt).getTime()
    return sum + waitTime
  }, 0)
  
  return Math.round(totalWaitTime / completedQueues.length / (1000 * 60)) // Convert to minutes
}

function convertToCSV(data: any, reportType: string): string {
  let csvContent = ''
  
  switch (reportType) {
    case 'PATIENTS':
      csvContent = 'Patient ID,First Name,Last Name,Email,Phone,Age,Gender,Blood Group,City,State,Created At,Active\n'
      data.patients.forEach((patient: any) => {
        csvContent += `${patient.id},${patient.firstName},${patient.lastName},${patient.email || ''},${patient.phone || ''},${patient.age},${patient.gender},${patient.bloodGroup || ''},${patient.city || ''},${patient.state || ''},${patient.createdAt},${patient.isActive}\n`
      })
      break
      
    case 'FINANCIAL':
      csvContent = 'Receipt ID,Patient Name,Type,Amount,Status,Payment Method,Issued By,Created At\n'
      data.receipts.forEach((receipt: any) => {
        csvContent += `${receipt.receiptNumber},${receipt.patient?.firstName || ''} ${receipt.patient?.lastName || ''},${receipt.type},${receipt.amount || 0},${receipt.status},${receipt.paymentMethod || ''},${receipt.user?.name || ''},${receipt.createdAt}\n`
      })
      break
      
    case 'MEDICINE':
      csvContent = 'Medicine Name,Category,Brand,Quantity,Unit Price,Selling Price,Expiry Date,Active\n'
      data.medicines.forEach((medicine: any) => {
        csvContent += `${medicine.name},${medicine.category},${medicine.brand || ''},${medicine.quantity},${medicine.unitPrice},${medicine.sellingPrice},${medicine.expiryDate},${medicine.isActive}\n`
      })
      break
      
    case 'STAFF':
      csvContent = 'User ID,Name,Email,Role,Department,Active,Created At\n'
      data.users.forEach((user: any) => {
        csvContent += `${user.id},${user.name},${user.email},${user.role},${user.department || ''},${user.isActive},${user.createdAt}\n`
      })
      break
      
    default:
      csvContent = 'Report Data\n'
      csvContent += JSON.stringify(data, null, 2)
  }
  
  return csvContent
}