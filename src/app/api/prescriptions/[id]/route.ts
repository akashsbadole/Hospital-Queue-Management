import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Get single prescription
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id

    const prescription = await db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            gender: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true
          }
        }
      }
    })

    if (!prescription) {
      return NextResponse.json({
        success: false,
        error: 'Prescription not found'
      }, { status: 404 })
    }

    // Parse medications JSON
    const parsedPrescription = {
      ...prescription,
      medications: JSON.parse(prescription.medications || '[]')
    }

    return NextResponse.json({
      success: true,
      data: {
        prescription: parsedPrescription
      }
    })
  } catch (error) {
    console.error('Error fetching prescription:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prescription'
    }, { status: 500 })
  }
}

// Update prescription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id
    const body = await request.json()
    const { diagnosis, medications, notes, isActive } = body

    // Check if prescription exists
    const existingPrescription = await db.prescription.findUnique({
      where: { id: prescriptionId }
    })

    if (!existingPrescription) {
      return NextResponse.json({
        success: false,
        error: 'Prescription not found'
      }, { status: 404 })
    }

    // Update prescription
    const updatedPrescription = await db.prescription.update({
      where: { id: prescriptionId },
      data: {
        diagnosis: diagnosis || existingPrescription.diagnosis,
        medications: medications ? JSON.stringify(medications) : existingPrescription.medications,
        notes: notes !== undefined ? notes : existingPrescription.notes,
        isActive: isActive !== undefined ? isActive : existingPrescription.isActive
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    // Parse medications JSON for response
    const parsedPrescription = {
      ...updatedPrescription,
      medications: JSON.parse(updatedPrescription.medications || '[]')
    }

    return NextResponse.json({
      success: true,
      data: {
        prescription: parsedPrescription,
        message: 'Prescription updated successfully'
      }
    })
  } catch (error) {
    console.error('Error updating prescription:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update prescription'
    }, { status: 500 })
  }
}

// Delete prescription (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id

    const prescription = await db.prescription.update({
      where: { id: prescriptionId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Prescription deleted successfully'
      }
    })
  } catch (error) {
    console.error('Error deleting prescription:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete prescription'
    }, { status: 500 })
  }
}