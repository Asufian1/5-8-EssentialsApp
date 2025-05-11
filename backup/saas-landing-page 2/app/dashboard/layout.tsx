"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  BarChart2,
  Tag,
  Barcode,
  FileUp,
  AlertTriangle,
  Database,
} from "lucide-react"
import { getOrders } from "@/lib/data-local" // Use local data module instead
import { isSupabaseConfigured } from "@/lib/supabase"

// Define the logo URL with a fallback
const LOGO_URL = "/images/retriever-essentials-logo.png"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [logoError, setLogoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if Supabase is configured
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = async () => {
      try {
        setIsLoading(true)

        // For take-items and checkout pages, allow access without authentication
        if (pathname === "/dashboard/take-items" || pathname === "/dashboard/checkout") {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // TEMPORARY: Use only localStorage for authentication
        const authStatus = localStorage.getItem("isAuthenticated")
        const userTypeValue = localStorage.getItem("userType")

        if (authStatus === "true" && userTypeValue === "staff") {
          setIsAuthenticated(true)
          setUserType(userTypeValue)
        } else {
          // Not authenticated, redirect to login
          router.push("/login")
        }
      } catch (error) {
        console.error("Authentication error:", error)
        // Fallback to localStorage on error
        const authStatus = localStorage.getItem("isAuthenticated")
        const userTypeValue = localStorage.getItem("userType")

        if (authStatus === "true" && userTypeValue === "staff") {
          setIsAuthenticated(true)
          setUserType(userTypeValue)
        } else {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  useEffect(() => {
    // Only fetch orders if authenticated as staff
    if (isAuthenticated && userType === "staff") {
      const fetchPendingOrders = async () => {
        try {
          const orders = await getOrders()
          const pendingCount = orders.filter((order) => order.status === "pending").length
          setPendingOrdersCount(pendingCount)
        } catch (error) {
          console.error("Error fetching pending orders:", error)
        }
      }

      fetchPendingOrders()

      // Set up an interval to check for new orders every 30 seconds
      const intervalId = setInterval(fetchPendingOrders, 30000)

      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId)
    }
  }, [isAuthenticated, userType])

  const handleLogout = async () => {
    try {
      // TEMPORARY: Use only localStorage for logout
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userType")
      localStorage.removeItem("username")

      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback to just clearing localStorage
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userType")
      localStorage.removeItem("username")
      router.push("/")
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      staffOnly: true,
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: <Package className="h-5 w-5" />,
      staffOnly: true,
    },
    {
      name: "Barcode Scanner",
      href: "/dashboard/barcode-scan",
      icon: <Barcode className="h-5 w-5" />,
      staffOnly: true,
    },
    {
      name: "Import CSV",
      href: "/dashboard/import",
      icon: <FileUp className="h-5 w-5" />,
      staffOnly: true,
    },
    {
      name: "Categories",
      href: "/dashboard/categories",
      icon: <Tag className="h-5 w-5" />,
      staffOnly: true,
    },
    {
      name: "Browse Items",
      href: "/dashboard/take-items",
      icon: <ShoppingCart className="h-5 w-5" />,
      staffOnly: false,
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: <ClipboardList className="h-5 w-5" />,
      staffOnly: true,
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart2 className="h-5 w-5" />,
      staffOnly: true,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== "/dashboard/take-items" && pathname !== "/dashboard/checkout") {
    return null // Don't render anything until authentication check is complete
  }

  // Logo fallback component
  const LogoComponent = () => {
    if (logoError) {
      return (
        <div className="flex items-center justify-center bg-primary rounded-md p-2 h-full w-full">
          <h1 className="text-xl font-bold text-black">Retriever&apos;s Essentials</h1>
        </div>
      )
    }

    return (
      <Image
        src={LOGO_URL || "/placeholder.svg"}
        alt="Retriever's Essentials Logo"
        fill
        sizes="(max-width: 768px) 100vw, 240px"
        className="object-contain"
        style={{ objectPosition: "center" }}
        priority
        onError={() => setLogoError(true)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-bold">
              Retriever Essentials
            </Link>
            <nav className="hidden md:flex gap-4">
              <Link href="/dashboard/inventory" className="text-sm font-medium">
                Inventory
              </Link>
              <Link href="/dashboard/take-items" className="text-sm font-medium">
                Take Items
              </Link>
              <Link href="/dashboard/orders" className="text-sm font-medium">
                Orders
              </Link>
              <Link href="/dashboard/analytics" className="text-sm font-medium">
                Analytics
              </Link>
              <Link href="/dashboard/import" className="text-sm font-medium">
                Import
              </Link>
              <Link href="/dashboard/categories" className="text-sm font-medium">
                Categories
              </Link>
              <Link href="/dashboard/barcode-scan" className="text-sm font-medium">
                Barcode Scan
              </Link>
              {!supabaseConfigured && (
                <Link href="/dashboard/supabase-setup" className="text-sm font-medium flex items-center text-amber-600">
                  <Database className="mr-1 h-4 w-4" />
                  Setup Supabase
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {!supabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 py-2">
          <div className="container flex items-center text-sm text-amber-800">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Supabase is not configured. Using local storage as fallback.</span>
            <Link href="/dashboard/supabase-setup" className="ml-2 underline font-medium">
              Set up Supabase
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Suspense fallback={<div className="container py-10">Loading...</div>}>{children}</Suspense>
      </main>
    </div>
  )
}
