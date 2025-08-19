"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Package, Clock, CheckCircle, XCircle, Plus, Phone, End, Eye, Pill } from "lucide-react"
import { format } from "date-fns"

interface Patient {
  id: string
  firstName: string
  lastName: string
  age: number
  gender: string
  phone?: string
}

interface QueueEntry {
  id: string
  queueId: string
  patientId: string
  patient: Patient
  tokenNumber: number
  status: string
  priority: string
  notes?: string
  calledAt?: string
  servingAt?: string
  completedAt?: string
  createdAt: string
  prescription?: {
    id: string
    diagnosis: string
    medications: any[]
    doctor?: {
      firstName: string
      lastName: string
    }
  }
}

interface Queue {
  id: string
  name: string
  departmentId: string
  type: string
  isActive: boolean
  currentToken: number
}

export default function PharmacyQueueManagement() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedQueue, setSelectedQueue] = useState("")
  const [showCallNext, setShowCallNext] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [showDispense, setShowDispense] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [medicines, setMedicines] = useState<any[]>([])
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [dispenseForm, setDispenseForm] = useState({
    paymentMethod: "CASH",
    medicinesDispensed: [] as any[]
  })

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchQueues(),
          fetchQueueEntries()
        ])
      } catch (error) {
        console.error("Failed to initialize data:", error)
        setError("Failed to load pharmacy queue data")
      } finally {
        setLoading(false)
      }
    }
    
    initializeData()
  }, [])

  const fetchQueues = async () => {
    try {
      const response = await fetch("/api/queue/pharmacy/status")
      if (!response.ok) throw new Error("Failed to fetch queues")

      const data = await response.json()
      if (data.success && data.data && data.data.queues) {
        setQueues(data.data.queues)
        if (data.data.queues.length > 0) {
          setSelectedQueue(data.data.queues[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch queues:", error)
      setError("Failed to fetch queues")
    }
  }

  const fetchQueueEntries = async () => {
    try {
      const response = await fetch("/api/queue/pharmacy/status")
      if (!response.ok) throw new Error("Failed to fetch queue entries")

      const data = await response.json()
      if (data.success && data.data && data.data.entries) {
        setQueueEntries(data.data.entries)
      }
    } catch (error) {
      console.error("Failed to fetch queue entries:", error)
    }
  }

  const handleCallNext = async () => {
    if (!selectedQueue) return

    try {
      const response = await fetch("/api/queue/pharmacy/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CALL_NEXT",
          queueId: selectedQueue
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowCallNext(false)
        fetchQueueEntries()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to call next patient")
    }
  }

  const handleStartServing = async (entryId: string) => {
    try {
      const response = await fetch("/api/queue/pharmacy/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "START_SERVING",
          entryId: entryId
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchQueueEntries()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to start serving")
    }
  }

  const handleCompleteServing = async (entryId: string) => {
    try {
      const response = await fetch("/api/queue/pharmacy/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_SERVING",
          entryId: entryId
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowComplete(false)
        setSelectedEntry(null)
        fetchQueueEntries()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to complete serving")
    }
  }

  const handleDispenseMedicine = async (entryId: string) => {
    try {
      // Fetch prescriptions for this patient
      const prescriptionsResponse = await fetch(`/api/prescriptions?patientId=${selectedEntry?.patientId}`)
      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json()
        setPrescriptions(prescriptionsData.data?.prescriptions || [])
      }

      // Fetch medicines inventory
      const medicinesResponse = await fetch('/api/pharmacy/inventory/medicines')
      if (medicinesResponse.ok) {
        const medicinesData = await medicinesResponse.json()
        setMedicines(medicinesData.data?.medicines || [])
      }

      setShowDispense(true)
    } catch (error) {
      setError("Failed to load dispensing data")
    }
  }

  const handleDispenseSubmit = async () => {
    if (!selectedEntry || !selectedPrescription) return

    try {
      const totalAmount = dispenseForm.medicinesDispensed.reduce((sum, item) => {
        const medicine = medicines.find(m => m.id === item.medicineId)
        return sum + (medicine ? medicine.sellingPrice * item.quantity : 0)
      }, 0)

      const response = await fetch("/api/pharmacy/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: selectedEntry.id,
          prescriptionId: selectedPrescription.id,
          medicinesDispensed: dispenseForm.medicinesDispensed,
          paymentMethod: dispenseForm.paymentMethod,
          totalAmount
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowDispense(false)
        setSelectedEntry(null)
        setSelectedPrescription(null)
        setDispenseForm({
          paymentMethod: "CASH",
          medicinesDispensed: []
        })
        fetchQueueEntries()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to dispense medicine")
    }
  }

  const addMedicineToDispense = (medicineId: string, quantity: number) => {
    const existing = dispenseForm.medicinesDispensed.find(item => item.medicineId === medicineId)
    if (existing) {
      setDispenseForm(prev => ({
        ...prev,
        medicinesDispensed: prev.medicinesDispensed.map(item =>
          item.medicineId === medicineId ? { ...item, quantity } : item
        )
      }))
    } else {
      setDispenseForm(prev => ({
        ...prev,
        medicinesDispensed: [...prev.medicinesDispensed, { medicineId, quantity }]
      }))
    }
  }

  const removeMedicineFromDispense = (medicineId: string) => {
    setDispenseForm(prev => ({
      ...prev,
      medicinesDispensed: prev.medicinesDispensed.filter(item => item.medicineId !== medicineId)
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING": return { variant: "secondary" as const, icon: Clock, label: "Waiting" }
      case "CALLED": return { variant: "default" as const, icon: Eye, label: "Called" }
      case "SERVING": return { variant: "default" as const, icon: Package, label: "Serving" }
      case "COMPLETED": return { variant: "default" as const, icon: CheckCircle, label: "Completed" }
      case "CANCELLED": return { variant: "destructive" as const, icon: XCircle, label: "Cancelled" }
      default: return { variant: "outline" as const, icon: Clock, label: status }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "NORMAL": return { variant: "outline" as const, label: "Normal" }
      case "URGENT": return { variant: "secondary" as const, label: "Urgent" }
      case "EMERGENCY": return { variant: "destructive" as const, label: "Emergency" }
      default: return { variant: "outline" as const, label: priority }
    }
  }

  const waitingEntries = queueEntries.filter(entry => entry.status === "WAITING")
  const servingEntries = queueEntries.filter(entry => entry.status === "SERVING")
  const completedEntries = queueEntries.filter(entry => entry.status === "COMPLETED")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pharmacy queue data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pharmacy Queue Management</h2>
          <p className="text-gray-600">Manage pharmacy queues and medicine dispensing</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showCallNext} onOpenChange={setShowCallNext}>
            <DialogTrigger asChild>
              <Button>
                <Phone className="w-4 h-4 mr-2" />
                Call Next
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Call Next Patient</DialogTitle>
                <DialogDescription>
                  Select a queue to call the next patient
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="queue">Select Queue</Label>
                  <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select queue" />
                    </SelectTrigger>
                    <SelectContent>
                      {queues.map((queue) => (
                        <SelectItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCallNext(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCallNext} disabled={!selectedQueue}>
                  Call Next Patient
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingEntries.length}</div>
            <p className="text-xs text-muted-foreground">Patients waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serving</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servingEntries.length}</div>
            <p className="text-xs text-muted-foreground">Currently serving</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEntries.length}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Management */}
      <Tabs defaultValue="waiting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waiting">Waiting ({waitingEntries.length})</TabsTrigger>
          <TabsTrigger value="serving">Serving ({servingEntries.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="waiting">
          <Card>
            <CardHeader>
              <CardTitle>Waiting Patients</CardTitle>
              <CardDescription>Patients waiting for pharmacy services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Wait Time</TableHead>
                      <TableHead>Prescription</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitingEntries.map((entry) => {
                      const waitTime = Math.floor((new Date().getTime() - new Date(entry.createdAt).getTime()) / (1000 * 60))
                      const statusBadge = getStatusBadge(entry.status)
                      const priorityBadge = getPriorityBadge(entry.priority)
                      const StatusIcon = statusBadge.icon

                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.tokenNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{entry.patient.firstName} {entry.patient.lastName}</div>
                              {entry.patient.phone && (
                                <div className="text-sm text-gray-500">{entry.patient.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{entry.patient.age} / {entry.patient.gender}</TableCell>
                          <TableCell>
                            <Badge variant={priorityBadge.variant}>
                              {priorityBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{waitTime} min</TableCell>
                          <TableCell>
                            {entry.prescription ? (
                              <div className="text-sm">
                                <div className="font-medium">{entry.prescription.diagnosis}</div>
                                {entry.prescription.doctor && (
                                  <div className="text-gray-500">
                                    Dr. {entry.prescription.doctor.firstName} {entry.prescription.doctor.lastName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">No prescription</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartServing(entry.id)}
                              >
                                <Package className="w-4 h-4" />
                                Start
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

        <TabsContent value="serving">
          <Card>
            <CardHeader>
              <CardTitle>Currently Serving</CardTitle>
              <CardDescription>Patients currently being served at pharmacy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Called At</TableHead>
                      <TableHead>Serving Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servingEntries.map((entry) => {
                      const servingTime = entry.servingAt ? Math.floor((new Date().getTime() - new Date(entry.servingAt).getTime()) / (1000 * 60)) : 0
                      const statusBadge = getStatusBadge(entry.status)
                      const StatusIcon = statusBadge.icon

                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.tokenNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{entry.patient.firstName} {entry.patient.lastName}</div>
                              {entry.patient.phone && (
                                <div className="text-sm text-gray-500">{entry.patient.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{entry.patient.age} / {entry.patient.gender}</TableCell>
                          <TableCell>
                            {entry.calledAt ? format(new Date(entry.calledAt), "HH:mm") : "-"}
                          </TableCell>
                          <TableCell>{servingTime} min</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEntry(entry)
                                  setShowDispense(true)
                                }}
                              >
                                <Pill className="w-4 h-4" />
                                Dispense
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEntry(entry)
                                  setShowComplete(true)
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                                Complete
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

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Today</CardTitle>
              <CardDescription>Patients who have completed pharmacy services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Total Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedEntries.map((entry) => {
                      const totalTime = entry.completedAt && entry.createdAt 
                        ? Math.floor((new Date(entry.completedAt).getTime() - new Date(entry.createdAt).getTime()) / (1000 * 60))
                        : 0

                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.tokenNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{entry.patient.firstName} {entry.patient.lastName}</div>
                              {entry.patient.phone && (
                                <div className="text-sm text-gray-500">{entry.patient.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{entry.patient.age} / {entry.patient.gender}</TableCell>
                          <TableCell>
                            {entry.completedAt ? format(new Date(entry.completedAt), "HH:mm") : "-"}
                          </TableCell>
                          <TableCell>{totalTime} min</TableCell>
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

      {/* Complete Serving Dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Service</DialogTitle>
            <DialogDescription>
              Mark the pharmacy service as completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEntry && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {selectedEntry.patient.firstName.charAt(0)}{selectedEntry.patient.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedEntry.patient.firstName} {selectedEntry.patient.lastName}</div>
                    <div className="text-sm text-gray-500">Token: {selectedEntry.tokenNumber}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowComplete(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedEntry && handleCompleteServing(selectedEntry.id)}>
              Complete Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispense Medicine Dialog */}
      <Dialog open={showDispense} onOpenChange={setShowDispense}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispense Medicine</DialogTitle>
            <DialogDescription>
              Select prescription and dispense medicines for this patient
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Patient Information */}
            {selectedEntry && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {selectedEntry.patient.firstName.charAt(0)}{selectedEntry.patient.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedEntry.patient.firstName} {selectedEntry.patient.lastName}</div>
                    <div className="text-sm text-gray-500">Token: {selectedEntry.tokenNumber} | Age: {selectedEntry.patient.age} | {selectedEntry.patient.gender}</div>
                    {selectedEntry.patient.phone && (
                      <div className="text-sm text-gray-500">Phone: {selectedEntry.patient.phone}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Prescription Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Prescription</h3>
              <div className="grid gap-4">
                {prescriptions.map((prescription) => (
                  <Card 
                    key={prescription.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedPrescription?.id === prescription.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{prescription.diagnosis}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Dr. {prescription.doctor?.firstName} {prescription.doctor?.lastName} | 
                            {new Date(prescription.issuedDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            Medicines: {JSON.parse(prescription.medications || '[]').length}
                          </div>
                        </div>
                        <div className="ml-4">
                          {selectedPrescription?.id === prescription.id && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Medicine Selection */}
            {selectedPrescription && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dispense Medicines</h3>
                
                {/* Prescription Medicines */}
                <div className="space-y-2">
                  <h4 className="font-medium">Prescribed Medicines:</h4>
                  <div className="grid gap-2">
                    {JSON.parse(selectedPrescription.medications || '[]').map((medicine: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-sm text-gray-600">
                          {medicine.dosage} | {medicine.frequency} | {medicine.duration}
                        </div>
                        {medicine.instructions && (
                          <div className="text-sm text-gray-500 mt-1">Instructions: {medicine.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Medicines */}
                <div className="space-y-2">
                  <h4 className="font-medium">Available in Inventory:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                    {medicines.map((medicine) => {
                      const dispensedItem = dispenseForm.medicinesDispensed.find(item => item.medicineId === medicine.id)
                      return (
                        <Card key={medicine.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{medicine.name}</div>
                              <div className="text-sm text-gray-500">
                                {medicine.category} | Stock: {medicine.quantity}
                              </div>
                              <div className="text-sm font-medium text-green-600">
                                ₹{medicine.sellingPrice}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="1"
                                max={medicine.quantity}
                                value={dispensedItem?.quantity || ''}
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value) || 0
                                  if (quantity > 0 && quantity <= medicine.quantity) {
                                    addMedicineToDispense(medicine.id, quantity)
                                  } else if (quantity === 0) {
                                    removeMedicineFromDispense(medicine.id)
                                  }
                                }}
                                placeholder="Qty"
                                className="w-20"
                              />
                              {dispensedItem && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeMedicineFromDispense(medicine.id)}
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    value={dispenseForm.paymentMethod} 
                    onValueChange={(value) => setDispenseForm(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Total Amount */}
                {dispenseForm.medicinesDispensed.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{dispenseForm.medicinesDispensed.reduce((sum, item) => {
                          const medicine = medicines.find(m => m.id === item.medicineId)
                          return sum + (medicine ? medicine.sellingPrice * item.quantity : 0)
                        }, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDispense(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDispenseSubmit}
              disabled={!selectedPrescription || dispenseForm.medicinesDispensed.length === 0}
            >
              Dispense Medicines
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}