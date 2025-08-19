import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch report history
    const reports = await db.reportLog.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 reports
    })

    return NextResponse.json({
      success: true,
      data: {
        reports: reports
      }
    })
  } catch (error) {
    console.error('Error fetching report history:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch report history'
    }, { status: 500 })
  }
}