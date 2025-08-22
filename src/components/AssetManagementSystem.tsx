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
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  QrCode, 
  Barcode, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Smartphone,
  Bed,
  Wheelchair,
  Monitor,
  Stethoscope,
  Activity,
  Download
} from "lucide-react"
import { format } from "date-fns"

interface Asset {
  id: string
  name: string
  type: string
  category: string
  location: string
  department: string
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  qrCode?: string
  barcode?: string
  purchaseDate: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  description?: string
  assignedTo?: string
  assignedUser?: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  usageLogs: AssetUsageLog[]
}

interface AssetUsageLog {
  id: string
  assetId: string
  userId: string
  user: {
    firstName: string
    lastName: string
    role: string
  }
  action: 'check_out' | 'check_in' | 'maintenance' | 'transfer' | 'scan'
  timestamp: string
  notes?: string
  location?: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  role: string
  department?: string
}

export default function AssetManagementSystem() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [usageLogs, setUsageLogs] = useState<AssetUsageLog[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    category: "",
    location: "",
    department: "",
    status: "available" as 'available' | 'in_use' | 'maintenance' | 'retired',
    condition: "good" as 'excellent' | 'good' | 'fair' | 'poor',
    purchaseDate: "",
    lastMaintenanceDate: "",
    nextMaintenanceDate: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    description: "",
    assignedTo: ""
  })

  const assetTypes = [
    "BED", "WHEELCHAIR", "MONITOR", "VENTILATOR", "PUMP", "SCANNER", 
    "ULTRASOUND", "XRAY", "COMPUTER", "PRINTER", "PHONE", "TABLET",
    "SURGICAL_EQUIPMENT", "LAB_EQUIPMENT", "OTHER"
  ]

  const categories = [
    "Furniture", "Medical Equipment", "Electronics", "Surgical Instruments",
    "Diagnostic Equipment", "Patient Care", "IT Equipment", "Other"
  ]

  const departments = [
    "Emergency", "ICU", "General Ward", "Surgery", "Pediatrics", 
    "Radiology", "Laboratory", "Pharmacy", "Administration", "Other"
  ]

  const assetTypeIcons: { [key: string]: any } = {
    BED: Bed,
    WHEELCHAIR: Wheelchair,
    MONITOR: Monitor,
    COMPUTER: Monitor,
    PHONE: Smartphone,
    SURGICAL_EQUIPMENT: Wrench,
    OTHER: Package
  }

  useEffect(() => {
    fetchAssets()
    fetchUsers()
  }, [])

  useEffect(() => {
    filterAssets()
  }, [assets, searchTerm, selectedCategory, selectedStatus])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockAssets: Asset[] = [
        {
          id: "1",
          name: "Hospital Bed 001",
          type: "BED",
          category: "Furniture",
          location: "Ward A - Room 101",
          department: "General Ward",
          status: "available",
          condition: "good",
          purchaseDate: "2023-01-15",
          manufacturer: "Hill-Rom",
          model: "Centra",
          serialNumber: "HR001234",
          description: "Electric hospital bed with side rails",
          usageLogs: []
        },
        {
          id: "2",
          name: "Wheelchair WC001",
          type: "WHEELCHAIR",
          category: "Patient Care",
          location: "Emergency Department",
          department: "Emergency",
          status: "in_use",
          condition: "excellent",
          purchaseDate: "2023-03-20",
          manufacturer: "Invacare",
          model: "Tracer EX2",
          serialNumber: "INV005678",
          description: "Standard wheelchair with removable arms",
          usageLogs: []
        },
        {
          id: "3",
          name: "Patient Monitor PM001",
          type: "MONITOR",
          category: "Medical Equipment",
          location: "ICU - Bed 3",
          department: "ICU",
          status: "in_use",
          condition: "excellent",
          purchaseDate: "2023-06-10",
          lastMaintenanceDate: "2024-01-15",
          nextMaintenanceDate: "2024-07-15",
          manufacturer: "Philips",
          model: "IntelliVue MX40",
          serialNumber: "PHL009876",
          description: "Multi-parameter patient monitor",
          usageLogs: []
        }
      ]
      setAssets(mockAssets)
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockUsers: User[] = [
        { id: "1", firstName: "John", lastName: "Doe", role: "DOCTOR", department: "General Ward" },
        { id: "2", firstName: "Jane", lastName: "Smith", role: "NURSE", department: "ICU" },
        { id: "3", firstName: "Mike", lastName: "Johnson", role: "STAFF", department: "Emergency" }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const filterAssets = () => {
    let filtered = assets

    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(asset => asset.category === selectedCategory)
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(asset => asset.status === selectedStatus)
    }

    setFilteredAssets(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'in_use':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'retired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generateQRCode = async (asset: Asset) => {
    setSelectedAsset(asset)
    setShowQRCode(true)
    
    // Mock QR code generation - replace with actual API call
    const qrData = {
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      serialNumber: asset.serialNumber,
      location: asset.location,
      generatedAt: new Date().toISOString()
    }
    
    console.log('Generated QR Code for:', qrData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Mock API call - replace with actual implementation
      const newAsset: Asset = {
        id: Date.now().toString(),
        ...formData,
        usageLogs: []
      }
      
      if (editingAsset) {
        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id ? { ...editingAsset, ...formData } : asset
        ))
      } else {
        setAssets(prev => [...prev, newAsset])
      }
      
      setIsAddDialogOpen(false)
      setEditingAsset(null)
      resetForm()
    } catch (error) {
      console.error('Failed to save asset:', error)
    }
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      name: asset.name,
      type: asset.type,
      category: asset.category,
      location: asset.location,
      department: asset.department,
      status: asset.status,
      condition: asset.condition,
      purchaseDate: asset.purchaseDate,
      lastMaintenanceDate: asset.lastMaintenanceDate || "",
      nextMaintenanceDate: asset.nextMaintenanceDate || "",
      manufacturer: asset.manufacturer || "",
      model: asset.model || "",
      serialNumber: asset.serialNumber || "",
      description: asset.description || "",
      assignedTo: asset.assignedTo || ""
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        setAssets(prev => prev.filter(asset => asset.id !== id))
      } catch (error) {
        console.error('Failed to delete asset:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      category: "",
      location: "",
      department: "",
      status: "available",
      condition: "good",
      purchaseDate: "",
      lastMaintenanceDate: "",
      nextMaintenanceDate: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      description: "",
      assignedTo: ""
    })
  }

  const logAssetUsage = async (assetId: string, action: string, notes?: string) => {
    try {
      // Mock usage logging - replace with actual API call
      const newLog: AssetUsageLog = {
        id: Date.now().toString(),
        assetId,
        userId: "current-user-id", // Replace with actual user ID
        user: {
          firstName: "Current",
          lastName: "User",
          role: "STAFF"
        },
        action: action as any,
        timestamp: new Date().toISOString(),
        notes,
        location: "Current Location"
      }
      
      setAssets(prev => prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, usageLogs: [...asset.usageLogs, newLog] }
          : asset
      ))
    } catch (error) {
      console.error('Failed to log asset usage:', error)
    }
  }

  const availableCount = assets.filter(a => a.status === 'available').length
  const inUseCount = assets.filter(a => a.status === 'in_use').length
  const maintenanceCount = assets.filter(a => a.status === 'maintenance').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset management system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Asset QR Tracker</h2>
          <p className="text-gray-600">Track and manage hospital assets with QR codes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAsset(null)
              resetForm()
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </DialogTitle>
              <DialogDescription>
                {editingAsset ? 'Update asset information' : 'Register a new hospital asset'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Asset Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Ward A - Room 101"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Asset description and features..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">Registered assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseCount}</div>
            <p className="text-xs text-muted-foreground">Currently deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground">Under maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Assets</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, serial, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset List */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Inventory</CardTitle>
          <CardDescription>
            Manage and track hospital assets with QR codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const AssetIcon = assetTypeIcons[asset.type] || Package
                  const statusColor = getStatusColor(asset.status)
                  const conditionColor = getConditionColor(asset.condition)

                  return (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <AssetIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-sm text-gray-500">{asset.serialNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {asset.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{asset.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{asset.department}</TableCell>
                      <TableCell>
                        <Badge className={statusColor}>
                          {asset.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={conditionColor}>
                          {asset.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.lastMaintenanceDate ? (
                          <div className="text-sm">
                            {format(new Date(asset.lastMaintenanceDate), 'dd MMM yyyy')}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateQRCode(asset)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logAssetUsage(asset.id, 'scan', 'Asset scanned for tracking')}
                          >
                            <Smartphone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asset QR Code</DialogTitle>
            <DialogDescription>
              QR code for asset tracking and identification
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">QR Code</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">{selectedAsset.name}</h3>
                  <p className="text-sm text-gray-500">{selectedAsset.serialNumber}</p>
                  <p className="text-sm text-gray-500">{selectedAsset.location}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowQRCode(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}