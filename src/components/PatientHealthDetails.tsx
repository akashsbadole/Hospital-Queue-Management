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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Activity, Plus, Edit, Search, User, Calendar, AlertTriangle } from "lucide-react"

interface Patient {
  id: string
  firstName: string
  lastName: string
  age: number
  gender: string
  phone: string
  department: string
}

interface VitalSign {
  id: string
  patientId: string
  bloodPressure: string
  heartRate: number
  temperature: number
  oxygenSaturation: number
  weight: number
  height: number
  recordedAt: string
  recordedBy: string
}

interface ChronicCondition {
  id: string
  patientId: string
  condition: string
  diagnosisDate: string
  severity: 'mild' | 'moderate' | 'severe'
  treatment: string
  notes?: string
}

interface HealthRecord {
  id: string
  patientId: string
  type: 'vital_signs' | 'chronic_condition'
  date: string
  description: string
}

export default function PatientHealthDetails() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([])
  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isVitalDialogOpen, setIsVitalDialogOpen] = useState(false)
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false)

  // Form states
  const [vitalForm, setVitalForm] = useState({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  })

  const [conditionForm, setConditionForm] = useState({
    condition: "",
    diagnosisDate: "",
    severity: "",
    treatment: "",
    notes: "",
  })

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientHealthData(selectedPatient.id)
    }
  }, [selectedPatient])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.data?.patients || [])
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientHealthData = async (patientId: string) => {
    try {
      const [vitalsResponse, conditionsResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}/vital-signs`),
        fetch(`/api/patients/${patientId}/chronic-conditions`)
      ])

      if (vitalsResponse.ok) {
        const vitalsData = await vitalsResponse.json()
        setVitalSigns(vitalsData.vitalSigns || [])
      }

      if (conditionsResponse.ok) {
        const conditionsData = await conditionsResponse.json()
        setChronicConditions(conditionsData.chronicConditions || [])
      }
    } catch (error) {
      console.error('Failed to fetch patient health data:', error)
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  const handleVitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}/vital-signs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...vitalForm,
          heartRate: parseInt(vitalForm.heartRate),
          temperature: parseFloat(vitalForm.temperature),
          oxygenSaturation: parseInt(vitalForm.oxygenSaturation),
          weight: parseFloat(vitalForm.weight),
          height: parseFloat(vitalForm.height),
        }),
      })

      if (response.ok) {
        await fetchPatientHealthData(selectedPatient.id)
        setIsVitalDialogOpen(false)
        resetVitalForm()
      }
    } catch (error) {
      console.error('Failed to save vital signs:', error)
    }
  }

  const handleConditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}/chronic-conditions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conditionForm),
      })

      if (response.ok) {
        await fetchPatientHealthData(selectedPatient.id)
        setIsConditionDialogOpen(false)
        resetConditionForm()
      }
    } catch (error) {
      console.error('Failed to save chronic condition:', error)
    }
  }

  const resetVitalForm = () => {
    setVitalForm({
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      oxygenSaturation: "",
      weight: "",
      height: "",
    })
  }

  const resetConditionForm = () => {
    setConditionForm({
      condition: "",
      diagnosisDate: "",
      severity: "",
      treatment: "",
      notes: "",
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-green-100 text-green-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'severe':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100
    return (weight / (heightInMeters * heightInMeters)).toFixed(1)
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25) return 'Normal'
    if (bmi < 30) return 'Overweight'
    return 'Obese'
  }

  const latestVitals = vitalSigns.length > 0 ? vitalSigns[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Patient Health Details</h2>
        <p className="text-gray-600">Manage patient health records and vital signs</p>
      </div>

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Select Patient</span>
          </CardTitle>
          <CardDescription>
            Choose a patient to view and manage their health records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPatient?.id === patient.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {patient.age} years, {patient.gender}
                        </p>
                        <p className="text-xs text-gray-500">{patient.department}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredPatients.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No patients found matching your search.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Health Details */}
      {selectedPatient && (
        <div className="space-y-6">
          {/* Patient Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Patient Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Personal Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p><span className="font-medium">Age:</span> {selectedPatient.age} years</p>
                    <p><span className="font-medium">Gender:</span> {selectedPatient.gender}</p>
                    <p><span className="font-medium">Phone:</span> {selectedPatient.phone}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Latest Vital Signs</h3>
                  {latestVitals ? (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Blood Pressure:</span> {latestVitals.bloodPressure}</p>
                      <p><span className="font-medium">Heart Rate:</span> {latestVitals.heartRate} bpm</p>
                      <p><span className="font-medium">Temperature:</span> {latestVitals.temperature}°C</p>
                      <p><span className="font-medium">Oxygen Saturation:</span> {latestVitals.oxygenSaturation}%</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No vital signs recorded</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Health Summary</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Chronic Conditions:</span> {chronicConditions.length}</p>
                    <p><span className="font-medium">Vital Records:</span> {vitalSigns.length}</p>
                    {latestVitals && (
                      <p>
                        <span className="font-medium">BMI:</span> {getBMI(latestVitals.weight, latestVitals.height)} 
                        <span className="text-xs text-gray-500"> ({getBMICategory(parseFloat(getBMI(latestVitals.weight, latestVitals.height)))})</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Records Tabs */}
          <Tabs defaultValue="vitals" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="vitals" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Vital Signs</span>
                </TabsTrigger>
                <TabsTrigger value="conditions" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Chronic Conditions</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex space-x-2">
                <Dialog open={isVitalDialogOpen} onOpenChange={setIsVitalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetVitalForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vital Signs
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Vital Signs</DialogTitle>
                      <DialogDescription>
                        Record new vital signs for {selectedPatient.firstName} {selectedPatient.lastName}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleVitalSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bloodPressure">Blood Pressure</Label>
                          <Input
                            id="bloodPressure"
                            placeholder="120/80"
                            value={vitalForm.bloodPressure}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, bloodPressure: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                          <Input
                            id="heartRate"
                            type="number"
                            value={vitalForm.heartRate}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, heartRate: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="temperature">Temperature (°C)</Label>
                          <Input
                            id="temperature"
                            type="number"
                            step="0.1"
                            value={vitalForm.temperature}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, temperature: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oxygenSaturation">Oxygen Saturation (%)</Label>
                          <Input
                            id="oxygenSaturation"
                            type="number"
                            value={vitalForm.oxygenSaturation}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={vitalForm.weight}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, weight: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Height (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={vitalForm.height}
                            onChange={(e) => setVitalForm(prev => ({ ...prev, height: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsVitalDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Save Vital Signs</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isConditionDialogOpen} onOpenChange={setIsConditionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={resetConditionForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Condition
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Chronic Condition</DialogTitle>
                      <DialogDescription>
                        Add a new chronic condition for {selectedPatient.firstName} {selectedPatient.lastName}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleConditionSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <Input
                          id="condition"
                          value={conditionForm.condition}
                          onChange={(e) => setConditionForm(prev => ({ ...prev, condition: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
                          <Input
                            id="diagnosisDate"
                            type="date"
                            value={conditionForm.diagnosisDate}
                            onChange={(e) => setConditionForm(prev => ({ ...prev, diagnosisDate: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="severity">Severity</Label>
                          <Select value={conditionForm.severity} onValueChange={(value) => setConditionForm(prev => ({ ...prev, severity: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="treatment">Treatment</Label>
                        <Textarea
                          id="treatment"
                          value={conditionForm.treatment}
                          onChange={(e) => setConditionForm(prev => ({ ...prev, treatment: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={conditionForm.notes}
                          onChange={(e) => setConditionForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsConditionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Save Condition</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="vitals">
              <Card>
                <CardHeader>
                  <CardTitle>Vital Signs History</CardTitle>
                  <CardDescription>
                    Historical vital signs data for {selectedPatient.firstName} {selectedPatient.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vitalSigns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Blood Pressure</TableHead>
                            <TableHead>Heart Rate</TableHead>
                            <TableHead>Temperature</TableHead>
                            <TableHead>O2 Saturation</TableHead>
                            <TableHead>Weight</TableHead>
                            <TableHead>Height</TableHead>
                            <TableHead>BMI</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vitalSigns.map((vital) => {
                            const bmi = getBMI(vital.weight, vital.height)
                            return (
                              <TableRow key={vital.id}>
                                <TableCell>{new Date(vital.recordedAt).toLocaleDateString()}</TableCell>
                                <TableCell>{vital.bloodPressure}</TableCell>
                                <TableCell>{vital.heartRate} bpm</TableCell>
                                <TableCell>{vital.temperature}°C</TableCell>
                                <TableCell>{vital.oxygenSaturation}%</TableCell>
                                <TableCell>{vital.weight} kg</TableCell>
                                <TableCell>{vital.height} cm</TableCell>
                                <TableCell>{bmi}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No vital signs recorded for this patient.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conditions">
              <Card>
                <CardHeader>
                  <CardTitle>Chronic Conditions</CardTitle>
                  <CardDescription>
                    Chronic conditions and their management for {selectedPatient.firstName} {selectedPatient.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chronicConditions.length > 0 ? (
                    <div className="space-y-4">
                      {chronicConditions.map((condition) => (
                        <Card key={condition.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{condition.condition}</h3>
                              <Badge className={getSeverityColor(condition.severity)}>
                                {condition.severity}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p><span className="font-medium">Diagnosed:</span> {new Date(condition.diagnosisDate).toLocaleDateString()}</p>
                                <p><span className="font-medium">Treatment:</span> {condition.treatment}</p>
                              </div>
                              {condition.notes && (
                                <div>
                                  <p><span className="font-medium">Notes:</span> {condition.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No chronic conditions recorded for this patient.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}