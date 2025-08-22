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
import { AlertCircle, Users, UserPlus, QrCode, Barcode, Clock, CheckCircle, XCircle, Search, Filter, Download, Phone, Mail, MapPin, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Visitor {
  id: string
  visitorNumber: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  purpose: string
  patientId?: string
  department?: string
  hostUserId?: string
  idProof?: string
  idProofNumber?: string
  qrCode?: string
  barcode?: string
  entryTime: string
  exitTime?: string
  status: string
  notes?: string
  createdAt: string
  patient?: {
    id: string
    firstName: string
    lastName: string
    age: number
    gender: string
  }
  host?: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  age: number
  gender: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  role: string
  department?: string
}

export default function VisitorManagementSystem() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPurpose, setSelectedPurpose] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    purpose: "VISIT_PATIENT",
    patientId: "",
    department: "",
    hostUserId: "",
    idProof: "",
    idProofNumber: "",
    notes: ""
  })

  const purposes = [
    { value: "VISIT_PATIENT", label: "Visit Patient" },
    { value: "DELIVERY", label: "Delivery" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "BUSINESS", label: "Business" },
    { value: "OTHER", label: "Other" }
  ]

  const idProofs = [
    "Aadhaar Card",
    "Driving License",
    "Passport",
    "Voter ID",
    "PAN Card",
    "Other"
  ]

  useEffect(() => {
    fetchVisitors()
    fetchPatients()
    fetchStaff()
  }, [])

  const fetchVisitors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/visitors')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVisitors(data.data.visitors || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error)
      setError('Failed to fetch visitors')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPatients(data.data.patients || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/users?role=STAFF,NURSE,DOCTOR,ADMIN')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStaff(data.data.users || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setIsAddDialogOpen(false)
        resetForm()
        fetchVisitors()
      } else {
        setError(data.error || 'Failed to register visitor')
      }
    } catch (error) {
      console.error('Failed to register visitor:', error)
      setError('Network error. Please try again.')
    }
  }

  const handleExit = async () => {
    if (!selectedVisitor) return

    try {
      const response = await fetch(`/api/visitors/${selectedVisitor.id}/exit`, {
        method: 'POST',
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setIsExitDialogOpen(false)
        setSelectedVisitor(null)
        fetchVisitors()
      } else {
        setError(data.error || 'Failed to record exit')
      }
    } catch (error) {
      console.error('Failed to record exit:', error)
      setError('Network error. Please try again.')
    }
  }

  const generateQRCode = async (visitorId: string) => {
    try {
      const response = await fetch(`/api/visitors/${visitorId}/qrcode`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Open QR code in new window or download
          const qrWindow = window.open('', '_blank')
          if (qrWindow) {
            qrWindow.document.write(`
              <html>
                <head><title>Visitor Pass - ${data.data.visitorNumber}</title></head>
                <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="text-align: center; max-width: 400px; margin: 0 auto;">
                    <h2>Visitor Pass</h2>
                    <p><strong>${data.data.firstName} ${data.data.lastName}</strong></p>
                    <p>Visitor Number: ${data.data.visitorNumber}</p>
                    <p>Purpose: ${data.data.purpose}</p>
                    <p>Entry: ${format(new Date(data.data.entryTime), 'dd MMM yyyy, HH:mm')}</p>
                    <img src="${data.data.qrCode}" alt="QR Code" style="margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #666;">Scan this QR code for verification</p>
                  </div>
                </body>
              </html>
            `)
            qrWindow.document.close()
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      purpose: "VISIT_PATIENT",
      patientId: "",
      department: "",
      hostUserId: "",
      idProof: "",
      idProofNumber: "",
      notes: ""
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return { variant: "default" as const, icon: Users, label: "Active" }
      case "EXITED": return { variant: "secondary" as const, icon: CheckCircle, label: "Exited" }
      case "BLACKLISTED": return { variant: "destructive" as const, icon: XCircle, label: "Blacklisted" }
      default: return { variant: "outline" as const, icon: Users, label: status }
    }
  }

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.visitorNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (visitor.phone && visitor.phone.includes(searchTerm))
    
    const matchesStatus = selectedStatus === "all" || visitor.status === selectedStatus
    const matchesPurpose = selectedPurpose === "all" || visitor.purpose === selectedPurpose

    return matchesSearch && matchesStatus && matchesPurpose
  })

  const activeVisitors = filteredVisitors.filter(v => v.status === "ACTIVE")
  const exitedVisitors = filteredVisitors.filter(v => v.status === "EXITED")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visitor management system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visitor Management System</h2>
          <p className="text-gray-600">Track and manage hospital visitors with QR/barcode passes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Register Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Visitor</DialogTitle>
              <DialogDescription>
                Register a new visitor and generate QR/barcode pass
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit *</Label>
                <Select value={formData.purpose} onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map((purpose) => (
                      <SelectItem key={purpose.value} value={purpose.value}>
                        {purpose.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.purpose === "VISIT_PATIENT" && (
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient to Visit</Label>
                  <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} ({patient.age}y, {patient.gender})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(formData.purpose === "MAINTENANCE" || formData.purpose === "BUSINESS") && (
                <div className="space-y-2">
                  <Label htmlFor="hostUserId">Host Staff Member</Label>
                  <Select value={formData.hostUserId} onValueChange={(value) => setFormData(prev => ({ ...prev, hostUserId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idProof">ID Proof Type</Label>
                  <Select value={formData.idProof} onValueChange={(value) => setFormData(prev => ({ ...prev, idProof: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID proof" />
                    </SelectTrigger>
                    <SelectContent>
                      {idProofs.map((proof) => (
                        <SelectItem key={proof} value={proof}>
                          {proof}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idProofNumber">ID Proof Number</Label>
                  <Input
                    id="idProofNumber"
                    value={formData.idProofNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, idProofNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Register Visitor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVisitors.length}</div>
            <p className="text-xs text-muted-foreground">Currently in hospital</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exited Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exitedVisitors.length}</div>
            <p className="text-xs text-muted-foreground">Visitors exited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitors.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, visitor number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXITED">Exited</SelectItem>
              <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              {purposes.map((purpose) => (
                <SelectItem key={purpose.value} value={purpose.value}>
                  {purpose.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visitor Management */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Visitors ({activeVisitors.length})</TabsTrigger>
          <TabsTrigger value="exited">Exited Visitors ({exitedVisitors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Visitors</CardTitle>
              <CardDescription>Visitors currently in the hospital premises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Entry Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeVisitors.map((visitor) => {
                      const statusBadge = getStatusBadge(visitor.status)
                      const StatusIcon = statusBadge.icon

                      return (
                        <TableRow key={visitor.id}>
                          <TableCell className="font-medium">{visitor.visitorNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{visitor.firstName} {visitor.lastName}</div>
                              {visitor.patient && (
                                <div className="text-sm text-gray-500">
                                  Visiting: {visitor.patient.firstName} {visitor.patient.lastName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {visitor.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {visitor.phone}
                                </div>
                              )}
                              {visitor.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {visitor.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {purposes.find(p => p.value === visitor.purpose)?.label || visitor.purpose}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(visitor.entryTime), 'dd MMM yyyy')}
                              <div className="text-gray-500">
                                {format(new Date(visitor.entryTime), 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant} className="flex items-center space-x-1">
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusBadge.label}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateQRCode(visitor.id)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVisitor(visitor)
                                  setIsExitDialogOpen(true)
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Exit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exited">
          <Card>
            <CardHeader>
              <CardTitle>Exited Visitors</CardTitle>
              <CardDescription>Visitors who have left the hospital premises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Visitor #</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Entry Time</TableHead>
                      <TableHead>Exit Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exitedVisitors.map((visitor) => {
                      const entryTime = new Date(visitor.entryTime)
                      const exitTime = visitor.exitTime ? new Date(visitor.exitTime) : null
                      const duration = exitTime ? Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60)) : 0

                      return (
                        <TableRow key={visitor.id}>
                          <TableCell className="font-medium">{visitor.visitorNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{visitor.firstName} {visitor.lastName}</div>
                              {visitor.patient && (
                                <div className="text-sm text-gray-500">
                                  Visited: {visitor.patient.firstName} {visitor.patient.lastName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {visitor.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {visitor.phone}
                                </div>
                              )}
                              {visitor.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {visitor.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {purposes.find(p => p.value === visitor.purpose)?.label || visitor.purpose}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(entryTime, 'dd MMM yyyy')}
                              <div className="text-gray-500">
                                {format(entryTime, 'HH:mm')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {exitTime ? (
                              <div className="text-sm">
                                {format(exitTime, 'dd MMM yyyy')}
                                <div className="text-gray-500">
                                  {format(exitTime, 'HH:mm')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exit Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Visitor Exit</DialogTitle>
            <DialogDescription>
              Record the exit time for {selectedVisitor?.firstName} {selectedVisitor?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Visitor:</strong> {selectedVisitor?.firstName} {selectedVisitor?.lastName}</p>
              <p><strong>Visitor Number:</strong> {selectedVisitor?.visitorNumber}</p>
              <p><strong>Entry Time:</strong> {selectedVisitor?.entryTime ? format(new Date(selectedVisitor.entryTime), 'dd MMM yyyy, HH:mm') : '-'}</p>
              <p><strong>Purpose:</strong> {purposes.find(p => p.value === selectedVisitor?.purpose)?.label || selectedVisitor?.purpose}</p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsExitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExit}>
                Record Exit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}