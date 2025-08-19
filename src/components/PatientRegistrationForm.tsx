"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Phone, Mail, MapPin, Calendar, AlertCircle, CheckCircle, CreditCard, Shield, FileText, UserCheck, Home, Briefcase, GraduationCap, DollarSign } from "lucide-react"

interface PatientData {
  firstName: string
  lastName: string
  email: string
  phone: string
  age: string
  gender: string
  dateOfBirth: string
  bloodGroup: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  department: string
  reason: string
  emergencyContact: string
  emergencyPhone: string
  // New fields
  caste: string
  religion: string
  hasBPLCard: boolean
  bplCardNumber: string
  hasYellowCard: boolean
  yellowCardNumber: string
  aadhaarNumber: string
  panNumber: string
  nationality: string
  maritalStatus: string
  occupation: string
  annualIncome: string
  education: string
}

export default function PatientRegistrationForm() {
  const [formData, setFormData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    department: "",
    reason: "",
    emergencyContact: "",
    emergencyPhone: "",
    // New fields
    caste: "",
    religion: "",
    hasBPLCard: false,
    bplCardNumber: "",
    hasYellowCard: false,
    yellowCardNumber: "",
    aadhaarNumber: "",
    panNumber: "",
    nationality: "Indian",
    maritalStatus: "",
    occupation: "",
    annualIncome: "",
    education: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [queueToken, setQueueToken] = useState<string | null>(null)

  const departments = [
    "General Medicine",
    "Pediatrics",
    "Gynecology",
    "Orthopedics",
    "Cardiology",
    "Dermatology",
    "Ophthalmology",
    "ENT",
    "Psychiatry",
    "Dental"
  ]

  const casteOptions = [
    "General", "OBC", "SC", "ST", "Other"
  ]

  const religionOptions = [
    "Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"
  ]

  const bloodGroups = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
  ]

  const maritalStatusOptions = [
    "Single", "Married", "Divorced", "Widowed"
  ]

  const educationOptions = [
    "Illiterate", "Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate", "Professional"
  ]

  const occupationOptions = [
    "Agriculture", "Labor", "Business", "Service", "Professional", "Student", "Homemaker", "Retired", "Unemployed", "Other"
  ]

  const incomeOptions = [
    "Below 1 Lakh", "1-3 Lakhs", "3-5 Lakhs", "5-10 Lakhs", "10-20 Lakhs", "Above 20 Lakhs"
  ]

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: keyof PatientData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/patients/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setQueueToken(data.data.queueToken)
          setSubmitStatus('success')
          // Reset form
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            age: "",
            gender: "",
            dateOfBirth: "",
            bloodGroup: "",
            address: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
            department: "",
            reason: "",
            emergencyContact: "",
            emergencyPhone: "",
            // New fields
            caste: "",
            religion: "",
            hasBPLCard: false,
            bplCardNumber: "",
            hasYellowCard: false,
            yellowCardNumber: "",
            aadhaarNumber: "",
            panNumber: "",
            nationality: "Indian",
            maritalStatus: "",
            occupation: "",
            annualIncome: "",
            education: "",
          })
        } else {
          setSubmitStatus('error')
        }
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.phone && 
           formData.age && formData.gender && formData.department && formData.reason
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Patient Registration</span>
          </CardTitle>
          <CardDescription>
            Register a new patient and generate queue token for consultation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Basic Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Enter age"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange('bloodGroup', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Phone className="h-5 w-5 text-green-600" />
                <span>Contact Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Home className="h-5 w-5 text-purple-600" />
                <span>Address Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete address"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Demographic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-orange-600" />
                <span>Demographic Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caste">Caste</Label>
                  <Select value={formData.caste} onValueChange={(value) => handleInputChange('caste', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select caste" />
                    </SelectTrigger>
                    <SelectContent>
                      {casteOptions.map((caste) => (
                        <SelectItem key={caste} value={caste}>{caste}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Select value={formData.religion} onValueChange={(value) => handleInputChange('religion', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select religion" />
                    </SelectTrigger>
                    <SelectContent>
                      {religionOptions.map((religion) => (
                        <SelectItem key={religion} value={religion}>{religion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    placeholder="Enter nationality"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationOptions.map((education) => (
                        <SelectItem key={education} value={education}>{education}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupation" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationOptions.map((occupation) => (
                        <SelectItem key={occupation} value={occupation}>{occupation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Financial Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualIncome">Annual Income</Label>
                  <Select value={formData.annualIncome} onValueChange={(value) => handleInputChange('annualIncome', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeOptions.map((income) => (
                        <SelectItem key={income} value={income}>{income}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                  <Input
                    id="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => handleInputChange('panNumber', e.target.value)}
                    placeholder="Enter PAN number"
                    maxLength={10}
                  />
                </div>
              </div>
              
              {/* BPL Card Section */}
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <Checkbox
                  id="hasBPLCard"
                  checked={formData.hasBPLCard}
                  onCheckedChange={(checked) => handleCheckboxChange('hasBPLCard', checked as boolean)}
                />
                <Label htmlFor="hasBPLCard" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Has BPL (Below Poverty Line) Card</span>
                </Label>
              </div>
              {formData.hasBPLCard && (
                <div className="space-y-2">
                  <Label htmlFor="bplCardNumber">BPL Card Number</Label>
                  <Input
                    id="bplCardNumber"
                    value={formData.bplCardNumber}
                    onChange={(e) => handleInputChange('bplCardNumber', e.target.value)}
                    placeholder="Enter BPL card number"
                  />
                </div>
              )}

              {/* Yellow Card Section */}
              <div className="flex items-center space-x-2 p-4 border rounded-lg">
                <Checkbox
                  id="hasYellowCard"
                  checked={formData.hasYellowCard}
                  onCheckedChange={(checked) => handleCheckboxChange('hasYellowCard', checked as boolean)}
                />
                <Label htmlFor="hasYellowCard" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Has Yellow Card (Ration Card)</span>
                </Label>
              </div>
              {formData.hasYellowCard && (
                <div className="space-y-2">
                  <Label htmlFor="yellowCardNumber">Yellow Card Number</Label>
                  <Input
                    id="yellowCardNumber"
                    value={formData.yellowCardNumber}
                    onChange={(e) => handleInputChange('yellowCardNumber', e.target.value)}
                    placeholder="Enter yellow card number"
                  />
                </div>
              )}
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5 text-red-600" />
                <span>Medical Information</span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Describe the reason for visit"
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Registering..." : "Register Patient"}
              </Button>
            </div>
          </form>

          {/* Status Messages */}
          {submitStatus === 'success' && queueToken && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Registration Successful!</span>
                </div>
                <div className="mt-2">
                  <p className="text-green-700">Queue Token: <Badge variant="outline" className="text-green-600 border-green-600">{queueToken}</Badge></p>
                  <p className="text-sm text-green-600 mt-1">Please show this token at the reception desk.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {submitStatus === 'error' && (
            <Card className="mt-4 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Registration Failed</span>
                </div>
                <p className="text-sm text-red-600 mt-1">Please try again or contact the administrator.</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}