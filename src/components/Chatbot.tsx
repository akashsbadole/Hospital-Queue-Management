"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Ticket,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  X
} from "lucide-react"
import { format } from "date-fns"

interface ChatMessage {
  id: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  content: string
  timestamp: Date
  metadata?: any
}

interface ChatbotProps {
  userId?: string
  patientId?: string
  userRole?: string
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
}

export default function Chatbot({ userId, patientId, userRole, isOpen: propIsOpen, onToggle }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [chatMode, setChatMode] = useState<"ai" | "agent">("ai")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use controlled state if props are provided
  const controlledIsOpen = propIsOpen !== undefined ? propIsOpen : isOpen
  const controlledSetIsOpen = onToggle || setIsOpen

  useEffect(() => {
    if (controlledIsOpen) {
      initializeConversation()
    }
  }, [controlledIsOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initializeConversation = async () => {
    try {
      const response = await fetch("/api/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sessionId: generateSessionId()
        })
      })

      const data = await response.json()
      if (data.success) {
        setConversationId(data.data.conversation.id)
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: "welcome",
          role: "ASSISTANT",
          content: "Hello! I'm your hospital assistant. How can I help you today? You can ask me about queue status, appointments, medical services, or switch to speak with a real agent if needed.",
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error("Failed to initialize conversation:", error)
      setError("Failed to start conversation")
    }
  }

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "USER",
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError("")

    try {
      let assistantResponse: ChatMessage

      if (chatMode === "ai") {
        // First, try to get response from knowledge base
        const knowledgeResponse = await fetch("/api/chat/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: inputMessage,
            userId,
            patientId
          })
        })

        const knowledgeData = await knowledgeResponse.json()

        if (knowledgeData.success && knowledgeData.data.answer) {
          // Use knowledge base response
          assistantResponse = {
            id: `assistant_${Date.now()}`,
            role: "ASSISTANT",
            content: knowledgeData.data.answer,
            timestamp: new Date(),
            metadata: { source: "knowledge_base", category: knowledgeData.data.category }
          }
        } else {
          // Use AI response
          const aiResponse = await fetch("/api/chat/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: inputMessage,
              conversationId,
              messages: messages.map(m => ({ role: m.role, content: m.content }))
            })
          })

          const aiData = await aiResponse.json()
          
          if (aiData.success) {
            assistantResponse = {
              id: `assistant_${Date.now()}`,
              role: "ASSISTANT",
              content: aiData.data.response,
              timestamp: new Date(),
              metadata: { source: "ai" }
            }
          } else {
            throw new Error(aiData.error || "Failed to get AI response")
          }
        }
      } else {
        // Agent mode - create a support ticket
        try {
          const ticketResponse = await fetch("/api/support/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Live Chat Request",
              description: inputMessage,
              category: "GENERAL",
              priority: "MEDIUM",
              userId: userId || null,
              patientId: patientId || null
            })
          })

          const ticketData = await ticketResponse.json()
          
          if (ticketData.success) {
            assistantResponse = {
              id: `assistant_${Date.now()}`,
              role: "ASSISTANT",
              content: `Thank you for your message. I've created a support ticket (ID: ${ticketData.data.ticket.ticketNumber}) and a real agent will contact you shortly. Your request has been prioritized and you should receive a response within 5-10 minutes.`,
              timestamp: new Date(),
              metadata: { source: "agent", ticketId: ticketData.data.ticket.id }
            }
          } else {
            // Handle API error
            assistantResponse = {
              id: `error_${Date.now()}`,
              role: "ASSISTANT",
              content: `I apologize, but I'm having trouble connecting you with a real agent right now. Error: ${ticketData.error || 'Unknown error'}. Please try again in a few moments or use the AI Assistant for immediate help.`,
              timestamp: new Date(),
              metadata: { source: "agent", error: true }
            }
          }
        } catch (error) {
          console.error("Agent mode error:", error)
          // Handle network error
          assistantResponse = {
            id: `error_${Date.now()}`,
            role: "ASSISTANT",
            content: `I'm sorry, but I'm experiencing technical difficulties connecting you with a real agent. Please check your internet connection and try again, or use the AI Assistant for immediate assistance.`,
            timestamp: new Date(),
            metadata: { source: "agent", error: true }
          }
        }
      }

      setMessages(prev => [...prev, assistantResponse])

      // Save messages to database
      if (conversationId) {
        await saveMessagesToDatabase([userMessage, assistantResponse])
      }

    } catch (error) {
      console.error("Failed to send message:", error)
      setError("Failed to get response. Please try again.")
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "ASSISTANT",
        content: "I'm sorry, I'm having trouble responding right now. Please try again later or create a support ticket for assistance.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const saveMessagesToDatabase = async (messagesToSave: ChatMessage[]) => {
    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: messagesToSave.map(m => ({
            role: m.role,
            content: m.content,
            metadata: m.metadata
          }))
        })
      })
    } catch (error) {
      console.error("Failed to save messages:", error)
    }
  }

  const handleCreateSupportTicket = async () => {
    const lastUserMessage = messages.filter(m => m.role === "USER").pop()
    
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Chat Support Request",
          description: lastUserMessage ? lastUserMessage.content : "Support request from chat interface",
          category: "GENERAL",
          priority: "MEDIUM",
          userId: userId || null,
          patientId: patientId || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const ticketMessage: ChatMessage = {
          id: `ticket_${Date.now()}`,
          role: "ASSISTANT",
          content: `I've created a support ticket for you. Ticket ID: ${data.data.ticket.ticketNumber}. Our support team will contact you soon.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, ticketMessage])
      } else {
        // Show error message if ticket creation failed
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          role: "ASSISTANT",
          content: `Sorry, I couldn't create a support ticket right now. Error: ${data.error || 'Unknown error'}. Please try again later or contact support directly.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Failed to create support ticket:", error)
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "ASSISTANT",
        content: `Sorry, I'm having trouble creating a support ticket. Error: ${error.message || 'Network error'}. Please try again later.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return format(date, "HH:mm")
  }

  const getMessageIcon = (role: string) => {
    switch (role) {
      case "USER": return <User className="w-4 h-4" />
      case "ASSISTANT": return <Bot className="w-4 h-4" />
      default: return <HelpCircle className="w-4 h-4" />
    }
  }

  const getMessageBgColor = (role: string) => {
    switch (role) {
      case "USER": return "bg-blue-50 border-blue-200"
      case "ASSISTANT": return "bg-gray-50 border-gray-200"
      default: return "bg-yellow-50 border-yellow-200"
    }
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${controlledIsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Hospital Assistant</span>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Online
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => controlledSetIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Chat Mode Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={chatMode === "ai" ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode("ai")}
            className={`flex-1 text-xs ${chatMode === "ai" ? "bg-blue-600 text-white" : ""}`}
          >
            <Bot className="w-3 h-3 mr-1" />
            AI Assistant
          </Button>
          <Button
            variant={chatMode === "agent" ? "default" : "outline"}
            size="sm"
            onClick={() => setChatMode("agent")}
            className={`flex-1 text-xs ${chatMode === "agent" ? "bg-green-600 text-white" : ""}`}
          >
            <User className="w-3 h-3 mr-1" />
            Real Agent
          </Button>
        </div>
        
        <div className="mt-2 p-2 rounded-md bg-gray-50 border">
          <p className="text-xs text-gray-600 font-medium">
            {chatMode === "ai" ? (
              <span className="text-blue-600">🤖 AI Assistant: Instant responses to your questions</span>
            ) : (
              <span className="text-green-600">👨‍⚕️ Real Agent: Connect with human support staff</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 h-[calc(100vh-200px)] p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 border ${getMessageBgColor(message.role)}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {getMessageIcon(message.role)}
                  <span className="text-xs text-gray-500">
                    {message.role === "USER" ? "You" : chatMode === "ai" ? "AI Assistant" : "Support Agent"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.metadata?.source === "knowledge_base" && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {message.metadata.category}
                    </Badge>
                  </div>
                )}
                
                {message.metadata?.source === "agent" && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-green-600">
                      Ticket Created: {message.metadata.ticketId}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-500">
                    {chatMode === "ai" ? "Thinking..." : "Connecting to agent..."}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {error && (
        <Alert variant="destructive" className="mx-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2 mb-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={chatMode === "ai" ? "Ask about hospital services, appointments, or queue status..." : "Describe your issue and a human agent will assist you..."}
            className="flex-1 resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          {chatMode === "ai" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateSupportTicket}
              disabled={isLoading}
            >
              <Ticket className="w-4 h-4 mr-2" />
              Create Support Ticket
            </Button>
          )}
          
          <div className="text-xs text-gray-500 ml-auto">
            {chatMode === "ai" ? "AI Powered" : "Human Support"}
          </div>
        </div>
      </div>
    </div>
  )
}