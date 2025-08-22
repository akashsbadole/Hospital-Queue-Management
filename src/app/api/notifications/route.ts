import { NextRequest, NextResponse } from 'next/server'

interface NotificationRequest {
  type: 'SMS' | 'WHATSAPP'
  recipient: string
  message: string
  priority?: 'normal' | 'urgent' | 'emergency'
}

interface NotificationResponse {
  success: boolean
  messageId?: string
  error?: string
  cost?: number
}

// Mock notification service - in production, this would integrate with actual SMS/WhatsApp providers
class NotificationService {
  async sendSMS(recipient: string, message: string, priority: string = 'normal'): Promise<NotificationResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock successful response
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const cost = priority === 'emergency' ? 0.15 : priority === 'urgent' ? 0.10 : 0.05
      
      console.log(`SMS sent to ${recipient}: ${message}`)
      
      return {
        success: true,
        messageId,
        cost
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: 'Failed to send SMS'
      }
    }
  }

  async sendWhatsApp(recipient: string, message: string, priority: string = 'normal'): Promise<NotificationResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful response
      const messageId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const cost = priority === 'emergency' ? 0.25 : priority === 'urgent' ? 0.20 : 0.15
      
      console.log(`WhatsApp message sent to ${recipient}: ${message}`)
      
      return {
        success: true,
        messageId,
        cost
      }
    } catch (error) {
      console.error('WhatsApp sending failed:', error)
      return {
        success: false,
        error: 'Failed to send WhatsApp message'
      }
    }
  }

  formatQueueMessage(patientName: string, tokenNumber: number, queueType: string, estimatedWaitTime: number, department: string): string {
    return `Dear ${patientName}, your token ${tokenNumber} for ${queueType} at ${department} is called. Estimated wait time: ${estimatedWaitTime} minutes. Please proceed to the counter.`
  }

  formatPrescriptionReadyMessage(patientName: string, prescriptionId: string, pharmacyLocation: string): string {
    return `Dear ${patientName}, your prescription ${prescriptionId} is ready for collection at ${pharmacyLocation}. Please bring your token number.`
  }

  formatExpiryAlertMessage(medicineName: string, expiryDate: string, daysLeft: number): string {
    return `ALERT: Medicine ${medicineName} expires on ${expiryDate} (${daysLeft} days left). Please take immediate action.`
  }
}

const notificationService = new NotificationService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, recipient, message, priority = 'normal', template, templateData } = body

    // Validate required fields
    if (!type || !recipient || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, recipient, message' },
        { status: 400 }
      )
    }

    // Validate notification type
    if (!['SMS', 'WHATSAPP'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification type. Must be SMS or WHATSAPP' },
        { status: 400 }
      )
    }

    // Validate recipient format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/
    if (!phoneRegex.test(recipient)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    let finalMessage = message

    // Apply template if provided
    if (template && templateData) {
      switch (template) {
        case 'QUEUE_NOTIFICATION':
          finalMessage = notificationService.formatQueueMessage(
            templateData.patientName,
            templateData.tokenNumber,
            templateData.queueType,
            templateData.estimatedWaitTime,
            templateData.department
          )
          break
        case 'PRESCRIPTION_READY':
          finalMessage = notificationService.formatPrescriptionReadyMessage(
            templateData.patientName,
            templateData.prescriptionId,
            templateData.pharmacyLocation
          )
          break
        case 'EXPIRY_ALERT':
          finalMessage = notificationService.formatExpiryAlertMessage(
            templateData.medicineName,
            templateData.expiryDate,
            templateData.daysLeft
          )
          break
      }
    }

    // Send notification based on type
    let result: NotificationResponse
    if (type === 'SMS') {
      result = await notificationService.sendSMS(recipient, finalMessage, priority)
    } else {
      result = await notificationService.sendWhatsApp(recipient, finalMessage, priority)
    }

    // Log notification attempt
    console.log('Notification attempt:', {
      type,
      recipient,
      message: finalMessage,
      priority,
      success: result.success,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: result.success,
      data: {
        messageId: result.messageId,
        cost: result.cost,
        recipient,
        type,
        message: finalMessage,
        timestamp: new Date().toISOString()
      },
      error: result.error
    })

  } catch (error) {
    console.error('Notification sending failed:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Return mock notification statistics
      const stats = {
        totalSent: 1250,
        smsSent: 890,
        whatsappSent: 360,
        successRate: 94.5,
        averageCost: 0.12,
        todaySent: 45,
        failedToday: 3
      }

      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    if (action === 'templates') {
      // Return available message templates
      const templates = [
        {
          id: 'QUEUE_NOTIFICATION',
          name: 'Queue Notification',
          description: 'Notify patients when their token is called',
          variables: ['patientName', 'tokenNumber', 'queueType', 'estimatedWaitTime', 'department']
        },
        {
          id: 'PRESCRIPTION_READY',
          name: 'Prescription Ready',
          description: 'Notify patients when prescription is ready for collection',
          variables: ['patientName', 'prescriptionId', 'pharmacyLocation']
        },
        {
          id: 'EXPIRY_ALERT',
          name: 'Expiry Alert',
          description: 'Alert staff about medicine expiry',
          variables: ['medicineName', 'expiryDate', 'daysLeft']
        }
      ]

      return NextResponse.json({
        success: true,
        data: templates
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Failed to process notification request:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}