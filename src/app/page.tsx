"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Stethoscope, Package, Monitor, Settings, Plus, FileText, Clock, CheckCircle, AlertCircle, LogOut, UserPlus, Heart, Activity, Prescription, MessageSquare } from "lucide-react"
import PatientRegistrationForm from "@/components/PatientRegistrationForm"
import OPDQueueManagement from "@/components/OPDQueueManagement"
import PharmacyQueueManagement from "@/components/PharmacyQueueManagement"
import PharmacyInventoryManagement from "@/components/PharmacyInventoryManagement"
import PatientHealthDetails from "@/components/PatientHealthDetails"
import PrescriptionManagement from "@/components/PrescriptionManagement"
import DynamicDashboard from "@/components/DynamicDashboard"
import AdminTabbedPanel from "@/components/AdminTabbedPanel"
import CallNextPatient from "@/components/CallNextPatient"
import SupportManagement from "@/components/SupportManagement"
import Chatbot from "@/components/Chatbot"
import { useAuth } from "@/hooks/useAuth"
import { useHospitalSettings } from "@/hooks/useHospitalSettings"

export default function HospitalDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showChatbot, setShowChatbot] = useState(false)
  const router = useRouter()
  const { user, loading, logout, isAuthenticated } = useAuth()
  const { settings: hospitalSettings, loading: settingsLoading } = useHospitalSettings()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect to login
  }

  const handleLogout = () => {
    logout()
  }

  const getAvailableTabs = () => {
    const tabs = [
      { value: "dashboard", label: "Dashboard", icon: Monitor },
    ]

    // Registration tab for Staff, Nurse, Admin, Super Admin
    if (['STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "registration", label: "Registration", icon: Plus })
    }

    // OPD Queue tab for Doctors, Staff, Nurse, Admin, Super Admin
    if (['DOCTOR', 'STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "opd", label: "OPD Queue", icon: Stethoscope })
    }

    // Pharmacy tab for Pharmacists, Admin, Super Admin
    if (['PHARMACIST', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "pharmacy", label: "Pharmacy", icon: Package })
    }

    // Pharmacy Inventory tab for Pharmacists, Admin, Super Admin
    if (['PHARMACIST', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "inventory", label: "Inventory", icon: Activity })
    }

    // Health Details tab for Doctors, Staff, Admin, Super Admin
    if (['DOCTOR', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "health", label: "Health", icon: Heart })
    }

    // Prescription tab for Doctors, Admin, Super Admin
    if (['DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "prescription", label: "Prescription", icon: FileText })
    }

    // Admin tab for Admin, Super Admin
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "admin", label: "Admin", icon: Settings })
    }

    // Support Management tab for Staff, Nurse, Admin, Super Admin
    if (['STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      tabs.push({ value: "support", label: "Support", icon: MessageSquare })
    }

    return tabs
  }

  const availableTabs = getAvailableTabs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {hospitalSettings?.hospitalName || "Hospital Queue Management"}
                </h1>
                <p className="text-sm text-gray-500">Queue Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                System Active
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full gap-1" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
            {availableTabs.map((tab, index) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center justify-center p-2 sm:p-3 text-xs sm:text-sm">
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {user.role === 'SUPER_ADMIN' ? (
              <DynamicDashboard />
            ) : (
              <>
                {/* Welcome Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Welcome, {user.firstName}!</span>
                    </CardTitle>
                    <CardDescription>
                      You are logged in as {user.role} {user.department && `in ${user.department.name}`}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">Total Patients Today</CardTitle>
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="text-xl sm:text-2xl font-bold">156</div>
                      <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">OPD Queue</CardTitle>
                      <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="text-xl sm:text-2xl font-bold">24</div>
                      <p className="text-xs text-muted-foreground">Currently waiting</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">Pharmacy Queue</CardTitle>
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="text-xl sm:text-2xl font-bold">18</div>
                      <p className="text-xs text-muted-foreground">Currently waiting</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="text-xs sm:text-sm font-medium">Avg. Wait Time</CardTitle>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="text-xl sm:text-2xl font-bold">32 min</div>
                      <p className="text-xs text-muted-foreground">Across all departments</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Department-specific Stats */}
                {user.department && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>{user.department.name} Department</span>
                      </CardTitle>
                      <CardDescription>
                        Real-time statistics for your department
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-sm text-gray-600">Waiting</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">3</div>
                          <div className="text-sm text-gray-600">Serving</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">8</div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">25</div>
                          <div className="text-sm text-gray-600">Avg Wait (min)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {['STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <span className="text-xs sm:text-sm">New Patient Registration</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Register a new patient and generate queue token
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <Button 
                          className="w-full text-xs sm:text-sm py-2 sm:py-3" 
                          onClick={() => setActiveTab("registration")}
                        >
                          Register Patient
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                      <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                        <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <span className="text-xs sm:text-sm">Queue Display</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        View real-time queue status for patients
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                      <Link href="/queue-display" target="_blank">
                        <Button className="w-full text-xs sm:text-sm py-2 sm:py-3" variant="outline">
                          View Queue Display
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {['DOCTOR', 'STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                          <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <span className="text-xs sm:text-sm">Call Next Patient</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Select a queue to call the next patient
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <CallNextPatient userRole={user.role} />
                      </CardContent>
                    </Card>
                  )}

                  {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                          <span className="text-xs sm:text-sm">Generate Receipt</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Create professional receipts for patients
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <Button 
                          className="w-full text-xs sm:text-sm py-2 sm:py-3" 
                          variant="outline"
                          onClick={() => setActiveTab("admin")}
                        >
                          Generate Receipt
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer sm:col-span-2 lg:col-span-1">
                      <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6">
                        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                          <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                          <span className="text-xs sm:text-sm">User Management</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Manage system users and permissions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <Button 
                          className="w-full text-xs sm:text-sm py-2 sm:py-3" 
                          variant="outline"
                          onClick={() => setActiveTab("admin")}
                        >
                          Manage Users
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {['STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="registration">
              <PatientRegistrationForm />
            </TabsContent>
          )}

          {['DOCTOR', 'STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="opd">
              <OPDQueueManagement />
            </TabsContent>
          )}

          {['PHARMACIST', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="pharmacy">
              <PharmacyQueueManagement />
            </TabsContent>
          )}

          {['PHARMACIST', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="inventory">
              <PharmacyInventoryManagement />
            </TabsContent>
          )}

          {['DOCTOR', 'STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="health">
              <PatientHealthDetails />
            </TabsContent>
          )}

          {['DOCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="prescription">
              <PrescriptionManagement />
            </TabsContent>
          )}

          {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="admin">
              <AdminTabbedPanel />
            </TabsContent>
          )}

          {['STAFF', 'NURSE', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <TabsContent value="support">
              <SupportManagement userRole={user.role} userId={user.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Chatbot Component */}
      <Chatbot 
        userId={user.id} 
        userRole={user.role} 
        isOpen={showChatbot}
        onToggle={setShowChatbot}
      />
      
      {/* Chat Toggle Button */}
      <Button
        className="fixed bottom-4 right-4 z-40 rounded-full w-14 h-14 p-0 shadow-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => setShowChatbot(!showChatbot)}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>
    </div>
  )
}