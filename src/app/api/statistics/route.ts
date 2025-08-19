import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get current date and start of day
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all statistics in parallel
    const [
      totalPatients,
      patientsToday,
      patientsThisWeek,
      patientsThisMonth,
      opdQueues,
      pharmacyQueues,
      totalPrescriptions,
      prescriptionsToday,
      totalReceipts,
      receiptsToday,
      totalRevenue,
      revenueToday,
      activeDoctors,
      activePharmacists,
      departments,
      medicines
    ] = await Promise.all([
      // Total patients
      db.patient.count({ where: { isActive: true } }),
      
      // Patients registered today
      db.patient.count({
        where: {
          isActive: true,
          createdAt: { gte: startOfDay }
        }
      }),
      
      // Patients registered this week
      db.patient.count({
        where: {
          isActive: true,
          createdAt: { gte: startOfWeek }
        }
      }),
      
      // Patients registered this month
      db.patient.count({
        where: {
          isActive: true,
          createdAt: { gte: startOfMonth }
        }
      }),

      // OPD queue statistics
      db.oPDQueue.findMany({
        include: {
          patient: true,
          department: true
        }
      }),

      // Pharmacy queue statistics
      db.pharmacyQueue.findMany({
        include: {
          patient: true,
          department: true
        }
      }),

      // Total prescriptions
      db.prescription.count({ where: { isActive: true } }),
      
      // Prescriptions today
      db.prescription.count({
        where: {
          isActive: true,
          issuedDate: { gte: startOfDay }
        }
      }),

      // Total receipts
      db.receipt.count(),
      
      // Receipts today
      db.receipt.count({
        where: {
          createdAt: { gte: startOfDay }
        }
      }),

      // Total revenue
      db.receipt.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      }),

      // Revenue today
      db.receipt.aggregate({
        where: { 
          status: 'PAID',
          createdAt: { gte: startOfDay }
        },
        _sum: { amount: true }
      }),

      // Active doctors
      db.user.count({
        where: { 
          role: 'DOCTOR',
          isActive: true 
        }
      }),

      // Active pharmacists
      db.user.count({
        where: { 
          role: 'PHARMACIST',
          isActive: true 
        }
      }),

      // Departments
      db.department.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              oPDQueues: true,
              pharmacyQueues: true
            }
          }
        }
      }),

      // Medicines inventory
      db.medicine.findMany({
        where: { isActive: true }
      })
    ])

    // Calculate OPD queue statistics
    const opdWaiting = opdQueues.filter(q => q.status === 'WAITING').length
    const opdServing = opdQueues.filter(q => q.status === 'SERVING').length
    const opdCompleted = opdQueues.filter(q => q.status === 'COMPLETED').length

    // Calculate pharmacy queue statistics
    const pharmacyWaiting = pharmacyQueues.filter(q => q.status === 'WAITING').length
    const pharmacyServing = pharmacyQueues.filter(q => q.status === 'SERVING').length
    const pharmacyCompleted = pharmacyQueues.filter(q => q.status === 'COMPLETED').length

    // Calculate average wait times
    const opdWaitTimes = opdQueues
      .filter(q => q.calledAt && q.createdAt)
      .map(q => new Date(q.calledAt).getTime() - new Date(q.createdAt).getTime())
    
    const avgOpdWaitTime = opdWaitTimes.length > 0 
      ? Math.round(opdWaitTimes.reduce((a, b) => a + b, 0) / opdWaitTimes.length / (1000 * 60))
      : 0

    const pharmacyWaitTimes = pharmacyQueues
      .filter(q => q.calledAt && q.createdAt)
      .map(q => new Date(q.calledAt).getTime() - new Date(q.createdAt).getTime())
    
    const avgPharmacyWaitTime = pharmacyWaitTimes.length > 0 
      ? Math.round(pharmacyWaitTimes.reduce((a, b) => a + b, 0) / pharmacyWaitTimes.length / (1000 * 60))
      : 0

    // Calculate department-wise statistics
    const departmentStats = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      opdQueueCount: dept._count.oPDQueues,
      pharmacyQueueCount: dept._count.pharmacyQueues,
      totalQueueCount: dept._count.oPDQueues + dept._count.pharmacyQueues
    }))

    // Calculate medicine inventory statistics
    const totalMedicines = medicines.length
    const lowStockMedicines = medicines.filter(m => m.quantity < 10).length
    const outOfStockMedicines = medicines.filter(m => m.quantity === 0).length
    const totalInventoryValue = medicines.reduce((sum, m) => sum + (m.quantity * m.sellingPrice), 0)

    // Calculate growth percentages
    const patientGrowthToday = patientsToday > 0 ? 
      ((patientsToday / Math.max(patientsThisWeek - patientsToday, 1)) * 100).toFixed(1) : '0'
    
    const revenueGrowthToday = revenueToday._sum.amount && totalRevenue._sum.amount ? 
      (((revenueToday._sum.amount / Math.max(totalRevenue._sum.amount - revenueToday._sum.amount, 1)) * 100).toFixed(1)) : '0'

    return NextResponse.json({
      success: true,
      data: {
        // Patient Statistics
        patients: {
          total: totalPatients,
          today: patientsToday,
          thisWeek: patientsThisWeek,
          thisMonth: patientsThisMonth,
          growthToday: patientGrowthToday
        },

        // Queue Statistics
        queues: {
          opd: {
            waiting: opdWaiting,
            serving: opdServing,
            completed: opdCompleted,
            averageWaitTime: avgOpdWaitTime
          },
          pharmacy: {
            waiting: pharmacyWaiting,
            serving: pharmacyServing,
            completed: pharmacyCompleted,
            averageWaitTime: avgPharmacyWaitTime
          }
        },

        // Prescription Statistics
        prescriptions: {
          total: totalPrescriptions,
          today: prescriptionsToday
        },

        // Revenue Statistics
        revenue: {
          total: totalRevenue._sum.amount || 0,
          today: revenueToday._sum.amount || 0,
          growthToday: revenueGrowthToday
        },

        // Receipt Statistics
        receipts: {
          total: totalReceipts,
          today: receiptsToday
        },

        // Staff Statistics
        staff: {
          doctors: activeDoctors,
          pharmacists: activePharmacists
        },

        // Department Statistics
        departments: departmentStats,

        // Inventory Statistics
        inventory: {
          totalMedicines,
          lowStockMedicines,
          outOfStockMedicines,
          totalValue: totalInventoryValue
        },

        // System Health
        systemHealth: {
          totalActiveUsers: activeDoctors + activePharmacists,
          totalDepartments: departments.length,
          systemLoad: ((opdWaiting + pharmacyWaiting) / Math.max(opdQueues.length + pharmacyQueues.length, 1)) * 100
        }
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, { status: 500 })
  }
}