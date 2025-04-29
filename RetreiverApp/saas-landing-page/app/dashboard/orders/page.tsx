"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrders, fulfillOrder } from "@/lib/data"
import type { Order } from "@/lib/types"
import { CheckCircle, Clock, Search, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)

  // Search and sort states
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

  // Filtered orders
  const [filteredPendingOrders, setFilteredPendingOrders] = useState<Order[]>([])
  const [filteredFulfilledOrders, setFilteredFulfilledOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const fetchedOrders = await getOrders()
        setOrders(fetchedOrders)
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Apply filtering and sorting whenever orders, search query, or sort order changes
  useEffect(() => {
    // First separate pending and fulfilled orders
    const pendingOrders = orders.filter((order) => order.status === "pending")
    const fulfilledOrders = orders.filter((order) => order.status === "fulfilled")

    // Apply search filter if there's a query
    const filteredPending = searchQuery
      ? pendingOrders.filter((order) => order.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
      : pendingOrders

    const filteredFulfilled = searchQuery
      ? fulfilledOrders.filter((order) => order.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
      : fulfilledOrders

    // Apply sorting
    const sortedPending = [...filteredPending].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

    const sortedFulfilled = [...filteredFulfilled].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB
    })

    setFilteredPendingOrders(sortedPending)
    setFilteredFulfilledOrders(sortedFulfilled)
  }, [orders, searchQuery, sortOrder])

  const handleFulfillOrder = async (orderId: string) => {
    setProcessingOrderId(orderId)

    try {
      // Call the fulfillOrder function which will now update inventory
      const result = await fulfillOrder(orderId)

      if (result.success) {
        // Update the local state
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, status: "fulfilled" } : order)),
        )
      } else {
        alert("Error fulfilling order: " + (result.order?.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error fulfilling order:", error)
      alert("There was an error fulfilling this order. Please try again.")
    } finally {
      setProcessingOrderId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "oldest")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student ID..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger>
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort by date" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Newest first
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Oldest first
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({filteredPendingOrders.length})</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled ({filteredFulfilledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredPendingOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  {searchQuery ? "No pending orders match your search" : "No pending orders"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPendingOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Student ID</h3>
                      <p>{order.studentId}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-1">Items</h3>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{item.itemName}</span>
                            <span>
                              {item.unit === "kg" || item.unit === "lb"
                                ? `${item.quantity.toFixed(1)} ${item.unit}`
                                : `x${item.quantity}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={() => handleFulfillOrder(order.id)}
                      disabled={processingOrderId === order.id}
                      className="w-full"
                    >
                      {processingOrderId === order.id ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Fulfill Order
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="fulfilled" className="space-y-4">
          {filteredFulfilledOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  {searchQuery ? "No fulfilled orders match your search" : "No fulfilled orders"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFulfilledOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Fulfilled
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Student ID</h3>
                      <p>{order.studentId}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-1">Items</h3>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{item.itemName}</span>
                            <span>
                              {item.unit === "kg" || item.unit === "lb"
                                ? `${item.quantity.toFixed(1)} ${item.unit}`
                                : `x${item.quantity}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {order.fulfilledAt && (
                      <div>
                        <h3 className="font-medium mb-1">Fulfilled At</h3>
                        <p>{formatDate(order.fulfilledAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
