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
  Building, 
  Palette, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Save,
  Upload,
  CheckCircle,
  Settings,
  AlertTriangle
} from "lucide-react"

interface HospitalSettings {
  id: string
  hospitalName: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  address?: string
  phone?: string
  email?: string
  website?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function HospitalSettingsManager() {
  const [settings, setSettings] = useState<HospitalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    hospitalName: "",
    logoUrl: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    address: "",
    phone: "",
    email: "",
    website: ""
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const settingsData = data.data.settings
          setSettings(settingsData)
          setFormData({
            hospitalName: settingsData.hospitalName,
            logoUrl: settingsData.logoUrl || "",
            primaryColor: settingsData.primaryColor,
            secondaryColor: settingsData.secondaryColor,
            address: settingsData.address || "",
            phone: settingsData.phone || "",
            email: settingsData.email || "",
            website: settingsData.website || ""
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      setError("Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setSettings(data.data.settings)
        setSuccess("Settings updated successfully")
        // Refresh the page to apply new settings
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(data.error || "Failed to update settings")
      }
    } catch (error) {
      setError("Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real implementation, you would upload to a cloud storage
      // For now, we'll create a placeholder URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData({
          ...formData,
          logoUrl: e.target?.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const colorPresets = [
    { name: "Blue", primary: "#3b82f6", secondary: "#64748b" },
    { name: "Green", primary: "#10b981", secondary: "#6b7280" },
    { name: "Purple", primary: "#8b5cf6", secondary: "#6b7280" },
    { name: "Red", primary: "#ef4444", secondary: "#6b7280" },
    { name: "Teal", primary: "#14b8a6", secondary: "#6b7280" }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Hospital Settings</span>
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
            <Building className="h-5 w-5" />
            <span>Hospital Settings</span>
            <Badge variant="outline" className="ml-2">
              White Label
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

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hospitalName">Hospital Name *</Label>
                <Input
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                  placeholder="Enter hospital name"
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                    placeholder="Enter logo URL or upload"
                  />
                  <div className="relative">
                    <Input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {formData.logoUrl && (
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <img
                  src={formData.logoUrl}
                  alt="Hospital Logo"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <p className="text-sm font-medium">Logo Preview</p>
                  <p className="text-xs text-gray-500">Click upload to change</p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1-555-0123"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="info@hospital.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://hospital.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="123 Hospital Road, Medical District"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Color Theme */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Color Theme
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                    placeholder="#64748b"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary
                    })}
                    className="flex items-center space-x-2"
                  >
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span>{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <Label className="text-sm font-medium mb-2 block">Preview</Label>
              <div className="space-y-2">
                <div
                  className="p-3 rounded text-white font-medium"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Primary Color: {formData.hospitalName}
                </div>
                <div
                  className="p-3 rounded text-white"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  Secondary Color: Sample Text
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}