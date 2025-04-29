"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Store, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    // Admin authentication only
    if (username === "admin" && password === "admin123") {
      // Store auth state in localStorage
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userType", "staff")
      localStorage.setItem("username", username)
      router.push("/dashboard")
    } else {
      setError("Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back to Home Link */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative h-48 md:h-64 w-full bg-secondary">
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white p-4">
          <div className="bg-black/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-primary mb-2">Admin Login</h1>
            <p className="text-lg md:text-xl">Retriever&apos;s Essentials Management</p>
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
            <h2 className="mt-4 text-2xl font-bold text-secondary">Staff Sign In</h2>
            <p className="mt-2 text-gray-600">Access the inventory management system</p>
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
                <p className="text-xs text-muted-foreground mt-1">Staff: admin</p>
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
                <p className="text-xs text-muted-foreground mt-1">Staff: admin123</p>
              </div>
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
