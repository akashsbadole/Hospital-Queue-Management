"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Stethoscope, 
  Package, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Pill,
  Building,
  UserCheck,
  ShoppingCart
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts"

interface Statistics {
  patients: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    growthToday: string
  }
  queues: {
    opd: {
      waiting: number
      serving: number
      completed: number
      averageWaitTime: number
    }
    pharmacy: {
      waiting: number
      serving: number
      completed: number
      averageWaitTime: number
    }
  }
  prescriptions: {
    total: number
    today: number
  }
  revenue: {
    total: number
    today: number
    growthToday: string
  }
  receipts: {
    total: number
    today: number
  }
  staff: {
    doctors: number
    pharmacists: number
  }
  departments: Array<{
    id: string
    name: string
    opdQueueCount: number
    pharmacyQueueCount: number
    totalQueueCount: number
  }>
  inventory: {
    totalMedicines: number
    lowStockMedicines: number
    outOfStockMedicines: number
    totalValue: number
  }
  systemHealth: {
    totalActiveUsers: number
    totalDepartments: number
    systemLoad: number
  }
}

// Chart data interfaces
interface ChartData {
  name: string
  value: number
  fill?: string
}

interface TimeSeriesData {
  name: string
  patients: number
  revenue: number
  prescriptions: number
}

export default function DynamicDashboard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStatistics()
    const interval = setInterval(fetchStatistics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStatistics(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  const getTrendIcon = (value: string) => {
    const numValue = parseFloat(value)
    if (numValue > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (numValue < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  const getSystemLoadColor = (load: number) => {
    if (load < 30) return 'text-green-600'
    if (load < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Generate chart data from statistics
  const generateQueueComparisonData = () => {
    if (!statistics) return []
    
    return [
      {
        name: 'OPD Queue',
        waiting: statistics.queues.opd.waiting,
        serving: statistics.queues.opd.serving,
        completed: statistics.queues.opd.completed
      },
      {
        name: 'Pharmacy Queue',
        waiting: statistics.queues.pharmacy.waiting,
        serving: statistics.queues.pharmacy.serving,
        completed: statistics.queues.pharmacy.completed
      }
    ]
  }

  const generateDepartmentQueueData = () => {
    if (!statistics) return []
    
    return statistics.departments
      .filter(dept => dept.totalQueueCount > 0)
      .map(dept => ({
        name: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name,
        opd: dept.opdQueueCount,
        pharmacy: dept.pharmacyQueueCount,
        total: dept.totalQueueCount
      }))
  }

  const generateInventoryStatusData = () => {
    if (!statistics) return []
    
    return [
      { name: 'In Stock', value: statistics.inventory.totalMedicines - statistics.inventory.lowStockMedicines - statistics.inventory.outOfStockMedicines, fill: '#22c55e' },
      { name: 'Low Stock', value: statistics.inventory.lowStockMedicines, fill: '#f59e0b' },
      { name: 'Out of Stock', value: statistics.inventory.outOfStockMedicines, fill: '#ef4444' }
    ]
  }

  const generateRevenueTrendData = () => {
    // Generate sample trend data based on current statistics
    const baseRevenue = statistics?.revenue.total || 100000
    const todayRevenue = statistics?.revenue.today || 5000
    
    return [
      { name: 'Mon', revenue: baseRevenue * 0.15, patients: 25 },
      { name: 'Tue', revenue: baseRevenue * 0.18, patients: 30 },
      { name: 'Wed', revenue: baseRevenue * 0.20, patients: 35 },
      { name: 'Thu', revenue: baseRevenue * 0.22, patients: 40 },
      { name: 'Fri', revenue: baseRevenue * 0.15, patients: 28 },
      { name: 'Sat', revenue: todayRevenue, patients: 20 },
      { name: 'Sun', revenue: todayRevenue * 0.8, patients: 15 }
    ]
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Failed to load statistics'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.patients.total)}</div>
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              {getTrendIcon(statistics.patients.growthToday)}
              <span>{statistics.patients.growthToday}% today</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.revenue.total)}</div>
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              {getTrendIcon(statistics.revenue.growthToday)}
              <span>{statistics.revenue.growthToday}% today</span>
            </p>
          </CardContent>
        </Card>

        {/* Active Prescriptions */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.prescriptions.total)}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.prescriptions.today} new today
            </p>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSystemLoadColor(statistics.systemHealth.systemLoad)}`}>
              {statistics.systemHealth.systemLoad.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.systemHealth.totalActiveUsers} active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Tabs defaultValue="queues" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="queues" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPD Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <span>OPD Queue Status</span>
                </CardTitle>
                <CardDescription>Current outpatient department queue status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{statistics.queues.opd.waiting}</div>
                    <div className="text-sm text-gray-600">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{statistics.queues.opd.serving}</div>
                    <div className="text-sm text-gray-600">Serving</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{statistics.queues.opd.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Wait Time</span>
                    <span className="font-medium">{statistics.queues.opd.averageWaitTime} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pharmacy Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span>Pharmacy Queue Status</span>
                </CardTitle>
                <CardDescription>Current pharmacy queue status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{statistics.queues.pharmacy.waiting}</div>
                    <div className="text-sm text-gray-600">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{statistics.queues.pharmacy.serving}</div>
                    <div className="text-sm text-gray-600">Serving</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{statistics.queues.pharmacy.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Wait Time</span>
                    <span className="font-medium">{statistics.queues.pharmacy.averageWaitTime} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Comparison Chart - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span>Real-time Queue Comparison</span>
              </CardTitle>
              <CardDescription>Live comparison of queue status across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Interactive charts coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Revenue Overview</span>
                </CardTitle>
                <CardDescription>Financial performance summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="text-xl font-bold">{formatCurrency(statistics.revenue.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Today's Revenue</span>
                    <span className="font-medium">{formatCurrency(statistics.revenue.today)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Growth Rate</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(statistics.revenue.growthToday)}
                      <span className="font-medium">{statistics.revenue.growthToday}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Receipt Statistics</span>
                </CardTitle>
                <CardDescription>Transaction summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Receipts</span>
                    <span className="text-xl font-bold">{formatNumber(statistics.receipts.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Today's Receipts</span>
                    <span className="font-medium">{formatNumber(statistics.receipts.today)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Transaction</span>
                    <span className="font-medium">
                      {statistics.receipts.total > 0 
                        ? formatCurrency(statistics.revenue.total / statistics.receipts.total)
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                  <span>Medicine Inventory</span>
                </CardTitle>
                <CardDescription>Current stock status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Medicines</span>
                    <span className="text-xl font-bold">{formatNumber(statistics.inventory.totalMedicines)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Low Stock</span>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {formatNumber(statistics.inventory.lowStockMedicines)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Out of Stock</span>
                    <Badge variant="destructive">
                      {formatNumber(statistics.inventory.outOfStockMedicines)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Total Value</span>
                    <span className="font-bold text-green-600">{formatCurrency(statistics.inventory.totalValue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Status Chart - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span>Stock Status Distribution</span>
                </CardTitle>
                <CardDescription>Visual breakdown of medicine stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Interactive charts coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>Department Statistics</span>
              </CardTitle>
              <CardDescription>Queue distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.departments
                  .sort((a, b) => b.totalQueueCount - a.totalQueueCount)
                  .map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-gray-600" />
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-sm text-gray-500">
                            OPD: {dept.opdQueueCount} | Pharmacy: {dept.pharmacyQueueCount}
                          </div>
                        </div>
                      </div>
                      <Badge variant={dept.totalQueueCount > 10 ? 'default' : 'secondary'}>
                        {dept.totalQueueCount} active
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-500">Advanced charts and analytics coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}