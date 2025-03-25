"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Home, LogOut, Package, ShoppingBasket, Store, User } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState("")
  const [username, setUsername] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication on component mount
    const authStatus = localStorage.getItem("isAuthenticated")
    const storedUserType = localStorage.getItem("userType")
    const storedUsername = localStorage.getItem("username")

    if (authStatus !== "true") {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
      setUserType(storedUserType || "")
      setUsername(storedUsername || "")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userType")
    localStorage.removeItem("username")
    router.push("/login")
  }

  if (!isAuthenticated) {
    return null // Don't render anything until authentication check completes
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-secondary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Retriever&apos;s Essentials</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{username}</p>
                <p className="text-xs text-gray-300 capitalize">{userType}</p>
              </div>
            </div>
            <Button variant="ghost" className="text-white hover:text-primary hover:bg-secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-4 border-b">
            <div className="text-center">
              <h3 className="font-bold text-lg text-primary">UMBC</h3>
              <p className="text-xs text-gray-500">Retriever's Essentials</p>
            </div>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            <Link href="/dashboard" passHref>
              <Button
                variant={pathname === "/dashboard" ? "default" : "ghost"}
                className={`w-full justify-start ${
                  pathname === "/dashboard" ? "bg-primary text-black hover:bg-primary/90" : "hover:bg-gray-100"
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link href="/dashboard/inventory" passHref>
              <Button
                variant={pathname === "/dashboard/inventory" ? "default" : "ghost"}
                className={`w-full justify-start ${
                  pathname === "/dashboard/inventory"
                    ? "bg-primary text-black hover:bg-primary/90"
                    : "hover:bg-gray-100"
                }`}
              >
                <Package className="mr-2 h-4 w-4" />
                Inventory
              </Button>
            </Link>

            {/* Only show Take Items for students */}
            {userType === "student" && (
              <Link href="/dashboard/take-items" passHref>
                <Button
                  variant={pathname === "/dashboard/take-items" ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    pathname === "/dashboard/take-items"
                      ? "bg-primary text-black hover:bg-primary/90"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <ShoppingBasket className="mr-2 h-4 w-4" />
                  Take Items
                </Button>
              </Link>
            )}

            {userType === "staff" && (
              <Link href="/dashboard/analytics" passHref>
                <Button
                  variant={pathname === "/dashboard/analytics" ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    pathname === "/dashboard/analytics"
                      ? "bg-primary text-black hover:bg-primary/90"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </Link>
            )}
          </nav>

          <div className="p-4 border-t text-center text-xs text-gray-500">
            <p>Fighting food insecurity at UMBC</p>
            <p className="mt-1">Commons Building, 2nd Floor</p>
            <p>Next to the Bookstore</p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

