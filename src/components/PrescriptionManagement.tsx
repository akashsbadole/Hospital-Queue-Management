"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Edit, Eye, FileText, Pill, User, Calendar, Search, X } from "lucide-react"
import { format } from "date-fns"

interface Medicine {
  id?: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
  isCustom: boolean
  medicineId?: string // For pharmacy medicines
}

interface PharmacyMedicine {
  id: string
  name: string
  description?: string
  category: string
  brand?: string
  quantity: number
  unit: string
  price: number
  expiryDate?: string
  status: string
  manufacturer?: string
}

interface Prescription {
  id: string
  patientId: string
  doctorId?: string
  diagnosis: string
  medications: Medicine[]
  notes?: string
  issuedDate: string
  isActive: boolean
  patient: {
    id: string
    firstName: string
    lastName: string
    age: number
    gender: string
    phone?: string
  }
  doctor?: {
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
  phone?: string
}

export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [medicineSearchTerm, setMedicineSearchTerm] = useState("")
  const [showMedicineSearch, setShowMedicineSearch] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    diagnosis: "",
    notes: "",
    medications: [
      { name: "", dosage: "", frequency: "", duration: "", instructions: "", isCustom: false }
    ] as Medicine[]
  })

  useEffect(() => {
    fetchPrescriptions()
    fetchPatients()
    fetchMedicines()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPrescriptions(data.data.prescriptions || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error)
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

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/pharmacy/inventory/medicines')
      if (response.ok) {
        const data = await response.json()
        if (data.medicines) {
          // Transform the API response to match our interface
          const transformedMedicines = data.medicines.map((med: any) => ({
            id: med.id,
            name: med.name,
            description: med.description,
            category: med.category,
            brand: med.manufacturer,
            quantity: med.quantity,
            unit: med.unit,
            price: med.price,
            expiryDate: med.expiryDate,
            status: med.status,
            manufacturer: med.manufacturer
          }))
          setMedicines(transformedMedicines)
        }
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error)
    }
  }

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate form data
    if (!formData.patientId) {
      setError("Please select a patient")
      return
    }
    
    if (!formData.diagnosis.trim()) {
      setError("Please enter a diagnosis")
      return
    }
    
    // Validate medications
    const validMedications = formData.medications.filter(med => 
      med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim() && med.instructions.trim()
    )
    
    if (validMedications.length === 0) {
      setError("Please add at least one complete medication with all fields filled")
      return
    }
    
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          medications: validMedications
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setShowCreateDialog(false)
        resetForm()
        fetchPrescriptions()
      } else {
        setError(data.error || 'Failed to create prescription')
      }
    } catch (error) {
      console.error('Failed to create prescription:', error)
      setError('Network error. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      patientId: "",
      diagnosis: "",
      notes: "",
      medications: [
        { name: "", dosage: "", frequency: "", duration: "", instructions: "", isCustom: false }
      ]
    })
    setShowMedicineSearch(null)
    setMedicineSearchTerm("")
  }

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "", frequency: "", duration: "", instructions: "", isCustom: false }
      ]
    }))
  }

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const removeMedicine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearchTerm.toLowerCase()) &&
    medicine.status === 'in_stock' &&
    medicine.quantity > 0
  )

  const selectMedicine = (medicine: PharmacyMedicine, index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index
          ? {
              ...med,
              name: medicine.name,
              medicineId: medicine.id,
              isCustom: false
            }
          : med
      )
    }))
    setShowMedicineSearch(null)
    setMedicineSearchTerm("")
  }

  const addCustomMedicine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index
          ? {
              ...med,
              isCustom: true,
              medicineId: undefined,
              name: ""
            }
          : med
      )
    }))
    setShowMedicineSearch(null)
    setMedicineSearchTerm("")
  }

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prescription Management</h2>
          <p className="text-gray-600">Create and manage digital prescriptions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Create a digital prescription for a patient
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePrescription} className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
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

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis"
                  required
                />
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Medications *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Medicine
                  </Button>
                </div>
                
                {formData.medications.map((medicine, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      {/* Medicine Selection */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Medicine #{index + 1}</Label>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMedicineSearch(index)}
                            className="flex items-center space-x-1"
                          >
                            <Search className="w-3 h-3" />
                            <span>{medicine.isCustom ? "Custom" : "Search Pharmacy"}</span>
                          </Button>
                          {formData.medications.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeMedicine(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Medicine Search Dialog */}
                      {showMedicineSearch === index && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center space-x-2 mb-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Search available medicines..."
                              value={medicineSearchTerm}
                              onChange={(e) => setMedicineSearchTerm(e.target.value)}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowMedicineSearch(null)
                                setMedicineSearchTerm("")
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Medicine Search Results */}
                          {medicineSearchTerm && (
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {filteredMedicines.length > 0 ? (
                                filteredMedicines.slice(0, 10).map((med) => (
                                  <div
                                    key={med.id}
                                    className="flex items-center justify-between p-2 bg-white border rounded cursor-pointer hover:bg-blue-50"
                                    onClick={() => selectMedicine(med, index)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">{med.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {med.category} • {med.manufacturer} • Stock: {med.quantity} {med.unit}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      ₹{med.price}
                                    </Badge>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  No medicines found. 
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => addCustomMedicine(index)}
                                    className="ml-1 p-0 h-auto"
                                  >
                                    Add custom medicine
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Custom Medicine Option */}
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomMedicine(index)}
                              className="w-full"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Custom Medicine (Not in Pharmacy)
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Medicine Name Display */}
                      <div className="space-y-2">
                        <Label>Medicine Name</Label>
                        {medicine.isCustom ? (
                          <Input
                            value={medicine.name}
                            onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                            placeholder="Enter custom medicine name"
                            required
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={medicine.name}
                              onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                              placeholder="Search and select medicine"
                              required
                              className="flex-1"
                            />
                            {medicine.name && (
                              <Badge variant={medicine.isCustom ? "secondary" : "default"}>
                                {medicine.isCustom ? "Custom" : "Pharmacy"}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Medicine Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Dosage *</Label>
                          <Input
                            value={medicine.dosage}
                            onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency *</Label>
                          <Input
                            value={medicine.frequency}
                            onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                            placeholder="e.g., Twice daily"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration *</Label>
                          <Input
                            value={medicine.duration}
                            onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                            placeholder="e.g., 7 days"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instructions *</Label>
                          <Input
                            value={medicine.instructions}
                            onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                            placeholder="e.g., After meals"
                            required
                          />
                        </div>
                      </div>

                      {/* Medicine Info */}
                      {medicine.medicineId && (
                        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                          Selected from pharmacy inventory. Stock will be automatically updated when dispensed.
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional instructions or notes"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.patientId || !formData.diagnosis}>
                  Create Prescription
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

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
          <CardDescription>Manage and view patient prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Medicines</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      {format(new Date(prescription.issuedDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {prescription.patient.firstName} {prescription.patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prescription.patient.age}y, {prescription.patient.gender}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {prescription.diagnosis}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {prescription.medications.length} medicines
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prescription.doctor 
                        ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
                        : 'Not assigned'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={prescription.isActive ? 'default' : 'secondary'}>
                        {prescription.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPrescription(prescription)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Details Dialog */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
              <DialogDescription>
                View detailed prescription information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Patient Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <p className="font-medium">
                        {selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}
                      </p>
                    </div>
                    <div>
                      <Label>Age/Gender</Label>
                      <p className="font-medium">
                        {selectedPrescription.patient.age} years, {selectedPrescription.patient.gender}
                      </p>
                    </div>
                    {selectedPrescription.patient.phone && (
                      <div>
                        <Label>Phone</Label>
                        <p className="font-medium">{selectedPrescription.patient.phone}</p>
                      </div>
                    )}
                    <div>
                      <Label>Prescription Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedPrescription.issuedDate), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diagnosis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Diagnosis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{selectedPrescription.diagnosis}</p>
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pill className="h-5 w-5" />
                    <span>Medications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedPrescription.medications.map((medicine, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Medicine</Label>
                            <p className="font-medium">{medicine.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Dosage</Label>
                            <p className="font-medium">{medicine.dosage}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Frequency</Label>
                            <p className="font-medium">{medicine.frequency}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Duration</Label>
                            <p className="font-medium">{medicine.duration}</p>
                          </div>
                        </div>
                        {medicine.instructions && (
                          <div className="mt-2">
                            <Label className="text-sm font-medium">Instructions</Label>
                            <p className="text-gray-600">{medicine.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              {selectedPrescription.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedPrescription.notes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}