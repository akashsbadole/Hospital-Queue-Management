"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, 
  Download, 
  Users, 
  DollarSign, 
  Clock, 
  Package, 
  UserCheck,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Calendar
} from "lucide-react"

interface ReportLog {
  id: string
  reportType: string
  title: string
  data: string
  format: string
  generatedBy: string
  createdAt: string
}

interface ReportData {
  report: any
  title: string
  format: string
  csvContent?: string
}

export default function ReportManager() {
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState("")
  const [selectedFormat, setSelectedFormat] = useState("JSON")
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const reportTypes = [
    { 
      value: "PATIENTS", 
      label: "Patients Report", 
      description: "Complete patient database with demographics",
      icon: Users,
      color: "bg-blue-100 text-blue-800"
    },
    { 
      value: "FINANCIAL", 
      label: "Financial Report", 
      description: "Revenue, transactions, and payment analytics",
      icon: DollarSign,
      color: "bg-green-100 text-green-800"
    },
    { 
      value: "QUEUE", 
      label: "Queue Management Report", 
      description: "Queue statistics, wait times, and efficiency metrics",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800"
    },
    { 
      value: "MEDICINE", 
      label: "Medicine Inventory Report", 
      description: "Stock levels, inventory value, and expiry tracking",
      icon: Package,
      color: "bg-purple-100 text-purple-800"
    },
    { 
      value: "STAFF", 
      label: "Staff Report", 
      description: "Staff directory, roles, and activity metrics",
      icon: UserCheck,
      color: "bg-orange-100 text-orange-800"
    }
  ]

  const formats = [
    { value: "JSON", label: "JSON (Structured Data)" },
    { value: "CSV", label: "CSV (Spreadsheet Compatible)" }
  ]

  useEffect(() => {
    fetchReportLogs()
  }, [])

  const fetchReportLogs = async () => {
    try {
      // For now, we'll mock the report logs since we don't have a dedicated endpoint
      // In a real implementation, you would fetch from /api/reports/logs
      setReportLogs([])
    } catch (error) {
      console.error("Failed to fetch report logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!selectedReportType) {
      setError("Please select a report type")
      return
    }

    setGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: selectedReportType,
          format: selectedFormat
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setCurrentReport(data.data)
        setSuccess(`Report generated successfully: ${data.data.title}`)
        fetchReportLogs()
      } else {
        setError(data.error || "Failed to generate report")
      }
    } catch (error) {
      setError("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = () => {
    if (!currentReport) return

    const content = currentReport.format === 'CSV' 
      ? currentReport.csvContent 
      : JSON.stringify(currentReport.report, null, 2)
    
    const blob = new Blob([content], {
      type: currentReport.format === 'CSV' ? 'text/csv' : 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${currentReport.format.toLowerCase()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getReportTypeInfo = (type: string) => {
    return reportTypes.find(rt => rt.value === type) || reportTypes[0]
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Report Manager</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Report Manager</span>
            <Badge variant="outline" className="ml-2">
              Super Admin
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Report Generation */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Generate New Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Format</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={generateReport} 
                  disabled={generating || !selectedReportType}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>

            {selectedReportType && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const reportTypeInfo = getReportTypeInfo(selectedReportType)
                    const Icon = reportTypeInfo.icon
                    return (
                      <>
                        <div className={`p-2 rounded-full ${reportTypeInfo.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{reportTypeInfo.label}</h4>
                          <p className="text-sm text-gray-600">{reportTypeInfo.description}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Current Report Display */}
          {currentReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Current Report: {currentReport.title}</h3>
                <Button onClick={downloadReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download {currentReport.format}
                </Button>
              </div>

              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedReportType === 'PATIENTS' && (
                  <>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(currentReport.report.totalPatients)}
                      </div>
                      <div className="text-sm text-gray-600">Total Patients</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(currentReport.report.activePatients)}
                      </div>
                      <div className="text-sm text-gray-600">Active Patients</div>
                    </div>
                  </>
                )}

                {selectedReportType === 'FINANCIAL' && (
                  <>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(currentReport.report.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(currentReport.report.totalTransactions)}
                      </div>
                      <div className="text-sm text-gray-600">Transactions</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(currentReport.report.averageTransactionValue)}
                      </div>
                      <div className="text-sm text-gray-600">Average Value</div>
                    </div>
                  </>
                )}

                {selectedReportType === 'QUEUE' && (
                  <>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(currentReport.report.queueStats.opd.total)}
                      </div>
                      <div className="text-sm text-gray-600">OPD Total</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(currentReport.report.queueStats.opd.completed)}
                      </div>
                      <div className="text-sm text-gray-600">OPD Completed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {currentReport.report.queueStats.opd.averageWaitTime} min
                      </div>
                      <div className="text-sm text-gray-600">Avg Wait Time</div>
                    </div>
                  </>
                )}

                {selectedReportType === 'MEDICINE' && (
                  <>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatNumber(currentReport.report.inventoryStats.totalMedicines)}
                      </div>
                      <div className="text-sm text-gray-600">Total Medicines</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(currentReport.report.inventoryStats.totalValue)}
                      </div>
                      <div className="text-sm text-gray-600">Inventory Value</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {formatNumber(currentReport.report.inventoryStats.lowStock)}
                      </div>
                      <div className="text-sm text-gray-600">Low Stock</div>
                    </div>
                  </>
                )}

                {selectedReportType === 'STAFF' && (
                  <>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatNumber(currentReport.report.staffStats.totalStaff)}
                      </div>
                      <div className="text-sm text-gray-600">Total Staff</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(currentReport.report.staffStats.activeStaff)}
                      </div>
                      <div className="text-sm text-gray-600">Active Staff</div>
                    </div>
                  </>
                )}
              </div>

              {/* Generated At */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Generated: {new Date(currentReport.report.generatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reportLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first report above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Generated At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={getReportTypeInfo(log.reportType).color}>
                        {getReportTypeInfo(log.reportType).label}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.title}</TableCell>
                    <TableCell>{log.format}</TableCell>
                    <TableCell>{log.generatedBy}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}