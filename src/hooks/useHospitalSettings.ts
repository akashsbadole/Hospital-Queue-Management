"use client"

import { useState, useEffect } from 'react'

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

export function useHospitalSettings() {
  const [settings, setSettings] = useState<HospitalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(data.data.settings)
        }
      }
    } catch (err) {
      setError('Failed to fetch hospital settings')
      console.error('Error fetching hospital settings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Apply custom styles to the document
  useEffect(() => {
    if (settings) {
      // Update CSS custom properties for theming
      document.documentElement.style.setProperty('--hospital-primary-color', settings.primaryColor)
      document.documentElement.style.setProperty('--hospital-secondary-color', settings.secondaryColor)
      
      // Update page title
      if (settings.hospitalName) {
        document.title = `${settings.hospitalName} - Queue Management`
      }
    }
  }, [settings])

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  }
}