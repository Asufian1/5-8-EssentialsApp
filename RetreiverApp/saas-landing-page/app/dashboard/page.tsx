"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingBasket, Users, MapPin, ClipboardList, Clock } from "lucide-react"
import { getInventoryItems, getTransactions, getOrders } from "@/lib/data"
import type { Transaction } from "@/lib/types"

export default function Dashboard() {
  const [totalItems, setTotalItems] = useState(0)
  const [lowStockItems, setLowStockItems] = useState(0)
  const [todayVisits, setTodayVisits] = useState(0)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [userType, setUserType] = useState("")
  const [pendingOrders, setPendingOrders] = useState(0)

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

    // Get pending orders count
    if (storedUserType === "staff") {
      const orders = getOrders()
      setPendingOrders(orders.filter((order) => order.status === "pending").length)
    }
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

        {userType === "staff" ? (
          <Card className="border-t-4 border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ClipboardList className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Orders awaiting fulfillment</p>
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Only show Recent Activity for staff */}
        {userType === "staff" && (
          <Card className="col-span-2 md:col-span-1 border-t-4 border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          transaction.type === "in" ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {transaction.type === "in" ? "Restocked" : "Taken"}: {transaction.itemName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.quantity} {transaction.quantity === 1 ? "item" : "items"} by {transaction.user}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Hours Card */}
        <Card className="col-span-2 md:col-span-1 border-t-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Monday - Friday</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Saturday</span>
                <span>Closed</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sunday</span>
                <span>Closed</span>
              </div>
              <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                <p>
                  For questions or special accommodations, please contact the store manager at{" "}
                  <span className="text-primary">store@umbc.edu</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
