import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch real departments from database
    const departments = await db.department.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate queue statistics for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        // Get queue entries for this department
        const queueEntries = await db.oPDQueue.findMany({
          where: {
            departmentId: dept.id
          }
        })

        // Calculate statistics
        const waitingCount = queueEntries.filter(entry => entry.status === 'WAITING').length
        const servingCount = queueEntries.filter(entry => entry.status === 'SERVING').length
        const calledCount = queueEntries.filter(entry => entry.status === 'CALLED').length
        
        // Find the current token (highest serving or called token)
        const servingOrCalledEntries = queueEntries.filter(
          entry => entry.status === 'SERVING' || entry.status === 'CALLED'
        )
        const currentToken = servingOrCalledEntries.length > 0 
          ? Math.max(...servingOrCalledEntries.map(entry => entry.tokenNumber))
          : null

        // Generate department code if not exists
        const code = dept.name.substring(0, 3).toUpperCase()

        return {
          id: dept.id,
          name: dept.name,
          code,
          description: dept.description || `${dept.name} department`,
          currentToken: currentToken ? currentToken.toString() : null,
          waitingCount,
          servingCount,
          calledCount,
          totalEntries: queueEntries.length
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        departments: departmentsWithStats
      }
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch departments'
    }, { status: 500 })
  }
}