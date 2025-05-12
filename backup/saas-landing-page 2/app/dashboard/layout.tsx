"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  ShoppingBasket,
  BarChart,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  User,
  Barcode,
  Database,
} from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userType, setUserType] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const pathname = usePathname()

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Define public routes that don't require authentication
  const publicRoutes = ["/dashboard/take-items", "/dashboard/checkout"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Fetch pending orders count
  const fetchPendingOrders = async () => {
    try {
      // Only fetch if not on a public route
      if (isPublicRoute) return

      const { data, error } = await supabase.from("orders").select("id").eq("status", "pending")

      if (error) {
        console.error("Error fetching pending orders:", error)
        return
      }

      setPendingOrders(data?.length || 0)
    } catch (err) {
      console.error("Failed to fetch pending orders:", err)
    }
  }

  useEffect(() => {
    // If it's a public route, set userType to student
    if (isPublicRoute) {
      localStorage.setItem("userType", "student")
      setUserType("student")
      return
    }

    // Otherwise, check for stored userType
    const storedUserType = localStorage.getItem("userType")
    if (storedUserType) {
      setUserType(storedUserType)
      // Fetch pending orders count
      fetchPendingOrders()
    } else {
      // Redirect to login if no userType is found and not on a public route
      window.location.href = "/login"
    }
  }, [pathname, isPublicRoute])

  // If on a public route, use a simplified layout for students
  if (isPublicRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center">
              <Link href="/" className="mr-6">
                <Logo />
              </Link>
              <nav className="hidden md:flex items-center space-x-4">
                <Link
                  href="/dashboard/take-items"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/dashboard/take-items"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Browse Items
                </Link>
                <Link
                  href="/dashboard/checkout"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/dashboard/checkout" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Checkout
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Add the theme toggle back */}
              <ThemeToggle />
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Staff Login
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Exit
                </Button>
              </Link>
            </div>
          </div>
          {/* Mobile navigation */}
          <div className="md:hidden border-t">
            <nav className="flex justify-around py-2">
              <Link
                href="/dashboard/take-items"
                className={`flex flex-col items-center px-2 py-1 text-xs ${
                  pathname === "/dashboard/take-items" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <ShoppingBasket className="h-5 w-5 mb-1" />
                Browse
              </Link>
              <Link
                href="/dashboard/checkout"
                className={`flex flex-col items-center px-2 py-1 text-xs ${
                  pathname === "/dashboard/checkout" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <ShoppingCart className="h-5 w-5 mb-1" />
                Checkout
              </Link>
              <Link href="/login" className={`flex flex-col items-center px-2 py-1 text-xs text-muted-foreground`}>
                <User className="h-5 w-5 mb-1" />
                Staff
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
        <footer className="border-t py-4 text-center text-sm text-muted-foreground">
          <p>© 2023 Retriever's Essentials. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  // Regular staff dashboard layout
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent md:hidden"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </button>
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-6">
              <Logo />
            </Link>
            <h1 className="text-lg font-semibold md:text-xl">Retriever's Essentials Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {/* Add the theme toggle back */}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("userType")
                window.location.href = "/login"
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside
          className={`fixed inset-y-0 left-0 z-20 mt-16 w-64 transform border-r bg-background transition-transform duration-200 md:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col gap-1 p-4">
            <Link
              href="/dashboard"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/inventory"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/inventory"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Package className="mr-2 h-4 w-4" />
              Inventory
            </Link>
            <Link
              href="/dashboard/orders"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/orders"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <ShoppingBasket className="mr-2 h-4 w-4" />
              Orders
              {pendingOrders > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {pendingOrders}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/analytics"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/dashboard/import"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/import"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import Data
            </Link>
            <Link
              href="/dashboard/categories"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/categories"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Categories
            </Link>
            <Link
              href="/dashboard/barcode-scan"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/barcode-scan"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Barcode className="mr-2 h-4 w-4" />
              Barcode Scanner
            </Link>
            <Link
              href="/dashboard/supabase-setup"
              className={`flex items-center rounded-md px-3 py-2 text-sm ${
                pathname === "/dashboard/supabase-setup"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Database className="mr-2 h-4 w-4" />
              Supabase Setup
            </Link>
          </nav>
        </aside>
        <div
          className={`fixed inset-0 z-10 bg-background/80 backdrop-blur-sm transition-opacity md:hidden ${
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
        <main className="flex-1 p-4 sm:p-6 md:p-8 md:pl-72">{children}</main>
      </div>
    </div>
  )
}
