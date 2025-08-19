"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stethoscope, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  // Redirect if already authenticated using useEffect
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // If authenticated, show loading state while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleRoleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError("")

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const success = await login(email, password)
      if (success) {
        router.push("/")
      } else {
        setError("Invalid email or password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hospital Queue Management</h1>
          <p className="text-gray-600 mt-2">Government Hospital System</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Role Quick Login Buttons */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Login by Role:</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleLogin('super@hospital.com', 'password')}
                  className="text-xs"
                >
                  Super Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleLogin('admin@hospital.com', 'password')}
                  className="text-xs"
                >
                  Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleLogin('doctor@hospital.com', 'password')}
                  className="text-xs"
                >
                  Doctor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleLogin('nurse@hospital.com', 'password')}
                  className="text-xs"
                >
                  Nurse
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleLogin('pharmacist@hospital.com', 'password')}
                  className="text-xs"
                >
                  Pharmacist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRoleLogin('staff@hospital.com', 'password')}
                  className="text-xs"
                >
                  Staff
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Click any role above for instant login
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Manual Login Credentials:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Super Admin:</strong> super@hospital.com / password</p>
                <p><strong>Admin:</strong> admin@hospital.com / password</p>
                <p><strong>Doctor:</strong> doctor@hospital.com / password</p>
                <p><strong>Nurse:</strong> nurse@hospital.com / password</p>
                <p><strong>Pharmacist:</strong> pharmacist@hospital.com / password</p>
                <p><strong>Staff:</strong> staff@hospital.com / password</p>
                <p className="text-xs text-gray-500 mt-2">(Use any email containing role name + any password)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Hospital Queue Management System</p>
          <p className="mt-1">Secure Healthcare Portal</p>
        </div>
      </div>
    </div>
  )
}