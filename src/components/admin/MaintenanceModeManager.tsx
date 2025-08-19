"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Power,
  Save
} from "lucide-react"

interface MaintenanceMode {
  id: string
  isEnabled: boolean
  message: string
  startTime?: string
  endTime?: string
  createdAt: string
  updatedAt: string
}

export default function MaintenanceModeManager() {
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchMaintenanceStatus()
  }, [])

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch("/api/maintenance/status")
      if (response.ok) {
        const data = await response.json()
        setMaintenance(data)
        if (data) {
          setMessage(data.message || "")
          setStartTime(data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : "")
          setEndTime(data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : "")
        }
      }
    } catch (error) {
      console.error("Failed to fetch maintenance status:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMaintenance = async (enabled: boolean) => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/maintenance/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEnabled: enabled,
          message: message || "System is under maintenance. Please check back later.",
          startTime: startTime || null,
          endTime: endTime || null,
          createdBy: "admin" // In real app, get from user session
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMaintenance(data)
        setSuccess(`Maintenance mode ${enabled ? "enabled" : "disabled"} successfully`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to toggle maintenance mode")
      }
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error)
      setError("Failed to toggle maintenance mode")
    } finally {
      setSaving(false)
    }
  }

  const updateMaintenanceSettings = async () => {
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/maintenance/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: maintenance?.id,
          message,
          startTime: startTime || null,
          endTime: endTime || null,
          createdBy: "admin" // In real app, get from user session
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMaintenance(data)
        setSuccess("Maintenance settings updated successfully")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update maintenance settings")
      }
    } catch (error) {
      console.error("Failed to update maintenance settings:", error)
      setError("Failed to update maintenance settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Maintenance Mode</span>
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
            <Settings className="h-5 w-5" />
            <span>Maintenance Mode</span>
            {maintenance?.isEnabled && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {!maintenance?.isEnabled && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status and Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${maintenance?.isEnabled ? "bg-red-100" : "bg-green-100"}`}>
                {maintenance?.isEnabled ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  Maintenance mode is {maintenance?.isEnabled ? "enabled" : "disabled"}
                </h3>
                <p className="text-sm text-gray-600">
                  {maintenance?.isEnabled 
                    ? "New patients cannot join the queue and queue operations are suspended"
                    : "System is operating normally"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={maintenance?.isEnabled || false}
                onCheckedChange={toggleMaintenance}
                disabled={saving}
              />
              <span className="text-sm font-medium">
                {maintenance?.isEnabled ? "Disable" : "Enable"}
              </span>
            </div>
          </div>

          {/* Maintenance Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Maintenance Message</Label>
              <Textarea
                id="message"
                placeholder="Enter maintenance message to display to users"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time (Optional)</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={updateMaintenanceSettings}
              disabled={saving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          {/* Alerts */}
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

          {/* Current Status Details */}
          {maintenance && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Current Status Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(maintenance.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Power className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={maintenance.isEnabled ? "destructive" : "secondary"}>
                    {maintenance.isEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}