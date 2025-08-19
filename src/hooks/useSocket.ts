"use client"

import { useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"

export const useSocket = (url: string = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000") => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(url, {
      transports: ["websocket", "polling"],
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [url])

  const joinSupportRoom = (userRole: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-support-room", userRole)
    }
  }

  const joinDepartmentRoom = (departmentId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join-department-room", departmentId)
    }
  }

  const onSupportTicket = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("new-support-ticket", callback)
    }
  }

  const onTicketResponse = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("new-ticket-response", callback)
    }
  }

  const onQueueUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on("queue-updated", callback)
    }
  }

  const offSupportTicket = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off("new-support-ticket", callback)
    }
  }

  const offTicketResponse = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off("new-ticket-response", callback)
    }
  }

  const offQueueUpdate = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off("queue-updated", callback)
    }
  }

  return {
    socket: socketRef.current,
    joinSupportRoom,
    joinDepartmentRoom,
    onSupportTicket,
    onTicketResponse,
    onQueueUpdate,
    offSupportTicket,
    offTicketResponse,
    offQueueUpdate,
  }
}