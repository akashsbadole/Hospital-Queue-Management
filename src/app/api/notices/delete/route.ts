import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Notice ID is required'
      }, { status: 400 })
    }

    await db.staffNotice.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Notice deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting notice:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete notice'
    }, { status: 500 })
  }
}