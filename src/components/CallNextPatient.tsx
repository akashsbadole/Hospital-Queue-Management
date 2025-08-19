"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Users, Clock, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface Department {
  id: string
  name: string
  code: string
  description: string
  currentToken: string | null
  waitingCount: number
  servingCount: number
  calledCount: number
  totalEntries: number
}

interface CallNextPatientProps {
  onCallComplete?: (department: Department, patient: any) => void
  userRole?: string
}

export default function CallNextPatient({ onCallComplete, userRole }: CallNextPatientProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [calling, setCalling] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [callResult, setCallResult] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError("")
      
      const response = await fetch("/api/queue/opd/departments")
      if (!response.ok) throw new Error("Failed to fetch departments")

      const data = await response.json()
      if (data.success) {
        setDepartments(data.data.departments || [])
      } else {
        setError(data.error || "Failed to fetch departments")
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error)
      setError("Failed to fetch departments")
    } finally {
      setLoading(false)
    }
  }

  const handleCallNext = async (department: Department) => {
    if (department.waitingCount === 0) {
      setError("No patients waiting in this department")
      return
    }

    try {
      setCalling(true)
      setError("")
      setSelectedDepartment(department)

      const response = await fetch("/api/queue/opd/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CALL_NEXT",
          queueId: department.id
        })
      })

      const data = await response.json()
      if (data.success) {
        setCallResult(data.data)
        if (onCallComplete) {
          onCallComplete(department, data.data.patient)
        }
        
        // Refresh departments after successful call
        await fetchDepartments()
        
        // Auto close after 2 seconds if successful
        setTimeout(() => {
          setIsOpen(false)
          setCallResult(null)
          setSelectedDepartment(null)
        }, 2000)
      } else {
        setError(data.error || "Failed to call next patient")
      }
    } catch (error) {
      console.error("Failed to call next patient:", error)
      setError("Failed to call next patient")
    } finally {
      setCalling(false)
    }
  }

  const resetDialog = () => {
    setError("")
    setCallResult(null)
    setSelectedDepartment(null)
    setCalling(false)
  }

  const getPriorityColor = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-600"
    if (count <= 3) return "bg-green-100 text-green-700"
    if (count <= 8) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetDialog()
    }}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Phone className="w-4 h-4 mr-2" />
          Call Next Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Call Next Patient</span>
          </DialogTitle>
          <DialogDescription>
            Select a department to call the next patient from the queue
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {callResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully called patient {callResult.patient?.firstName} {callResult.patient?.lastName} 
              (Token: {callResult.calledToken}) from {selectedDepartment?.name}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading departments...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map((department) => (
                <Card 
                  key={department.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDepartment?.id === department.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => !calling && handleCallNext(department)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getPriorityColor(department.waitingCount)}
                      >
                        {department.waitingCount} waiting
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {department.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{department.waitingCount}</div>
                        <div className="text-xs text-gray-500">Waiting</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{department.servingCount}</div>
                        <div className="text-xs text-gray-500">Serving</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {department.currentToken || '-'}
                        </div>
                        <div className="text-xs text-gray-500">Current</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        className="w-full" 
                        disabled={calling || department.waitingCount === 0}
                        variant={department.waitingCount === 0 ? "outline" : "default"}
                      >
                        {calling && selectedDepartment?.id === department.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Calling...
                          </>
                        ) : department.waitingCount === 0 ? (
                          "No patients waiting"
                        ) : (
                          <>
                            <Phone className="w-4 h-4 mr-2" />
                            Call Next
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {departments.length === 0 && !loading && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No departments available or no active queues found
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}