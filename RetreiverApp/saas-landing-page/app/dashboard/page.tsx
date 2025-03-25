"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Package, ShoppingBasket, Users, MapPin } from "lucide-react"
import { getInventoryItems, getTransactions } from "@/lib/data"
import type { Transaction } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"

export default function Dashboard() {
  const [totalItems, setTotalItems] = useState(0)
  const [lowStockItems, setLowStockItems] = useState(0)
  const [todayVisits, setTodayVisits] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [userType, setUserType] = useState("")

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType || "")

    // Get inventory data
    const items = getInventoryItems()
    setTotalItems(items.reduce((sum, item) => sum + item.quantity, 0))
    setLowStockItems(items.filter((item) => item.quantity < 10).length)

    // Get transaction data
    const transactions = getTransactions()
    setRecentTransactions(transactions.slice(0, 5)) // Get 5 most recent transactions

    // Calculate today's visits (unique users who took items today)
    const today = new Date().toDateString()
    const todayTransactions = transactions.filter(
      (t) => new Date(t.timestamp).toDateString() === today && t.type === "out",
    )
    const uniqueUsers = new Set(todayTransactions.map((t) => t.user))
    setTodayVisits(uniqueUsers.size)
  }, [])

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-48 md:h-64 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome to Retriever&apos;s Essentials</h1>
            <p className="text-xl text-primary mt-2">UMBC&apos;s Free Campus Food Store</p>
          </div>
        </div>
      </div>

      {/* Location Card for Students */}
      {userType === "student" && (
        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Location</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-medium">UMBC Commons Building</div>
            <p className="text-sm text-muted-foreground">Second Floor, Next to the Bookstore</p>
            <p className="text-sm text-muted-foreground mt-2">Open Monday-Friday, 10AM-4PM</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <ShoppingBasket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items with less than 10 in stock</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Visits</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayVisits}</div>
            <p className="text-xs text-muted-foreground">Unique students today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Only show Recent Activity for staff */}
        {userType === "staff" && (
          <Card className="col-span-2 md:col-span-1 border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>The latest inventory transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction, i) => (
                  <div key={i} className="flex items-center">
                    <div className="mr-4">
                      {transaction.type === "in" ? (
                        <div className="rounded-full bg-green-100 p-2">
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-red-100 p-2">
                          <ArrowDown className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.type === "in" ? "Added to" : "Removed from"} inventory
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.itemName} × {transaction.quantity}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}

                {recentTransactions.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={`col-span-2 ${userType === "staff" ? "md:col-span-1" : ""} border-t-4 border-primary`}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {userType === "student" && (
                <Link href="/dashboard/take-items" passHref>
                  <Button className="w-full bg-primary text-black hover:bg-primary/90 h-auto py-4 flex flex-col items-center">
                    <ShoppingBasket className="h-6 w-6 mb-2" />
                    <span>Take Food Items</span>
                  </Button>
                </Link>
              )}

              <Link href="/dashboard/inventory" passHref>
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center">
                  <Package className="h-6 w-6 mb-2" />
                  <span>View Inventory</span>
                </Button>
              </Link>

              {userType === "staff" && (
                <Link href="/dashboard/analytics" passHref>
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span>View Analytics</span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Featured Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative rounded-lg overflow-hidden h-32 bg-amber-100 hover:bg-amber-200 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black font-bold text-lg">Essentials</span>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden h-32 bg-purple-100 hover:bg-purple-200 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black font-bold text-lg">South Asian</span>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden h-32 bg-green-100 hover:bg-green-200 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black font-bold text-lg">Produce</span>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden h-32 bg-orange-100 hover:bg-orange-200 transition-colors">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-black font-bold text-lg">Grains</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

