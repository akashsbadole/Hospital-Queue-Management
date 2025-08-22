"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Smartphone, 
  Send, 
  Bell, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  DollarSign
} from "lucide-react"
import { format } from "date-fns"

interface Notification {
  id: string
  type: 'SMS' | 'WHATSAPP'
  recipient: string
  message: string
  priority: 'normal' | 'urgent' | 'emergency'
  status: 'sent' | 'failed' | 'pending'
  messageId?: string
  cost?: number
  timestamp: string
  template?: string
}

interface NotificationStats {
  totalSent: number
  smsSent: number
  whatsappSent: number
  successRate: number
  averageCost: number
  todaySent: number
  failedToday: number
}

interface MessageTemplate {
  id: string
  name: string
  description: string
  variables: string[]
}

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    type: "SMS" as 'SMS' | 'WHATSAPP',
    recipient: "",
    message: "",
    priority: "normal" as 'normal' | 'urgent' | 'emergency',
    template: ""
  })

  // Template data state
  const [templateData, setTemplateData] = useState({
    patientName: "",
    tokenNumber: "",
    queueType: "",
    estimatedWaitTime: "",
    department: "",
    prescriptionId: "",
    pharmacyLocation: "",
    medicineName: "",
    expiryDate: "",
    daysLeft: ""
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
    fetchTemplates()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "SMS",
          recipient: "+91 98765 43210",
          message: "Dear John Doe, your token 15 for OPD at General Medicine is called. Estimated wait time: 10 minutes. Please proceed to the counter.",
          priority: "normal",
          status: "sent",
          messageId: "sms_123456789",
          cost: 0.05,
          timestamp: "2024-01-15T10:30:00Z",
          template: "QUEUE_NOTIFICATION"
        },
        {
          id: "2",
          type: "WHATSAPP",
          recipient: "+91 98765 43211",
          message: "Dear Jane Smith, your prescription RX001 is ready for collection at Main Pharmacy. Please bring your token number.",
          priority: "normal",
          status: "sent",
          messageId: "wa_123456790",
          cost: 0.15,
          timestamp: "2024-01-15T11:15:00Z",
          template: "PRESCRIPTION_READY"
        },
        {
          id: "3",
          type: "SMS",
          recipient: "+91 98765 43212",
          message: "ALERT: Medicine Paracetamol expires on 2024-02-15 (30 days left). Please take immediate action.",
          priority: "urgent",
          status: "failed",
          cost: 0,
          timestamp: "2024-01-15T09:45:00Z",
          template: "EXPIRY_ALERT"
        }
      ]
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setError('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications?action=stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/notifications?action=templates')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTemplates(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleSendNotification = async () => {
    try {
      const payload: any = {
        type: formData.type,
        recipient: formData.recipient,
        message: formData.message,
        priority: formData.priority
      }

      if (formData.template && formData.template !== "custom") {
        payload.template = formData.template
        payload.templateData = templateData
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      
      if (result.success) {
        setShowSendDialog(false)
        resetForm()
        fetchNotifications()
        fetchStats()
      } else {
        setError(result.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      setError('Network error. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      type: "SMS",
      recipient: "",
      message: "",
      priority: "normal",
      template: ""
    })
    setTemplateData({
      patientName: "",
      tokenNumber: "",
      queueType: "",
      estimatedWaitTime: "",
      department: "",
      prescriptionId: "",
      pharmacyLocation: "",
      medicineName: "",
      expiryDate: "",
      daysLeft: ""
    })
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setSelectedTemplate(templateId)
    setFormData(prev => ({ ...prev, template: templateId }))

    // Generate message based on template
    let message = ""
    switch (templateId) {
      case "QUEUE_NOTIFICATION":
        message = `Dear ${templateData.patientName || "[Patient Name]"}, your token ${templateData.tokenNumber || "[Token Number]"} for ${templateData.queueType || "[Queue Type]"} at ${templateData.department || "[Department]"} is called. Estimated wait time: ${templateData.estimatedWaitTime || "[Wait Time]"} minutes. Please proceed to the counter.`
        break
      case "PRESCRIPTION_READY":
        message = `Dear ${templateData.patientName || "[Patient Name]"}, your prescription ${templateData.prescriptionId || "[Prescription ID]"} is ready for collection at ${templateData.pharmacyLocation || "[Pharmacy Location]"}. Please bring your token number.`
        break
      case "EXPIRY_ALERT":
        message = `ALERT: Medicine ${templateData.medicineName || "[Medicine Name]"} expires on ${templateData.expiryDate || "[Expiry Date]"} (${templateData.daysLeft || "[Days Left]"} days left). Please take immediate action.`
        break
    }
    
    setFormData(prev => ({ ...prev, message }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent": return { variant: "default" as const, icon: CheckCircle, label: "Sent", color: "text-green-600" }
      case "failed": return { variant: "destructive" as const, icon: XCircle, label: "Failed", color: "text-red-600" }
      case "pending": return { variant: "secondary" as const, icon: Clock, label: "Pending", color: "text-yellow-600" }
      default: return { variant: "outline" as const, icon: MessageSquare, label: status, color: "text-gray-600" }
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "SMS": return { variant: "outline" as const, icon: Smartphone, label: "SMS" }
      case "WHATSAPP": return { variant: "outline" as const, icon: MessageSquare, label: "WhatsApp" }
      default: return { variant: "outline" as const, icon: MessageSquare, label: type }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "normal": return { variant: "outline" as const, label: "Normal" }
      case "urgent": return { variant: "secondary" as const, label: "Urgent" }
      case "emergency": return { variant: "destructive" as const, label: "Emergency" }
      default: return { variant: "outline" as const, label: priority }
    }
  }

  const exportNotificationHistory = () => {
    const headers = [
      "Type", "Recipient", "Message", "Priority", "Status", "Cost", "Timestamp"
    ]
    
    const csvContent = [
      headers.join(","),
      ...notifications.map(notif => [
        notif.type,
        notif.recipient,
        `"${notif.message.replace(/"/g, '""')}"`,
        notif.priority,
        notif.status,
        notif.cost || 0,
        notif.timestamp
      ].join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `notification_history_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notification system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Manager</h2>
          <p className="text-gray-600">Send SMS/WhatsApp notifications to patients and staff</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportNotificationHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm()
                setShowSendDialog(true)
              }}>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>
                  Send SMS or WhatsApp notification to patients or staff
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Notification Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'SMS' | 'WHATSAPP' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMS">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-4 w-4" />
                            <span>SMS</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="WHATSAPP">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4" />
                            <span>WhatsApp</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as 'normal' | 'urgent' | 'emergency' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Phone Number *</Label>
                  <Input
                    id="recipient"
                    placeholder="+91 98765 43210"
                    value={formData.recipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Message Template</Label>
                  <Select value={formData.template} onValueChange={(value) => applyTemplate(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Message</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && selectedTemplate !== "custom" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Template Variables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTemplate === "QUEUE_NOTIFICATION" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="patientName">Patient Name</Label>
                              <Input
                                id="patientName"
                                value={templateData.patientName}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, patientName: e.target.value }))}
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tokenNumber">Token Number</Label>
                              <Input
                                id="tokenNumber"
                                value={templateData.tokenNumber}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, tokenNumber: e.target.value }))}
                                placeholder="15"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="queueType">Queue Type</Label>
                              <Input
                                id="queueType"
                                value={templateData.queueType}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, queueType: e.target.value }))}
                                placeholder="OPD"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="estimatedWaitTime">Estimated Wait Time (minutes)</Label>
                              <Input
                                id="estimatedWaitTime"
                                value={templateData.estimatedWaitTime}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, estimatedWaitTime: e.target.value }))}
                                placeholder="10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="department">Department</Label>
                              <Input
                                id="department"
                                value={templateData.department}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, department: e.target.value }))}
                                placeholder="General Medicine"
                              />
                            </div>
                          </>
                        )}
                        {selectedTemplate === "PRESCRIPTION_READY" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="patientName">Patient Name</Label>
                              <Input
                                id="patientName"
                                value={templateData.patientName}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, patientName: e.target.value }))}
                                placeholder="John Doe"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="prescriptionId">Prescription ID</Label>
                              <Input
                                id="prescriptionId"
                                value={templateData.prescriptionId}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, prescriptionId: e.target.value }))}
                                placeholder="RX001"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pharmacyLocation">Pharmacy Location</Label>
                              <Input
                                id="pharmacyLocation"
                                value={templateData.pharmacyLocation}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, pharmacyLocation: e.target.value }))}
                                placeholder="Main Pharmacy"
                              />
                            </div>
                          </>
                        )}
                        {selectedTemplate === "EXPIRY_ALERT" && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="medicineName">Medicine Name</Label>
                              <Input
                                id="medicineName"
                                value={templateData.medicineName}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, medicineName: e.target.value }))}
                                placeholder="Paracetamol"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="expiryDate">Expiry Date</Label>
                              <Input
                                id="expiryDate"
                                value={templateData.expiryDate}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, expiryDate: e.target.value }))}
                                placeholder="2024-02-15"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="daysLeft">Days Left</Label>
                              <Input
                                id="daysLeft"
                                value={templateData.daysLeft}
                                onChange={(e) => setTemplateData(prev => ({ ...prev, daysLeft: e.target.value }))}
                                placeholder="30"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your message here..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendNotification}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent}</div>
              <p className="text-xs text-muted-foreground">Notifications sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <p className="text-xs text-muted-foreground">Delivery success</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.averageCost}</div>
              <p className="text-xs text-muted-foreground">Per notification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySent}</div>
              <p className="text-xs text-muted-foreground">{stats.failedToday} failed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>
            View all sent notifications and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => {
                  const typeBadge = getTypeBadge(notification.type)
                  const statusBadge = getStatusBadge(notification.status)
                  const priorityBadge = getPriorityBadge(notification.priority)
                  const TypeIcon = typeBadge.icon
                  const StatusIcon = statusBadge.icon

                  return (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="h-4 w-4" />
                          <Badge variant={typeBadge.variant}>
                            {typeBadge.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{notification.recipient}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityBadge.variant}>
                          {priorityBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`h-4 w-4 ${statusBadge.color}`} />
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {notification.cost ? `₹${notification.cost}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(notification.timestamp), 'dd MMM yyyy, HH:mm')}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            
            {notifications.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notifications sent yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}