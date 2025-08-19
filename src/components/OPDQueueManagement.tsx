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
import { AlertCircle, Users, Clock, CheckCircle, XCircle, Plus, Phone, End, Eye } from "lucide-react"
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
}

interface Queue {
  id: string
  name: string
  departmentId: string
  type: string
  isActive: boolean
  currentToken: number
}

export default function OPDQueueManagement() {
  const [queues, setQueues] = useState<Queue[]>([])
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedQueue, setSelectedQueue] = useState("")
  const [showCallNext, setShowCallNext] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null)

  useEffect(() => {
    fetchQueues()
    fetchQueueEntries()
  }, [])

  const fetchQueues = async () => {
    try {
      const response = await fetch("/api/queue/opd/departments")
      if (!response.ok) throw new Error("Failed to fetch queues")

      const data = await response.json()
      console.log("API Response:", data)
      if (data.success) {
        const departments = data.data.departments
        if (Array.isArray(departments)) {
          // Transform departments to queue format
          setQueues(departments.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            departmentId: dept.id,
            type: 'OPD',
            isActive: true,
            currentToken: dept.currentToken || 0
          })))
        } else {
          console.error("Departments is not an array:", departments)
          setError("Invalid data format received")
        }
      }
    } catch (error) {
      console.error("Failed to fetch queues:", error)
      setError("Failed to fetch queues")
    }
  }

  const fetchQueueEntries = async () => {
    try {
      const response = await fetch("/api/queue/opd/status")
      if (!response.ok) throw new Error("Failed to fetch queue entries")

      const data = await response.json()
      console.log("Queue Entries API Response:", data)
      if (data.success) {
        setQueueEntries(data.data.queueEntries || [])
      }
    } catch (error) {
      console.error("Failed to fetch queue entries:", error)
    }
  }

  const handleCallNext = async () => {
    if (!selectedQueue) return

    try {
      const response = await fetch("/api/queue/opd/manage", {
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
      const response = await fetch("/api/queue/opd/manage", {
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
      const response = await fetch("/api/queue/opd/manage", {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING": return { variant: "secondary" as const, icon: Clock, label: "Waiting" }
      case "CALLED": return { variant: "default" as const, icon: Eye, label: "Called" }
      case "SERVING": return { variant: "default" as const, icon: Users, label: "Serving" }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">OPD Queue Management</h2>
          <p className="text-gray-600">Manage outpatient department queues and patient flow</p>
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
            <Users className="h-4 w-4 text-muted-foreground" />
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
              <CardDescription>Patients currently waiting to be called</CardDescription>
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
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartServing(entry.id)}
                              >
                                <Users className="w-4 h-4" />
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
              <CardDescription>Patients currently being served by doctors</CardDescription>
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
              <CardDescription>Patients who have completed their appointments</CardDescription>
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
              Mark the current service as completed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
    </div>
  )
}