"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { Store } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [userType, setUserType] = useState("student")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    // Dummy authentication
    if (username === "admin" && password === "admin123" && userType === "staff") {
      // Store auth state in localStorage
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userType", "staff")
      localStorage.setItem("username", username)
      router.push("/dashboard")
    } else if (username === "student" && password === "student123" && userType === "student") {
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userType", "student")
      localStorage.setItem("username", username)
      router.push("/dashboard")
    } else {
      setError("Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 w-full bg-secondary">
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white p-4">
          <div className="bg-black/50 p-6 rounded-lg text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-primary mb-2">Retriever&apos;s Essentials</h1>
            <p className="text-xl md:text-2xl">UMBC&apos;s Free Campus Food Store</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md border-t-4 border-primary">
          <div className="text-center">
            <div className="flex justify-center">
              <Store className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-secondary">Sign In</h2>
            <p className="mt-2 text-gray-600">Access the inventory system</p>
          </div>

          {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="border-gray-300"
                />
                <p className="text-xs text-muted-foreground mt-1">Staff: admin / Student: student</p>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="border-gray-300"
                />
                <p className="text-xs text-muted-foreground mt-1">Staff: admin123 / Student: student123</p>
              </div>

              <RadioGroup value={userType} onValueChange={setUserType} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="text-gray-800 font-medium">
                    Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="staff" />
                  <Label htmlFor="staff" className="text-gray-800 font-medium">
                    Staff
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Retriever&apos;s Essentials is committed to fighting food insecurity on campus.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary text-white py-4 text-center">
        <p className="text-sm">© {new Date().getFullYear()} UMBC Retriever&apos;s Essentials</p>
      </footer>
    </div>
  )
}

