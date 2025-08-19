import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock pharmacy queues
    const queues = [
      {
        id: "1",
        name: "Main Pharmacy",
        departmentId: "3",
        type: "PHARMACY",
        isActive: true,
        currentToken: 3
      },
      {
        id: "2", 
        name: "Emergency Pharmacy",
        departmentId: "3",
        type: "PHARMACY",
        isActive: true,
        currentToken: 1
      }
    ]

    // Mock pharmacy queue entries
    const entries = [
      {
        id: "1",
        queueId: "1",
        patientId: "1",
        patient: {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          age: 35,
          gender: "M",
          phone: "+1234567890"
        },
        tokenNumber: "P001",
        status: "WAITING",
        priority: "NORMAL",
        notes: "Prescription fulfillment",
        createdAt: "2024-08-18T11:00:00Z"
      },
      {
        id: "2",
        queueId: "1",
        patientId: "2",
        patient: {
          id: "2",
          firstName: "Jane",
          lastName: "Smith",
          age: 28,
          gender: "F",
          phone: "+1234567891"
        },
        tokenNumber: "P002",
        status: "SERVING",
        priority: "NORMAL",
        notes: "Medication dispensing",
        calledAt: "2024-08-18T11:15:00Z",
        servingAt: "2024-08-18T11:20:00Z",
        createdAt: "2024-08-18T10:45:00Z"
      },
      {
        id: "3",
        queueId: "1",
        patientId: "3",
        patient: {
          id: "3",
          firstName: "Bob",
          lastName: "Johnson",
          age: 45,
          gender: "M",
          phone: "+1234567892"
        },
        tokenNumber: "P003",
        status: "WAITING",
        priority: "URGENT",
        notes: "Emergency medication",
        createdAt: "2024-08-18T11:30:00Z"
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        queues,
        entries
      }
    })
  } catch (error) {
    console.error('Error fetching pharmacy queue status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pharmacy queue status'
    }, { status: 500 })
  }
}