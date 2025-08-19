"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Megaphone,
  Settings,
  Save
} from "lucide-react"

interface StaffNotice {
  id: string
  title: string
  content: string
  type: "INFO" | "WARNING" | "URGENT" | "ANNOUNCEMENT"
  targetRole?: string
  isActive: boolean
  priority: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export default function StaffNoticeManager() {
  const [notices, setNotices] = useState<StaffNotice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAddNotice, setShowAddNotice] = useState(false)
  const [editingNotice, setEditingNotice] = useState<StaffNotice | null>(null)
  const [showEditNotice, setShowEditNotice] = useState(false)

  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    type: "INFO" as const,
    targetRole: "",
    priority: 0
  })

  const [editNoticeData, setEditNoticeData] = useState({
    id: "",
    title: "",
    content: "",
    type: "INFO" as const,
    targetRole: "",
    priority: 0,
    isActive: true
  })

  const noticeTypes = [
    { value: "INFO", label: "Information", icon: Info, color: "bg-blue-100 text-blue-800" },
    { value: "WARNING", label: "Warning", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800" },
    { value: "URGENT", label: "Urgent", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
    { value: "ANNOUNCEMENT", label: "Announcement", icon: Megaphone, color: "bg-purple-100 text-purple-800" }
  ]

  const targetRoles = [
    { value: "ALL", label: "All Staff" },
    { value: "DOCTOR", label: "Doctors" },
    { value: "NURSE", label: "Nurses" },
    { value: "PHARMACIST", label: "Pharmacists" },
    { value: "STAFF", label: "Staff" },
    { value: "ADMIN", label: "Administrators" }
  ]

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const response = await fetch("/api/notices")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotices(data.data.notices || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch notices:", error)
      setError("Failed to fetch notices")
    } finally {
      setLoading(false)
    }
  }

  const handleAddNotice = async () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      setError("Title and content are required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newNotice,
          createdBy: "admin" // In real app, get from user session
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setShowAddNotice(false)
        setNewNotice({
          title: "", content: "", type: "INFO", targetRole: "", priority: 0
        })
        setSuccess("Notice created successfully")
        fetchNotices()
      } else {
        setError(data.error || "Failed to create notice")
      }
    } catch (error) {
      setError("Failed to create notice")
    } finally {
      setSaving(false)
    }
  }

  const handleEditNotice = (notice: StaffNotice) => {
    setEditingNotice(notice)
    setEditNoticeData({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      type: notice.type,
      targetRole: notice.targetRole || "",
      priority: notice.priority,
      isActive: notice.isActive
    })
    setShowEditNotice(true)
  }

  const handleUpdateNotice = async () => {
    if (!editNoticeData.title.trim() || !editNoticeData.content.trim()) {
      setError("Title and content are required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/notices/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editNoticeData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setShowEditNotice(false)
        setEditingNotice(null)
        setSuccess("Notice updated successfully")
        fetchNotices()
      } else {
        setError(data.error || "Failed to update notice")
      }
    } catch (error) {
      setError("Failed to update notice")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) {
      return
    }

    try {
      const response = await fetch(`/api/notices/delete?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Notice deleted successfully")
        fetchNotices()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete notice")
      }
    } catch (error) {
      setError("Failed to delete notice")
    }
  }

  const getNoticeTypeInfo = (type: string) => {
    return noticeTypes.find(nt => nt.value === type) || noticeTypes[0]
  }

  const getTargetRoleLabel = (role?: string) => {
    if (!role) return "All Staff"
    const targetRole = targetRoles.find(tr => tr.value === role)
    return targetRole ? targetRole.label : "All Staff"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Staff Notices</span>
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Staff Notices</span>
            </div>
            <Dialog open={showAddNotice} onOpenChange={setShowAddNotice}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Notice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Notice</DialogTitle>
                  <DialogDescription>
                    Create a new staff notice that will appear on the queue display
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                      placeholder="Enter notice title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={newNotice.content}
                      onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                      placeholder="Enter notice content"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={newNotice.type} onValueChange={(value: any) => setNewNotice({...newNotice, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {noticeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="targetRole">Target Role</Label>
                      <Select value={newNotice.targetRole} onValueChange={(value) => setNewNotice({...newNotice, targetRole: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target role" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetRoles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority (0-10, higher = more important)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      max="10"
                      value={newNotice.priority}
                      onChange={(e) => setNewNotice({...newNotice, priority: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddNotice(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddNotice} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Creating..." : "Create Notice"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {notices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No staff notices found</p>
                <p className="text-sm">Create your first notice to inform staff members</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map((notice) => {
                  const noticeType = getNoticeTypeInfo(notice.type)
                  const NoticeIcon = noticeType.icon
                  
                  return (
                    <div key={notice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <NoticeIcon className="h-5 w-5" />
                            <h3 className="font-semibold text-lg">{notice.title}</h3>
                            <Badge className={noticeType.color}>
                              {noticeType.label}
                            </Badge>
                            {!notice.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-gray-700 mb-3">{notice.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Target: {getTargetRoleLabel(notice.targetRole)}</span>
                            <span>Priority: {notice.priority}</span>
                            <span>Created: {new Date(notice.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditNotice(notice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteNotice(notice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Notice Dialog */}
      <Dialog open={showEditNotice} onOpenChange={setShowEditNotice}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>
              Update staff notice details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editNoticeData.title}
                onChange={(e) => setEditNoticeData({...editNoticeData, title: e.target.value})}
                placeholder="Enter notice title"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={editNoticeData.content}
                onChange={(e) => setEditNoticeData({...editNoticeData, content: e.target.value})}
                placeholder="Enter notice content"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={editNoticeData.type} onValueChange={(value: any) => setEditNoticeData({...editNoticeData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noticeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-targetRole">Target Role</Label>
                <Select value={editNoticeData.targetRole} onValueChange={(value) => setEditNoticeData({...editNoticeData, targetRole: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority">Priority (0-10, higher = more important)</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  min="0"
                  max="10"
                  value={editNoticeData.priority}
                  onChange={(e) => setEditNoticeData({...editNoticeData, priority: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editNoticeData.isActive}
                  onCheckedChange={(checked) => setEditNoticeData({...editNoticeData, isActive: checked})}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditNotice(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNotice} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Updating..." : "Update Notice"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}