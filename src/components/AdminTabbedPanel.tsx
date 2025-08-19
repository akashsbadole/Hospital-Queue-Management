"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users, Settings, FileText, Plus, Search, Filter, Edit, Trash2, Shield, Printer } from "lucide-react"
import { format } from "date-fns"
import MaintenanceModeManager from "./admin/MaintenanceModeManager"
import StaffNoticeManager from "./admin/StaffNoticeManager"
import HospitalSettingsManager from "./admin/HospitalSettingsManager"
import ReportManager from "./admin/ReportManager"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  departmentId?: string
  department?: {
    id: string
    name: string
    code: string
  }
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

interface Receipt {
  id: string
  receiptNumber: string
  patientId: string
  patient?: {
    firstName: string
    lastName: string
  }
  queueEntryId?: string
  type: string
  amount?: number
  paymentMethod?: string
  paymentStatus: string
  issuedBy?: string
  notes?: string
  createdAt: string
}

export default function AdminTabbedPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [showGenerateReceipt, setShowGenerateReceipt] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [showEditReceipt, setShowEditReceipt] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showDeleteUser, setShowDeleteUser] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Form states
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    departmentId: ""
  })

  const [newReceipt, setNewReceipt] = useState({
    patientId: "",
    type: "",
    amount: "",
    description: "",
    items: "",
    paymentMethod: ""
  })

  const [editReceiptData, setEditReceiptData] = useState({
    id: "",
    patientId: "",
    type: "",
    amount: "",
    paymentMethod: "",
    paymentStatus: "",
    notes: ""
  })

  const [editUserData, setEditUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    departmentId: "",
    isActive: true
  })

  // Options
  const roles = ["DOCTOR", "PHARMACIST", "NURSE", "ADMIN", "SUPER_ADMIN"]
  const receiptTypes = ["REGISTRATION", "OPD", "PHARMACY"]
  const paymentMethods = ["CASH", "CARD", "UPI", "INSURANCE"]
  const paymentStatuses = ["PENDING", "PAID", "CANCELLED"]

  useEffect(() => {
    fetchUsers()
    fetchReceipts()
  }, [])

  const fetchUsers = async () => {
    try {
      // Get user from localStorage for authentication
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      
      // For now, we'll use a mock token since the auth system doesn't generate real tokens
      // In a real system, you would get a proper JWT token from the login API
      const mockToken = `mock-token-${user.id}`

      const response = await fetch("/api/users", {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required")
        }
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      // Our API returns { users: [...] } directly, not { success: true, data: { users: [...] } }
      if (data.users) {
        setUsers(data.users.map((apiUser: any) => ({
          id: apiUser.id,
          firstName: apiUser.name?.split(' ')[0] || '',
          lastName: apiUser.name?.split(' ').slice(1).join(' ') || '',
          email: apiUser.email,
          role: apiUser.role,
          departmentId: apiUser.department,
          department: apiUser.department ? { id: apiUser.department, name: apiUser.department, code: apiUser.department } : undefined,
          isActive: true,
          createdAt: apiUser.createdAt
        })))
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setError("Failed to fetch users: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const fetchReceipts = async () => {
    try {
      // Get user from localStorage for authentication
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      
      // For now, we'll use a mock token since the auth system doesn't generate real tokens
      const mockToken = `mock-token-${user.id}`

      const response = await fetch("/api/receipts", {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required")
        }
        throw new Error("Failed to fetch receipts")
      }

      const data = await response.json()
      // Our API returns { receipts: [...], pagination: {...} } directly
      if (data.receipts) {
        setReceipts(data.receipts.map((apiReceipt: any) => ({
          id: apiReceipt.id,
          receiptNumber: apiReceipt.receiptNumber,
          patientId: apiReceipt.patientId,
          patient: apiReceipt.patient ? {
            firstName: apiReceipt.patient.name?.split(' ')[0] || '',
            lastName: apiReceipt.patient.name?.split(' ').slice(1).join(' ') || ''
          } : undefined,
          type: apiReceipt.type,
          amount: apiReceipt.amount,
          paymentMethod: apiReceipt.paymentMethod,
          paymentStatus: apiReceipt.status,
          issuedBy: apiReceipt.user?.name,
          notes: apiReceipt.description,
          createdAt: apiReceipt.createdAt
        })))
      }
    } catch (error) {
      console.error("Failed to fetch receipts:", error)
      setError("Failed to fetch receipts: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleAddUser = async () => {
    // Validate form
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim() || !newUser.role) {
      setError("Please fill in all required fields (First Name, Last Name, Email, and Role)")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      // Get authentication token
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      const mockToken = `mock-token-${user.id}`

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify({
          ...newUser,
          name: `${newUser.firstName} ${newUser.lastName}`,
          password: "defaultPassword123" // Default password for new users
        })
      })

      const data = await response.json()
      if (response.ok && data.user) {
        setShowAddUser(false)
        setNewUser({
          firstName: "", lastName: "", email: "", phone: "",
          role: "", departmentId: ""
        })
        setError("") // Clear any previous errors
        fetchUsers()
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (error) {
      setError("Failed to add user: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditUserData({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      departmentId: user.departmentId || "",
      isActive: user.isActive
    })
    setShowEditUser(true)
  }

  const handleUpdateUser = async () => {
    // Validate form
    if (!editUserData.firstName.trim() || !editUserData.lastName.trim() || !editUserData.email.trim() || !editUserData.role) {
      setError("Please fill in all required fields (First Name, Last Name, Email, and Role)")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editUserData.email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      // Get authentication token
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      const mockToken = `mock-token-${user.id}`

      const response = await fetch(`/api/users/${editUserData.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify({
          name: `${editUserData.firstName} ${editUserData.lastName}`,
          email: editUserData.email,
          role: editUserData.role,
          department: editUserData.departmentId
        })
      })

      const data = await response.json()
      if (response.ok && data.user) {
        setShowEditUser(false)
        setEditingUser(null)
        setError("") // Clear any previous errors
        fetchUsers()
      } else {
        setError(data.error || "Failed to update user")
      }
    } catch (error) {
      setError("Failed to update user: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteUser(true)
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return

    try {
      // Get authentication token
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      const mockToken = `mock-token-${user.id}`

      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        setShowDeleteUser(false)
        setUserToDelete(null)
        setError("") // Clear any previous errors
        fetchUsers()
      } else {
        setError(data.error || "Failed to delete user")
      }
    } catch (error) {
      setError("Failed to delete user: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleGenerateReceipt = async () => {
    try {
      // Get authentication token
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      const mockToken = `mock-token-${user.id}`

      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify({
          patientId: newReceipt.patientId,
          type: newReceipt.type,
          amount: parseFloat(newReceipt.amount),
          description: newReceipt.description || null,
          items: newReceipt.items || null,
          paymentMethod: newReceipt.paymentMethod || null
        })
      })

      const data = await response.json()
      if (response.ok && data.receipt) {
        setShowGenerateReceipt(false)
        setNewReceipt({
          patientId: "", type: "", amount: "",
          description: "", items: "", paymentMethod: ""
        })
        fetchReceipts()
      } else {
        setError(data.error || "Failed to generate receipt")
      }
    } catch (error) {
      setError("Failed to generate receipt: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setEditReceiptData({
      id: receipt.id,
      patientId: receipt.patientId,
      type: receipt.type,
      amount: receipt.amount?.toString() || "",
      paymentMethod: receipt.paymentMethod || "",
      paymentStatus: receipt.paymentStatus,
      notes: receipt.notes || ""
    })
    setShowEditReceipt(true)
  }

  const handleUpdateReceipt = async () => {
    try {
      // Get authentication token
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') : null
      
      if (!userStr || isAuthenticated !== 'true') {
        throw new Error("Not authenticated")
      }

      const user = JSON.parse(userStr)
      const mockToken = `mock-token-${user.id}`

      const response = await fetch(`/api/receipts/${editReceiptData.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${mockToken}`
        },
        body: JSON.stringify({
          ...editReceiptData,
          amount: parseFloat(editReceiptData.amount)
        })
      })

      const data = await response.json()
      if (response.ok && data.receipt) {
        setShowEditReceipt(false)
        setEditingReceipt(null)
        fetchReceipts()
      } else {
        setError(data.error || "Failed to update receipt")
      }
    } catch (error) {
      setError("Failed to update receipt: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handlePrintReceipt = (receipt: Receipt) => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL RECEIPT</h2>
          <p style="margin: 5px 0; color: #666;">Receipt No: ${receipt.receiptNumber}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p><strong>Patient:</strong> ${receipt.patient ? `${receipt.patient.firstName} ${receipt.patient.lastName}` : "Unknown"}</p>
          <p><strong>Type:</strong> ${receipt.type}</p>
          <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-bottom: 15px;">
          <p><strong>Amount:</strong> ₹${receipt.amount || "0.00"}</p>
          <p><strong>Payment Method:</strong> ${receipt.paymentMethod || "N/A"}</p>
          <p><strong>Status:</strong> ${receipt.paymentStatus}</p>
        </div>
        
        ${receipt.notes ? `<div style="margin-bottom: 15px;"><p><strong>Notes:</strong> ${receipt.notes}</p></div>` : ""}
        
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
          <p style="margin: 0; color: #666; font-size: 12px;">Thank you for your payment</p>
        </div>
      </div>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "destructive"
      case "ADMIN": return "secondary"
      case "DOCTOR": return "default"
      case "PHARMACIST": return "outline"
      case "NURSE": return "outline"
      default: return "outline"
    }
  }

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PAID": return "default"
      case "PENDING": return "secondary"
      case "CANCELLED": return "destructive"
      default: return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-gray-600">Manage users, receipts, and system settings</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with appropriate permissions
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="e.g., John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="e.g., Doe"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="e.g., john.doe@hospital.gov"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="e.g., +1-555-0123"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  Add User
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showGenerateReceipt} onOpenChange={setShowGenerateReceipt}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Generate Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Receipt</DialogTitle>
                <DialogDescription>
                  Create a professional receipt for patient services
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patientId">Patient ID *</Label>
                  <Input
                    id="patientId"
                    value={newReceipt.patientId}
                    onChange={(e) => setNewReceipt({ ...newReceipt, patientId: e.target.value })}
                    placeholder="Enter patient ID"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Receipt Type *</Label>
                  <Select onValueChange={(value) => setNewReceipt({ ...newReceipt, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {receiptTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: e.target.value })}
                    placeholder="e.g., 100.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newReceipt.description}
                    onChange={(e) => setNewReceipt({ ...newReceipt, description: e.target.value })}
                    placeholder="Receipt description..."
                  />
                </div>
                <div>
                  <Label htmlFor="items">Items</Label>
                  <Input
                    id="items"
                    value={newReceipt.items}
                    onChange={(e) => setNewReceipt({ ...newReceipt, items: e.target.value })}
                    placeholder="Items or services..."
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select onValueChange={(value) => setNewReceipt({ ...newReceipt, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowGenerateReceipt(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReceipt}>
                  Generate Receipt
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditReceipt} onOpenChange={setShowEditReceipt}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Receipt</DialogTitle>
                <DialogDescription>
                  Update receipt information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-type">Receipt Type *</Label>
                  <Select value={editReceiptData.type} onValueChange={(value) => setEditReceiptData({ ...editReceiptData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {receiptTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-amount">Amount *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editReceiptData.amount}
                    onChange={(e) => setEditReceiptData({ ...editReceiptData, amount: e.target.value })}
                    placeholder="e.g., 100.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                  <Select value={editReceiptData.paymentMethod} onValueChange={(value) => setEditReceiptData({ ...editReceiptData, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-paymentStatus">Payment Status</Label>
                  <Select value={editReceiptData.paymentStatus} onValueChange={(value) => setEditReceiptData({ ...editReceiptData, paymentStatus: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={editReceiptData.notes}
                    onChange={(e) => setEditReceiptData({ ...editReceiptData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowEditReceipt(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateReceipt}>
                  Update Receipt
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user information and permissions
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    value={editUserData.firstName}
                    onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                    placeholder="e.g., John"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    value={editUserData.lastName}
                    onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                    placeholder="e.g., Doe"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    placeholder="e.g., john.doe@hospital.gov"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editUserData.phone}
                    onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                    placeholder="e.g., +1-555-0123"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select value={editUserData.role} onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-isActive"
                      checked={editUserData.isActive}
                      onCheckedChange={(checked) => setEditUserData({ ...editUserData, isActive: checked })}
                    />
                    <Label htmlFor="edit-isActive">Active User</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowEditUser(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Update User
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showDeleteUser} onOpenChange={setShowDeleteUser}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {userToDelete && (
                <div className="space-y-2">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{userToDelete.firstName} {userToDelete.lastName}</p>
                    <p className="text-sm text-gray-600">{userToDelete.email}</p>
                    <p className="text-sm text-gray-600">Role: {userToDelete.role}</p>
                  </div>
                  {userToDelete.role === 'SUPER_ADMIN' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Warning: Deleting Super Admin users may affect system administration.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteUser(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                >
                  Delete User
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

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="receipts">Receipt Management</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage system users, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              {user.phone && (
                                <div className="text-sm text-gray-500">{user.phone}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeColor(user.role) as any}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? format(new Date(user.lastLoginAt), "MMM dd, yyyy") : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user)}
                              title="Delete User"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Management</CardTitle>
              <CardDescription>
                Generate and manage patient receipts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Receipts Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt Number</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                        <TableCell>
                          {receipt.patient ? `${receipt.patient.firstName} ${receipt.patient.lastName}` : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{receipt.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {receipt.amount ? `₹${receipt.amount}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusBadgeColor(receipt.paymentStatus) as any}>
                            {receipt.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{receipt.paymentMethod || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(receipt.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePrintReceipt(receipt)}
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditReceipt(receipt)}
                              title="Edit Receipt"
                            >
                              <Edit className="w-4 h-4" />
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
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="space-y-6">
            <MaintenanceModeManager />
            <StaffNoticeManager />
            <ReportManager />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <HospitalSettingsManager />
        </TabsContent>

        <TabsContent value="reports">
          <ReportManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}