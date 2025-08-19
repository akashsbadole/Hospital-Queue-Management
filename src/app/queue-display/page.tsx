"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Stethoscope, Package, Clock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { useHospitalSettings } from "@/hooks/useHospitalSettings"

interface QueueEntry {
  id: string
  patientId: string
  patient: {
    firstName: string
    lastName: string
    phone?: string
  }
  departmentId: string
  department: {
    id: string
    name: string
    code: string
  }
  tokenNumber: string
  status: "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "CANCELLED"
  priority: "NORMAL" | "URGENT" | "EMERGENCY"
  estimatedWaitTime: number
  createdAt: string
  updatedAt: string
}

interface Department {
  id: string
  name: string
  code: string
  currentToken?: string
  waitingCount: number
  servingCount: number
}

interface MaintenanceMode {
  id: string
  isEnabled: boolean
  message: string
  startTime?: string
  endTime?: string
  createdAt: string
  updatedAt: string
}

interface StaffNotice {
  id: string
  title: string
  content: string
  type: "INFO" | "WARNING" | "URGENT" | "ANNOUNCEMENT"
  targetRole?: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export default function QueueDisplay() {
  const { settings: hospitalSettings } = useHospitalSettings()
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null)
  const [notices, setNotices] = useState<StaffNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    fetchQueueData()
    fetchDepartments()
    fetchNotices()
    
    // Initialize Socket.IO connection
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
    setSocket(newSocket)

    // Listen for queue updates
    newSocket.on('queue-updated', (data) => {
      console.log('Queue update received:', data)
      fetchQueueData()
      fetchDepartments()
    })

    // Listen for notice updates
    newSocket.on('notices-updated', (data) => {
      console.log('Notices update received:', data)
      fetchNotices()
    })

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // Refresh queue data every 5 seconds (fallback)
    const queueTimer = setInterval(() => {
      fetchQueueData()
      fetchDepartments()
      fetchNotices()
    }, 5000)

    return () => {
      clearInterval(timer)
      clearInterval(queueTimer)
      newSocket.disconnect()
    }
  }, [])

  const fetchQueueData = async () => {
    try {
      const response = await fetch("/api/queue/opd/status")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setQueueEntries(data.data.queueEntries || [])
          setMaintenance(data.data.maintenance || null)
        }
      }
    } catch (error) {
      console.error("Failed to fetch queue data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/queue/opd/departments")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDepartments(data.data.departments || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
    }
  }

  const fetchNotices = async () => {
    try {
      const response = await fetch("/api/notices")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotices(data.data.notices || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch notices:", error)
    }
  }

  const filteredEntries = selectedDepartment === "all" 
    ? queueEntries 
    : queueEntries.filter(entry => entry.departmentId === selectedDepartment)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "CALLED": return "bg-blue-100 text-blue-800 border-blue-200"
      case "SERVING": return "bg-green-100 text-green-800 border-green-200"
      case "COMPLETED": return "bg-gray-100 text-gray-800 border-gray-200"
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "NORMAL": return "bg-gray-100 text-gray-800"
      case "URGENT": return "bg-orange-100 text-orange-800"
      case "EMERGENCY": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getNoticeColor = (type: string) => {
    switch (type) {
      case "INFO": return "bg-blue-50 border-blue-200 text-blue-800"
      case "WARNING": return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "URGENT": return "bg-orange-50 border-orange-200 text-orange-800"
      case "ANNOUNCEMENT": return "bg-purple-50 border-purple-200 text-purple-800"
      default: return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    }
  }

  // Auto-refresh sound effect when new patient is called
  useEffect(() => {
    const servingEntries = filteredEntries.filter(entry => entry.status === "SERVING")
    if (servingEntries.length > 0) {
      // Play a subtle sound when patients are being served
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {
        // Ignore audio play errors
      })
    }
  }, [filteredEntries])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading queue display...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hospitalSettings?.hospitalName || "Hospital Queue Display"}
              </h1>
              <p className="text-gray-600">Real-time queue status</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-600">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Banner */}
      {maintenance?.isEnabled && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800">System Under Maintenance</h3>
                <p className="text-red-700">{maintenance.message}</p>
                {(maintenance.startTime || maintenance.endTime) && (
                  <p className="text-sm text-red-600 mt-1">
                    {maintenance.startTime && `Start: ${new Date(maintenance.startTime).toLocaleString()}`}
                    {maintenance.startTime && maintenance.endTime && " | "}
                    {maintenance.endTime && `End: ${new Date(maintenance.endTime).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Staff Notices */}
        {notices.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Notices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`border rounded-lg p-4 ${getNoticeColor(notice.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{notice.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {notice.type}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{notice.content}</p>
                  {notice.targetRole && notice.targetRole !== 'ALL' && (
                    <div className="text-xs opacity-75">
                      For: {notice.targetRole}
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(notice.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Filter */}
        <div className="mb-6">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {departments.map((dept) => (
            <Card key={dept.id} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{dept.name}</span>
                  <Badge variant="outline">{dept.code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Token</span>
                    <span className="font-bold text-lg text-blue-600">
                      {dept.currentToken || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Waiting</span>
                    <Badge variant="secondary">{dept.waitingCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Serving</span>
                    <Badge variant="default">{dept.servingCount}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Queue Entries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currently Serving */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                <span>Currently Serving</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.filter(entry => entry.status === "SERVING").length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients currently being served</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEntries
                    .filter(entry => entry.status === "SERVING")
                    .map((entry) => (
                      <div key={entry.id} className="border-2 border-green-200 bg-green-50 rounded-lg p-4 animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-2xl font-bold text-green-700">
                                {entry.tokenNumber}
                              </span>
                              <Badge className={getPriorityColor(entry.priority)}>
                                {entry.priority}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-gray-900">
                              {entry.patient.firstName} {entry.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{entry.department.name}</p>
                          </div>
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Phone: {entry.patient.phone || "N/A"}</span>
                          <span>Waited: {formatWaitTime(entry.estimatedWaitTime)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Waiting Queue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEntries.filter(entry => entry.status === "WAITING").length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients waiting</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredEntries
                    .filter(entry => entry.status === "WAITING")
                    .sort((a, b) => {
                      // Sort by priority first, then by creation time
                      const priorityOrder = { EMERGENCY: 3, URGENT: 2, NORMAL: 1 }
                      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
                      if (priorityDiff !== 0) return priorityDiff
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    })
                    .map((entry, index) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xl font-bold text-blue-600">
                                {entry.tokenNumber}
                              </span>
                              <Badge className={getPriorityColor(entry.priority)}>
                                {entry.priority}
                              </Badge>
                              {index === 0 && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 animate-pulse">
                                  Next
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900">
                              {entry.patient.firstName} {entry.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{entry.department.name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              Est. wait: {formatWaitTime(entry.estimatedWaitTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Phone: {entry.patient.phone || "N/A"}</span>
                          <span>Position: {index + 1}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently Called */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRight className="h-5 w-5 text-blue-600" />
              <span>Recently Called</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEntries.filter(entry => entry.status === "CALLED").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recently called patients</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEntries
                  .filter(entry => entry.status === "CALLED")
                  .slice(0, 6)
                  .map((entry) => (
                    <div key={entry.id} className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-blue-700">{entry.tokenNumber}</span>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {entry.patient.firstName} {entry.patient.lastName}
                        </p>
                        <p className="text-gray-600">{entry.department.name}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}