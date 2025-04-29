"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Package, ShoppingCart, ClipboardList, BarChart2, LogOut, Menu, X, Tag } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userType, setUserType] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication on component mount
    const authStatus = localStorage.getItem("isAuthenticated")
    const userTypeValue = localStorage.getItem("userType")

    // For take-items and checkout pages, allow access without authentication
    if (pathname === "/dashboard/take-items" || pathname === "/dashboard/checkout") {
      setIsAuthenticated(true)
      return
    }

    // For other dashboard pages, require staff authentication
    if (authStatus !== "true" || userTypeValue !== "staff") {
      router.push("/login")
      return
    }

    setIsAuthenticated(true)
    setUserType(userTypeValue || "")
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userType")
    localStorage.removeItem("username")
    router.push("/")
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

  if (!isAuthenticated) {
    return null // Don't render anything until authentication check is complete
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleMobileMenu} className="bg-white">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center h-24 px-4">
            <Image
              src="/images/retriever-essentials-logo.png"
              alt="Retriever's Essentials Logo"
              width={180}
              height={80}
              className="object-contain"
            />
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navItems
              .filter((item) => !item.staffOnly || userType === "staff")
              .map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                    pathname === item.href ? "bg-primary text-black" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t p-4">
          <Button onClick={handleLogout} variant="outline" className="w-full flex items-center justify-center">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </Button>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-center h-24 px-4">
                <Image
                  src="/images/retriever-essentials-logo.png"
                  alt="Retriever's Essentials Logo"
                  width={160}
                  height={70}
                  className="object-contain"
                />
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems
                  .filter((item) => !item.staffOnly || userType === "staff")
                  .map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={toggleMobileMenu}
                      className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                        pathname === item.href ? "bg-primary text-black" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t p-4">
              <Button onClick={handleLogout} variant="outline" className="w-full flex items-center justify-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
