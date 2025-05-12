"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrders, fulfillOrder } from "@/lib/data-db"
import type { Order } from "@/lib/types"
import {
  CheckCircle,
  Clock,
  Search,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Calendar,
  User,
  Package,
  Filter,
  Loader2,
  RefreshCw,
  AlertCircle,
  Database,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [dbConnected, setDbConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Search and sort states
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")

  // Filtered orders
  const [filteredPendingOrders, setFilteredPendingOrders] = useState<Order[]>([])
  const [filteredFulfilledOrders, setFilteredFulfilledOrders] = useState<Order[]>([])

  // Check database connection
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("orders").select("count").single()

        if (error) {
          console.error("Database connection error:", error)
          setDbConnected(false)
          setError("Unable to connect to the database. Please check your connection.")
        } else {
          setDbConnected(true)
          setError(null)
        }
      } catch (err) {
        console.error("Failed to check database connection:", err)
        setDbConnected(false)
        setError("Failed to connect to the database. Please try again later.")
      }
    }

    checkDbConnection()
  }, [])

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsRefreshing(true)
      const fetchedOrders = await getOrders()
      setOrders(fetchedOrders)
      setLastRefreshed(new Date())
      setError(null)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to fetch orders. Please try refreshing the page.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchOrders()
  }, [])

  // Manual refresh function
  const handleRefresh = () => {
    fetchOrders()
  }

  // Apply filtering and sorting whenever orders, search query, or sort order changes
  useEffect(() => {
    // First separate pending and fulfilled orders
    const pendingOrders = orders.filter((order) => order.status === "pending")
    const fulfilledOrders = orders.filter((order) => order.status === "fulfilled")

    // Apply search filter if there's a query
    const filteredPending = searchQuery
      ? pendingOrders.filter(
          (order) =>
            order.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : pendingOrders

    const filteredFulfilled = searchQuery
      ? fulfilledOrders.filter(
          (order) =>
            order.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.id.toLowerCase().includes(searchQuery.toLowerCase()),
        )
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

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDetailsOpen(true)
  }

  const getTotalItems = (order: Order) => {
    const total = order.items.reduce((total, item) => total + item.quantity, 0)
    return Number.isInteger(total) ? total : Number(total.toFixed(1))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 transition-colors">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and fulfill student orders</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Orders"}</span>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-1">
                <ArrowUpDown className="h-4 w-4" />
                <span>{sortOrder === "newest" ? "Newest first" : "Oldest first"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortChange("newest")}>
                <ArrowDown className="mr-2 h-4 w-4" />
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange("oldest")}>
                <ArrowUp className="mr-2 h-4 w-4" />
                Oldest first
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Database status */}
      {dbConnected ? (
        <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
          <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">Database Connected</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Orders are being loaded from the database.
            {lastRefreshed && (
              <span className="ml-2 text-xs">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            {error || "Unable to connect to the database. Orders may not be up to date."}
            <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student ID or order number..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Pending ({filteredPendingOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="fulfilled"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Fulfilled ({filteredFulfilledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredPendingOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {searchQuery ? "No pending orders match your search" : "No pending orders"}
                </p>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "New orders will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPendingOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      >
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Student ID:</span>
                        <span>{order.studentId}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Items:</span>
                        <span>{getTotalItems(order)} items</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Requested:</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-2 pb-4">
                    <Button
                      onClick={() => handleFulfillOrder(order.id)}
                      disabled={processingOrderId === order.id}
                      className="flex-1"
                    >
                      {processingOrderId === order.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Fulfill
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => openOrderDetails(order)} className="flex-1">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fulfilled" className="space-y-4">
          {filteredFulfilledOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {searchQuery ? "No fulfilled orders match your search" : "No fulfilled orders"}
                </p>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "Fulfilled orders will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFulfilledOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Fulfilled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Student ID:</span>
                        <span>{order.studentId}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Items:</span>
                        <span>{getTotalItems(order)} items</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Fulfilled:</span>
                        <span>{order.fulfilledAt ? new Date(order.fulfilledAt).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 pb-4">
                    <Button variant="outline" onClick={() => openOrderDetails(order)} className="w-full">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order #${selectedOrder.id.slice(0, 8)} - ${formatDate(selectedOrder.createdAt)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={selectedOrder.status === "fulfilled" ? "outline" : "secondary"}
                    className={
                      selectedOrder.status === "fulfilled"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                        : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    }
                  >
                    {selectedOrder.status === "fulfilled" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" /> Fulfilled
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </>
                    )}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Student ID</p>
                  <p className="text-sm">{selectedOrder.studentId}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Items</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-2 px-3 text-left">Item</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="py-2 px-3">{item.itemName}</td>
                          <td className="py-2 px-3 text-right">
                            {item.unit === "kg" || item.unit === "lb"
                              ? `${item.quantity.toFixed(1)} ${item.unit}`
                              : `x${item.quantity}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Timeline</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      <Calendar className="h-3 w-3" />
                    </Badge>
                    <span>Created: {formatDate(selectedOrder.createdAt)}</span>
                  </div>

                  {selectedOrder.fulfilledAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge
                        variant="outline"
                        className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800"
                      >
                        <CheckCircle className="h-3 w-3 text-green-800 dark:text-green-300" />
                      </Badge>
                      <span>Fulfilled: {formatDate(selectedOrder.fulfilledAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.status === "pending" && (
                <Button
                  onClick={() => {
                    handleFulfillOrder(selectedOrder.id)
                    setIsOrderDetailsOpen(false)
                  }}
                  disabled={processingOrderId === selectedOrder.id}
                  className="w-full"
                >
                  {processingOrderId === selectedOrder.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fulfill Order
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
