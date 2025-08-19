"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department?: {
    id: string
    name: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      const storedAuth = localStorage.getItem('isAuthenticated')
      
      if (storedUser && storedAuth === 'true') {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (error) {
          // Clear invalid stored data
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login with role-based authentication
    let userData: User
    
    if (email.includes('super') || email.includes('root')) {
      userData = {
        id: "2",
        firstName: "Super",
        lastName: "Admin",
        email: email,
        role: "SUPER_ADMIN",
        department: {
          id: "1",
          name: "Administration"
        }
      }
    } else if (email.includes('admin')) {
      userData = {
        id: "1",
        firstName: "Admin",
        lastName: "User",
        email: email,
        role: "ADMIN",
        department: {
          id: "1",
          name: "Administration"
        }
      }
    } else if (email.includes('doctor') || email.includes('dr')) {
      userData = {
        id: "3",
        firstName: "Doctor",
        lastName: "Smith",
        email: email,
        role: "DOCTOR",
        department: {
          id: "2",
          name: "General Medicine"
        }
      }
    } else if (email.includes('nurse')) {
      userData = {
        id: "4",
        firstName: "Nurse",
        lastName: "Johnson",
        email: email,
        role: "NURSE",
        department: {
          id: "2",
          name: "General Medicine"
        }
      }
    } else if (email.includes('pharmacist') || email.includes('pharma')) {
      userData = {
        id: "5",
        firstName: "Pharmacist",
        lastName: "Brown",
        email: email,
        role: "PHARMACIST",
        department: {
          id: "3",
          name: "Pharmacy"
        }
      }
    } else if (email.includes('staff')) {
      userData = {
        id: "6",
        firstName: "Staff",
        lastName: "Member",
        email: email,
        role: "STAFF",
        department: {
          id: "4",
          name: "Reception"
        }
      }
    } else {
      // Default user
      userData = {
        id: "7",
        firstName: "User",
        lastName: "Guest",
        email: email,
        role: "USER",
        department: {
          id: "4",
          name: "Reception"
        }
      }
    }
    
    setUser(userData)
    setIsAuthenticated(true)
    
    // Save to localStorage for persistence (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')
    }
    
    return true
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    
    // Clear localStorage (only in browser)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('isAuthenticated')
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return children
}