"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { useSocket } from "@/hooks/useSocket"
import { 
  Ticket, 
  MessageSquare, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  UserPlus,
  Search,
  Filter,
  Reply,
  Eye,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Tag,
  Bell
} from "lucide-react"
import { format } from "date-fns"

interface SupportTicket {
  id: string
  ticketNumber: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  userId?: string
  patientId?: string
  assignedTo?: string
  email?: string
  phone?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  patient?: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  responses: SupportTicketResponse[]
}

interface SupportTicketResponse {
  id: string
  content: string
  isInternal: boolean
  createdAt: string
  user?: {
    id: string
    name: string
  }
}

interface SupportManagementProps {
  userRole?: string
  userId?: string
}

export default function SupportManagement({ userRole, userId }: SupportManagementProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseContent, setResponseContent] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: ""
  })

  useEffect(() => {
    fetchTickets()
  }, [filters])

  // Socket integration for real-time notifications
  const { toast } = useToast()
  const socket = useSocket()

  useEffect(() => {
    if (userRole && socket.socket) {
      // Join support room for real-time notifications
      socket.joinSupportRoom(userRole)

      // Listen for new support tickets
      socket.onSupportTicket((data) => {
        toast({
          title: "New Support Ticket",
          description: `Ticket ${data.ticket.ticketNumber}: ${data.ticket.title}`,
          action: (
            <ToastAction altText="View ticket" onClick={() => fetchTickets()}>
              View
            </ToastAction>
          ),
        })
        fetchTickets()
      })

      // Listen for new ticket responses
      socket.onTicketResponse((data) => {
        toast({
          title: "New Ticket Response",
          description: `Response added to ticket ${data.ticketId}`,
        })
        fetchTickets()
      })
    }

    return () => {
      if (socket.socket) {
        socket.offSupportTicket(() => {})
        socket.offTicketResponse(() => {})
      }
    }
  }, [userRole, socket.socket])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status && filters.status !== "all") params.append("status", filters.status)
      if (filters.category && filters.category !== "all") params.append("category", filters.category)
      if (filters.priority && filters.priority !== "all") params.append("priority", filters.priority)
      if (userRole === "STAFF" || userRole === "NURSE") {
        params.append("assignedTo", userId || "")
      }

      const response = await fetch(`/api/support/tickets?${params}`)
      if (!response.ok) throw new Error("Failed to fetch tickets")

      const data = await response.json()
      if (data.success) {
        setTickets(data.data.tickets || [])
      } else {
        setError(data.error || "Failed to fetch tickets")
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
      setError("Failed to fetch tickets")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTicket = async (ticketId: string, assigneeId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: assigneeId })
      })

      if (response.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error("Failed to assign ticket:", error)
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchTickets()
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    }
  }

  const handleAddResponse = async () => {
    if (!selectedTicket || !responseContent.trim()) return

    try {
      const response = await fetch("/api/support/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          userId,
          content: responseContent,
          isInternal
        })
      })

      if (response.ok) {
        setResponseContent("")
        setShowResponseDialog(false)
        fetchTickets()
      }
    } catch (error) {
      console.error("Failed to add response:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return { variant: "secondary" as const, label: "Open" }
      case "IN_PROGRESS": return { variant: "default" as const, label: "In Progress" }
      case "RESOLVED": return { variant: "default" as const, label: "Resolved" }
      case "CLOSED": return { variant: "outline" as const, label: "Closed" }
      default: return { variant: "outline" as const, label: status }
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "LOW": return { variant: "outline" as const, label: "Low" }
      case "MEDIUM": return { variant: "secondary" as const, label: "Medium" }
      case "HIGH": return { variant: "default" as const, label: "High" }
      case "URGENT": return { variant: "destructive" as const, label: "Urgent" }
      default: return { variant: "outline" as const, label: priority }
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "GENERAL": return { variant: "outline" as const, label: "General" }
      case "TECHNICAL": return { variant: "secondary" as const, label: "Technical" }
      case "BILLING": return { variant: "default" as const, label: "Billing" }
      case "MEDICAL": return { variant: "default" as const, label: "Medical" }
      case "QUEUE": return { variant: "default" as const, label: "Queue" }
      case "PHARMACY": return { variant: "default" as const, label: "Pharmacy" }
      default: return { variant: "outline" as const, label: category }
    }
  }

  const openTickets = tickets.filter(t => t.status === "OPEN")
  const inProgressTickets = tickets.filter(t => t.status === "IN_PROGRESS")
  const resolvedTickets = tickets.filter(t => t.status === "RESOLVED")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Management</h2>
          <p className="text-gray-600">Manage customer support tickets and responses</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets.length}</div>
            <p className="text-xs text-muted-foreground">Being handled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedTickets.length}</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">All tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                  <SelectItem value="MEDICAL">Medical</SelectItem>
                  <SelectItem value="QUEUE">Queue</SelectItem>
                  <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Management */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Support Tickets</CardTitle>
              <CardDescription>View and manage all support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => {
                      const statusBadge = getStatusBadge(ticket.status)
                      const priorityBadge = getPriorityBadge(ticket.priority)
                      const categoryBadge = getCategoryBadge(ticket.category)

                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {ticket.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={categoryBadge.variant}>
                              {categoryBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityBadge.variant}>
                              {priorityBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(ticket.createdAt), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket)
                                  setShowTicketDialog(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicket(ticket)
                                  setShowResponseDialog(true)
                                }}
                              >
                                <Reply className="w-4 h-4" />
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
        </TabsContent>

        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Open Tickets</CardTitle>
              <CardDescription>Tickets awaiting assignment and action</CardDescription>
            </CardHeader>
            <CardContent>
              {openTickets.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No open tickets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {openTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-yellow-500">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{ticket.title}</CardTitle>
                            <CardDescription>{ticket.ticketNumber}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getPriorityBadge(ticket.priority).variant}>
                              {getPriorityBadge(ticket.priority).label}
                            </Badge>
                            <Badge variant={getCategoryBadge(ticket.category).variant}>
                              {getCategoryBadge(ticket.category).label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">{ticket.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Created {format(new Date(ticket.createdAt), "MMM dd, HH:mm")}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setShowTicketDialog(true)
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                            >
                              Start Working
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in_progress">
          <Card>
            <CardHeader>
              <CardTitle>Tickets In Progress</CardTitle>
              <CardDescription>Tickets currently being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-500">No tickets in progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgressTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{ticket.title}</CardTitle>
                            <CardDescription>{ticket.ticketNumber}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getPriorityBadge(ticket.priority).variant}>
                              {getPriorityBadge(ticket.priority).label}
                            </Badge>
                            <Badge variant={getCategoryBadge(ticket.category).variant}>
                              {getCategoryBadge(ticket.category).label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">{ticket.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Assigned to: {ticket.assignee?.name || "Unassigned"}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setShowResponseDialog(true)
                              }}
                            >
                              Add Response
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ticket.id, "RESOLVED")}
                            >
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Tickets</CardTitle>
              <CardDescription>Recently resolved tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {resolvedTickets.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No resolved tickets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{ticket.title}</CardTitle>
                            <CardDescription>{ticket.ticketNumber}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant={getPriorityBadge(ticket.priority).variant}>
                              {getPriorityBadge(ticket.priority).label}
                            </Badge>
                            <Badge variant={getCategoryBadge(ticket.category).variant}>
                              {getCategoryBadge(ticket.category).label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">{ticket.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Resolved {ticket.resolvedAt ? format(new Date(ticket.resolvedAt), "MMM dd, HH:mm") : "Recently"}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setShowTicketDialog(true)
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Ticket className="w-5 h-5" />
              <span>Ticket Details</span>
            </DialogTitle>
            <DialogDescription>
              View complete ticket information and responses
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Ticket ID</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadge(selectedTicket.status).variant}>
                    {getStatusBadge(selectedTicket.status).label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge variant={getPriorityBadge(selectedTicket.priority).variant}>
                    {getPriorityBadge(selectedTicket.priority).label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <Badge variant={getCategoryBadge(selectedTicket.category).variant}>
                    {getCategoryBadge(selectedTicket.category).label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Title</Label>
                <p className="text-sm text-gray-600">{selectedTicket.title}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                {selectedTicket.user && (
                  <div>
                    <Label className="text-sm font-medium">User</Label>
                    <p className="text-sm text-gray-600">{selectedTicket.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedTicket.user.email}</p>
                  </div>
                )}
                {selectedTicket.patient && (
                  <div>
                    <Label className="text-sm font-medium">Patient</Label>
                    <p className="text-sm text-gray-600">
                      {selectedTicket.patient.firstName} {selectedTicket.patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedTicket.patient.phone}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedTicket.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTicket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Responses */}
              <div>
                <Label className="text-sm font-medium">Responses ({selectedTicket.responses.length})</Label>
                <div className="space-y-3 mt-2">
                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-lg border ${
                        response.isInternal ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{response.user?.name || "System"}</span>
                          {response.isInternal && (
                            <Badge variant="outline" className="text-xs">Internal</Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(response.createdAt), "MMM dd, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowTicketDialog(false)
                  setShowResponseDialog(true)
                }}>
                  Add Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Reply className="w-5 h-5" />
              <span>Add Response</span>
            </DialogTitle>
            <DialogDescription>
              Add a response to ticket {selectedTicket?.ticketNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="response">Response</Label>
              <Textarea
                id="response"
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Type your response..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="internal">Internal note (not visible to customer)</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddResponse} disabled={!responseContent.trim()}>
                Send Response
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}