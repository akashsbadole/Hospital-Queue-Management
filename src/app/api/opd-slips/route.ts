import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface OPDSlipRequest {
  patientId: string
  queueEntryId: string
  includeQR: boolean
  includeBarcode: boolean
}

interface OPDSlipData {
  patient: {
    id: string
    firstName: string
    lastName: string
    age: number
    gender: string
    phone?: string
  }
  queueEntry: {
    id: string
    tokenNumber: number
    queue: {
      name: string
      department: string
    }
    priority: string
    estimatedWaitTime?: number
    createdAt: string
  }
  hospital: {
    name: string
    address?: string
    phone?: string
  }
  qrCode?: string
  barcode?: string
  generatedAt: string
}

// Mock QR code generation - in production, use a proper QR code library
function generateQRCode(data: any): string {
  // This would generate an actual QR code image
  // For now, return a placeholder data URL
  const qrData = JSON.stringify(data)
  return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMwMDAiPlFSIENvZGU8L3RleHQ+PC9zdmc+`
}

// Mock barcode generation - in production, use a proper barcode library
function generateBarcode(data: string): string {
  // This would generate an actual barcode image
  // For now, return a placeholder data URL
  return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjE1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzAwMCI+QmFyY29kZTwvdGV4dD48L3N2Zz4=`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, queueEntryId, includeQR = true, includeBarcode = true } = body

    // Validate required fields
    if (!patientId || !queueEntryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: patientId, queueEntryId' },
        { status: 400 }
      )
    }

    // Fetch patient data
    const patient = await db.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Fetch queue entry data
    const queueEntry = await db.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: {
        queue: true
      }
    })

    if (!queueEntry) {
      return NextResponse.json(
        { success: false, error: 'Queue entry not found' },
        { status: 404 }
      )
    }

    // Fetch hospital settings
    const hospitalSettings = await db.hospitalSettings.findFirst()
    
    // Calculate estimated wait time (mock calculation)
    const waitingEntries = await db.queueEntry.count({
      where: {
        queueId: queueEntry.queueId,
        status: 'WAITING',
        createdAt: {
          lt: queueEntry.createdAt
        }
      }
    })
    
    const estimatedWaitTime = waitingEntries * 5 // 5 minutes per patient

    // Generate slip data
    const slipData: OPDSlipData = {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone || undefined
      },
      queueEntry: {
        id: queueEntry.id,
        tokenNumber: queueEntry.tokenNumber,
        queue: {
          name: queueEntry.queue.name,
          department: queueEntry.queue.department
        },
        priority: queueEntry.priority,
        estimatedWaitTime,
        createdAt: queueEntry.createdAt
      },
      hospital: {
        name: hospitalSettings?.hospitalName || "Hospital",
        address: hospitalSettings?.address,
        phone: hospitalSettings?.phone
      },
      generatedAt: new Date().toISOString()
    }

    // Generate QR code if requested
    if (includeQR) {
      const qrData = {
        patientId: patient.id,
        tokenNumber: queueEntry.tokenNumber,
        queueId: queueEntry.queueId,
        department: queueEntry.queue.department,
        generatedAt: slipData.generatedAt
      }
      slipData.qrCode = generateQRCode(qrData)
    }

    // Generate barcode if requested
    if (includeBarcode) {
      const barcodeData = `${queueEntry.tokenNumber}-${patient.id}-${queueEntry.queueId}`
      slipData.barcode = generateBarcode(barcodeData)
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'OPD_SLIP',
        entityId: queueEntryId,
        changes: JSON.stringify({
          patientId,
          tokenNumber: queueEntry.tokenNumber,
          generatedAt: slipData.generatedAt
        }),
        userId: 'system', // Should be replaced with actual user ID
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: slipData
    })

  } catch (error) {
    console.error('Failed to generate OPD slip:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate OPD slip' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queueEntryId = searchParams.get('queueEntryId')
    const format = searchParams.get('format') || 'json'

    if (!queueEntryId) {
      return NextResponse.json(
        { success: false, error: 'Missing queueEntryId parameter' },
        { status: 400 }
      )
    }

    // Fetch the slip data (this would normally be stored or regenerated)
    // For now, we'll regenerate it
    
    // Fetch queue entry with patient and queue data
    const queueEntry = await db.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: {
        patient: true,
        queue: true
      }
    })

    if (!queueEntry) {
      return NextResponse.json(
        { success: false, error: 'Queue entry not found' },
        { status: 404 }
      )
    }

    // Fetch hospital settings
    const hospitalSettings = await db.hospitalSettings.findFirst()

    // Generate slip data
    const slipData: OPDSlipData = {
      patient: {
        id: queueEntry.patient.id,
        firstName: queueEntry.patient.firstName,
        lastName: queueEntry.patient.lastName,
        age: queueEntry.patient.age,
        gender: queueEntry.patient.gender,
        phone: queueEntry.patient.phone || undefined
      },
      queueEntry: {
        id: queueEntry.id,
        tokenNumber: queueEntry.tokenNumber,
        queue: {
          name: queueEntry.queue.name,
          department: queueEntry.queue.department
        },
        priority: queueEntry.priority,
        createdAt: queueEntry.createdAt
      },
      hospital: {
        name: hospitalSettings?.hospitalName || "Hospital",
        address: hospitalSettings?.address,
        phone: hospitalSettings?.phone
      },
      generatedAt: new Date().toISOString()
    }

    // Generate QR code and barcode
    const qrData = {
      patientId: queueEntry.patient.id,
      tokenNumber: queueEntry.tokenNumber,
      queueId: queueEntry.queueId,
      department: queueEntry.queue.department,
      generatedAt: slipData.generatedAt
    }
    slipData.qrCode = generateQRCode(qrData)

    const barcodeData = `${queueEntry.tokenNumber}-${queueEntry.patient.id}-${queueEntry.queueId}`
    slipData.barcode = generateBarcode(barcodeData)

    if (format === 'html') {
      // Return HTML format for printing
      const html = generateOPDSlipHTML(slipData)
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: slipData
    })

  } catch (error) {
    console.error('Failed to fetch OPD slip:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch OPD slip' },
      { status: 500 }
    )
  }
}

function generateOPDSlipHTML(data: OPDSlipData): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OPD Slip - ${data.queueEntry.tokenNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .slip-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .hospital-name {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        .hospital-info {
            font-size: 12px;
            color: #666;
            margin: 5px 0 0 0;
        }
        .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin: 0 0 20px 0;
            text-transform: uppercase;
        }
        .token {
            text-align: center;
            font-size: 36px;
            font-weight: bold;
            color: #007bff;
            margin: 0 0 10px 0;
            border: 3px solid #007bff;
            border-radius: 10px;
            padding: 10px;
            background: #f8f9fa;
        }
        .patient-info {
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
        }
        .info-label {
            font-weight: bold;
            color: #333;
        }
        .info-value {
            color: #666;
        }
        .queue-info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 10px;
            margin: 20px 0;
        }
        .queue-title {
            font-weight: bold;
            color: #333;
            margin: 0 0 10px 0;
            text-align: center;
        }
        .codes {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
        }
        .code-section {
            text-align: center;
            flex: 1;
        }
        .code-label {
            font-size: 12px;
            color: #666;
            margin: 0 0 5px 0;
        }
        .code-image {
            max-width: 120px;
            max-height: 120px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .priority {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .priority-normal {
            background: #28a745;
            color: white;
        }
        .priority-urgent {
            background: #ffc107;
            color: #333;
        }
        .priority-emergency {
            background: #dc3545;
            color: white;
        }
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .slip-container {
                box-shadow: none;
                border: 1px solid #333;
            }
        }
    </style>
</head>
<body>
    <div class="slip-container">
        <div class="header">
            <h1 class="hospital-name">${data.hospital.name}</h1>
            ${data.hospital.address ? `<p class="hospital-info">${data.hospital.address}</p>` : ''}
            ${data.hospital.phone ? `<p class="hospital-info">Phone: ${data.hospital.phone}</p>` : ''}
        </div>
        
        <div class="title">OPD Registration Slip</div>
        
        <div class="token">
            ${data.queueEntry.tokenNumber}
        </div>
        
        <div class="patient-info">
            <div class="info-row">
                <span class="info-label">Patient Name:</span>
                <span class="info-value">${data.patient.firstName} ${data.patient.lastName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Age/Gender:</span>
                <span class="info-value">${data.patient.age} / ${data.patient.gender}</span>
            </div>
            ${data.patient.phone ? `
            <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${data.patient.phone}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="queue-info">
            <div class="queue-title">Queue Information</div>
            <div class="info-row">
                <span class="info-label">Department:</span>
                <span class="info-value">${data.queueEntry.queue.department}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Queue:</span>
                <span class="info-value">${data.queueEntry.queue.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Priority:</span>
                <span class="info-value">
                    <span class="priority priority-${data.queueEntry.priority.toLowerCase()}">
                        ${data.queueEntry.priority}
                    </span>
                </span>
            </div>
            ${data.queueEntry.estimatedWaitTime ? `
            <div class="info-row">
                <span class="info-label">Est. Wait Time:</span>
                <span class="info-value">${data.queueEntry.estimatedWaitTime} minutes</span>
            </div>
            ` : ''}
        </div>
        
        ${data.qrCode || data.barcode ? `
        <div class="codes">
            ${data.qrCode ? `
            <div class="code-section">
                <div class="code-label">QR Code</div>
                <img src="${data.qrCode}" alt="QR Code" class="code-image">
            </div>
            ` : ''}
            ${data.barcode ? `
            <div class="code-section">
                <div class="code-label">Barcode</div>
                <img src="${data.barcode}" alt="Barcode" class="code-image">
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="footer">
            Generated on ${new Date(data.generatedAt).toLocaleString()}<br>
            Please present this slip at the counter
        </div>
    </div>
</body>
</html>
  `
}