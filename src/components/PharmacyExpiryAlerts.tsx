"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  Package, 
  Send, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Bell,
  Download,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"

interface Medicine {
  id: string
  name: string
  category: {
    name: string
  }
  quantity: number
  unit: string
  price: number
  expiryDate: string
  manufacturer: string
  status: string
  workingCondition: string
  batchNumber?: string
  storageLocation?: string
}

interface ExpiryAlertData {
  expiringMedicines: Medicine[]
  expiredMedicines: Medicine[]
  stats: {
    totalExpiring: number
    totalExpired: number
    expiringThisWeek: number
    expiringThisMonth: number
  }
  threshold: number
  generatedAt: string
}

export default function PharmacyExpiryAlerts() {
  const [expiryData, setExpiryData] = useState<ExpiryAlertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [daysThreshold, setDaysThreshold] = useState(30)
  const [showMarkExpiredDialog, setShowMarkExpiredDialog] = useState(false)
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([])
  const [expiryNotes, setExpiryNotes] = useState("")

  useEffect(() => {
    fetchExpiryAlerts()
  }, [daysThreshold])

  const fetchExpiryAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pharmacy/expiry-alerts?days=${daysThreshold}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setExpiryData(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch expiry alerts:', error)
      setError('Failed to fetch expiry alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsExpired = async () => {
    if (selectedMedicines.length === 0) return

    try {
      const response = await fetch('/api/pharmacy/expiry-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_expired',
          medicineIds: selectedMedicines,
          notes: expiryNotes
        }),
      })

      if (response.ok) {
        setShowMarkExpiredDialog(false)
        setSelectedMedicines([])
        setExpiryNotes("")
        fetchExpiryAlerts()
      }
    } catch (error) {
      console.error('Failed to mark medicines as expired:', error)
      setError('Failed to mark medicines as expired')
    }
  }

  const handleSendAlerts = async () => {
    try {
      const expiringMedicineIds = expiryData?.expiringMedicines.map(m => m.id) || []
      
      const response = await fetch('/api/pharmacy/expiry-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_alerts',
          medicineIds: expiringMedicineIds
        }),
      })

      if (response.ok) {
        alert('Expiry alerts sent successfully to pharmacists!')
      }
    } catch (error) {
      console.error('Failed to send expiry alerts:', error)
      setError('Failed to send expiry alerts')
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryUrgency = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return { variant: "destructive" as const, label: "Expired", color: "text-red-600" }
    if (daysUntilExpiry <= 7) return { variant: "destructive" as const, label: "Critical", color: "text-red-600" }
    if (daysUntilExpiry <= 30) return { variant: "secondary" as const, label: "Urgent", color: "text-orange-600" }
    return { variant: "outline" as const, label: "Upcoming", color: "text-yellow-600" }
  }

  const exportExpiryReport = () => {
    if (!expiryData) return

    const headers = [
      "Medicine Name", "Category", "Quantity", "Unit", "Expiry Date", 
      "Days Until Expiry", "Manufacturer", "Batch Number", "Status"
    ]
    
    const csvContent = [
      headers.join(","),
      ...expiryData.expiringMedicines.map(med => [
        `"${med.name}"`,
        med.category.name,
        med.quantity,
        med.unit,
        med.expiryDate,
        getDaysUntilExpiry(med.expiryDate),
        `"${med.manufacturer}"`,
        `"${med.batchNumber || ''}"`,
        med.status
      ].join(",")),
      ...expiryData.expiredMedicines.map(med => [
        `"${med.name}"`,
        med.category.name,
        med.quantity,
        med.unit,
        med.expiryDate,
        "EXPIRED",
        `"${med.manufacturer}"`,
        `"${med.batchNumber || ''}"`,
        med.status
      ].join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `medicine_expiry_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expiry alerts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!expiryData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No expiry data available</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pharmacy Expiry Alerts</h2>
          <p className="text-gray-600">Monitor medicine expiry dates and prevent expired stock</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportExpiryReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleSendAlerts}>
            <Bell className="h-4 w-4 mr-2" />
            Send Alerts
          </Button>
          <Button variant="outline" onClick={fetchExpiryAlerts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiryData.stats.totalExpired}</div>
            <p className="text-xs text-red-600">Already expired</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiryData.stats.totalExpiring}</div>
            <p className="text-xs text-orange-600">Within {daysThreshold} days</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">This Week</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiryData.stats.expiringThisWeek}</div>
            <p className="text-xs text-red-600">Expiring in 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiryData.stats.expiringThisMonth}</div>
            <p className="text-xs text-yellow-600">Expiring in 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Threshold Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Alert Threshold (days)</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                max="365"
                value={daysThreshold}
                onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 30)}
                className="w-32"
              />
            </div>
            <p className="text-sm text-gray-600 mt-6">
              Show medicines expiring within the next {daysThreshold} days
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expired Medicines */}
      {expiryData.expiredMedicines.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>Expired Medicines ({expiryData.expiredMedicines.length})</span>
            </CardTitle>
            <CardDescription>
              These medicines have already expired and should be removed from inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Expired</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiryData.expiredMedicines.map((medicine) => {
                    const daysExpired = Math.abs(getDaysUntilExpiry(medicine.expiryDate))
                    
                    return (
                      <TableRow key={medicine.id} className="bg-red-50">
                        <TableCell className="font-medium text-red-700">{medicine.name}</TableCell>
                        <TableCell>{medicine.category.name}</TableCell>
                        <TableCell>{medicine.quantity} {medicine.unit}</TableCell>
                        <TableCell className="text-red-600">
                          {format(new Date(medicine.expiryDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{daysExpired} days ago</Badge>
                        </TableCell>
                        <TableCell>{medicine.manufacturer}</TableCell>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedMedicines.includes(medicine.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMedicines(prev => [...prev, medicine.id])
                              } else {
                                setSelectedMedicines(prev => prev.filter(id => id !== medicine.id))
                              }
                            }}
                            className="mr-2"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMedicines([medicine.id])
                              setShowMarkExpiredDialog(true)
                            }}
                          >
                            Mark Expired
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Medicines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <span>Medicines Expiring Soon ({expiryData.expiringMedicines.length})</span>
          </CardTitle>
          <CardDescription>
            These medicines will expire within the next {daysThreshold} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Until Expiry</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiryData.expiringMedicines.map((medicine) => {
                  const daysUntilExpiry = getDaysUntilExpiry(medicine.expiryDate)
                  const urgency = getExpiryUrgency(daysUntilExpiry)
                  
                  return (
                    <TableRow key={medicine.id} className={
                      daysUntilExpiry <= 7 ? 'bg-red-50' : 
                      daysUntilExpiry <= 30 ? 'bg-orange-50' : 'bg-yellow-50'
                    }>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.category.name}</TableCell>
                      <TableCell>{medicine.quantity} {medicine.unit}</TableCell>
                      <TableCell className={urgency.color}>
                        {format(new Date(medicine.expiryDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={urgency.variant}>
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                        </Badge>
                      </TableCell>
                      <TableCell>{medicine.manufacturer}</TableCell>
                      <TableCell>
                        <Badge variant={urgency.variant}>
                          {urgency.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mark Expired Dialog */}
      <Dialog open={showMarkExpiredDialog} onOpenChange={setShowMarkExpiredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Medicines as Expired</DialogTitle>
            <DialogDescription>
              This will mark {selectedMedicines.length} medicines as expired and remove them from available stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={expiryNotes}
                onChange={(e) => setExpiryNotes(e.target.value)}
                placeholder="Add any additional notes about this action..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMarkExpiredDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAsExpired} className="bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Mark as Expired
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}