import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entryId, prescriptionId, medicinesDispensed, paymentMethod, totalAmount } = body

    // Validate required fields
    if (!entryId || !prescriptionId || !medicinesDispensed) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: entryId, prescriptionId, medicinesDispensed'
      }, { status: 400 })
    }

    // Get pharmacy queue entry
    const queueEntry = await db.pharmacyQueue.findUnique({
      where: { id: entryId },
      include: {
        patient: true,
        department: true
      }
    })

    if (!queueEntry) {
      return NextResponse.json({
        success: false,
        error: 'Pharmacy queue entry not found'
      }, { status: 404 })
    }

    // Get prescription details
    const prescription = await db.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: true,
        doctor: true
      }
    })

    if (!prescription) {
      return NextResponse.json({
        success: false,
        error: 'Prescription not found'
      }, { status: 404 })
    }

    // Update medicine inventory
    for (const medicine of medicinesDispensed) {
      if (medicine.medicineId && medicine.quantity) {
        await db.medicine.update({
          where: { id: medicine.medicineId },
          data: {
            quantity: {
              decrement: parseInt(medicine.quantity)
            }
          }
        })
      }
    }

    // Generate receipt number
    const receiptNumber = `PHARM-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create pharmacy receipt
    const receipt = await db.receipt.create({
      data: {
        patientId: queueEntry.patientId,
        userId: 'PHARMACIST', // This should come from authenticated user
        receiptNumber,
        type: 'MEDICINE',
        amount: totalAmount || 0,
        description: `Pharmacy dispensing for prescription ${prescriptionId}`,
        items: JSON.stringify({
          prescriptionId,
          medicines: medicinesDispensed,
          diagnosis: prescription.diagnosis
        }),
        paymentMethod: paymentMethod || 'CASH',
        status: 'PAID'
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

    // Update pharmacy queue entry to completed
    await db.pharmacyQueue.update({
      where: { id: entryId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Update prescription status if needed
    await db.prescription.update({
      where: { id: prescriptionId },
      data: {
        notes: `Medicines dispensed on ${new Date().toISOString()}. Receipt: ${receiptNumber}`
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        receipt,
        message: 'Medicines dispensed successfully',
        receiptNumber: receipt.receiptNumber
      }
    })
  } catch (error) {
    console.error('Error dispensing medicines:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to dispense medicines'
    }, { status: 500 })
  }
}