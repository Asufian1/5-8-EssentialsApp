"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Minus,
  Scale,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  ShoppingBag,
  X,
  Info,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { processDirectCheckout, getInventoryItems, getCategories } from "@/lib/data-db"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { supabaseConfig } from "@/lib/supabase-config"
import { formatWeight } from "@/lib/utils"

// Safe API approach with validation
const API_URL =
  typeof supabaseConfig.supabaseUrl === "string" && supabaseConfig.supabaseUrl.startsWith("http")
    ? supabaseConfig.supabaseUrl
    : ""
const API_KEY = supabaseConfig.supabaseAnonKey || ""

// Simple fetch wrapper with better error handling
async function fetchSupabase(endpoint: string, options: RequestInit = {}) {
  if (!API_URL) {
    console.error("Invalid Supabase URL configuration")
    return { error: "Database configuration error" }
  }

  try {
    const url = `${API_URL}${endpoint}`
    const headers = {
      ...options.headers,
      apikey: API_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${JSON.stringify(data)}`)
    }

    return data
  } catch (error) {
    console.error(`Fetch error:`, error)
    throw error
  }
}

export default function AdminCheckoutPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [studentId, setStudentId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [recentCheckouts, setRecentCheckouts] = useState<any[]>([])

  // New state for quantity dialog
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [customQuantity, setCustomQuantity] = useState("")

  useEffect(() => {
    // Check if user is admin/staff
    const userType = localStorage.getItem("userType")
    if (userType !== "staff" && userType !== "admin") {
      // Redirect non-admin users
      window.location.href = "/login"
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError("")

        // Load inventory items using our existing function
        const inventoryItems = await getInventoryItems()

        // Format the weights for all weighed items
        const formattedItems = inventoryItems.map((item) => {
          if (item.isWeighed && typeof item.quantity === "number") {
            // Create a new object with the formatted quantity
            return {
              ...item,
              displayQuantity: formatWeight(item.quantity),
            }
          }
          return item
        })

        setItems(formattedItems)
        setFilteredItems(formattedItems)

        // Load categories using our existing function
        const categoriesData = await getCategories()
        setCategories(categoriesData)

        // Fetch recent checkouts
        try {
          const supabase = getSupabaseClient()
          if (supabase) {
            const { data: checkoutsData, error: checkoutsError } = await supabase
              .from("transactions")
              .select("*")
              .eq("type", "out")
              .order("timestamp", { ascending: false })
              .limit(5)

            if (!checkoutsError && checkoutsData) {
              // Format the weights in the checkout data
              const formattedCheckouts = checkoutsData.map((checkout) => {
                if (checkout.unit === "kg" || checkout.unit === "lb") {
                  return {
                    ...checkout,
                    displayQuantity: formatWeight(checkout.quantity),
                  }
                }
                return checkout
              })

              setRecentCheckouts(formattedCheckouts)
            }
          }
        } catch (error) {
          console.error("Error fetching recent checkouts:", error)
          // Don't set main error since this is not critical
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Failed to load items from the database. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [lastRefreshed])

  useEffect(() => {
    // Filter items based on search query and category
    let filtered = [...items]

    if (searchQuery) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, selectedCategory])

  const addToCart = (item: InventoryItem) => {
    // For weighed items, open the quantity dialog
    if (item.isWeighed) {
      setSelectedItem(item)
      setCustomQuantity("")
      setQuantityDialogOpen(true)
      return
    }

    // For non-weighed items, proceed as before
    const existingItem = cart.find((cartItem) => cartItem.item.id === item.id)

    if (existingItem) {
      // Increment quantity if already in cart
      setCart(
        cart.map((cartItem) =>
          cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        ),
      )
    } else {
      // Add new item to cart
      setCart([...cart, { item, quantity: 1 }])
    }
  }

  const handleAddCustomQuantity = () => {
    if (!selectedItem) return

    // Validate the quantity
    const quantity = Number.parseFloat(customQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid positive number",
        variant: "destructive",
      })
      return
    }

    if (quantity > selectedItem.quantity) {
      toast({
        title: "Quantity too large",
        description: `Only ${selectedItem.quantity} ${selectedItem.unit || "items"} available`,
        variant: "destructive",
      })
      return
    }

    // Add to cart with custom quantity
    const existingItem = cart.find((cartItem) => cartItem.item.id === selectedItem.id)

    if (existingItem) {
      // Update quantity if already in cart
      setCart(
        cart.map((cartItem) =>
          cartItem.item.id === selectedItem.id ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem,
        ),
      )
    } else {
      // Add new item to cart
      setCart([...cart, { item: selectedItem, quantity }])
    }

    setQuantityDialogOpen(false)
  }

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find((cartItem) => cartItem.item.id === itemId)

    if (existingItem && existingItem.quantity > 1) {
      // For weighed items with decimal quantities, we need special handling
      if (existingItem.item.isWeighed) {
        // If quantity is less than 1, remove the item
        if (existingItem.quantity <= 1) {
          setCart(cart.filter((cartItem) => cartItem.item.id !== itemId))
          return
        }

        // Otherwise, decrement by 0.1 for weighed items
        setCart(
          cart.map((cartItem) =>
            cartItem.item.id === itemId
              ? { ...cartItem, quantity: Math.round((cartItem.quantity - 0.1) * 10) / 10 }
              : cartItem,
          ),
        )
        return
      }

      // For non-weighed items, decrement by 1
      setCart(
        cart.map((cartItem) =>
          cartItem.item.id === itemId ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem,
        ),
      )
    } else {
      // Remove item from cart
      setCart(cart.filter((cartItem) => cartItem.item.id !== itemId))
    }
  }

  const getColorForCategory = (category: string) => {
    switch (category) {
      case "essentials":
        return "bg-amber-100"
      case "grains":
        return "bg-orange-100"
      case "canned":
        return "bg-gray-100"
      case "produce":
        return "bg-green-100"
      case "dairy":
        return "bg-blue-100"
      case "south-asian":
        return "bg-purple-100"
      default:
        return "bg-gray-100"
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  // Function to manually refresh the data
  const refreshData = () => {
    setLastRefreshed(new Date())
  }

  const handleDirectCheckout = async () => {
    if (!studentId.trim()) {
      setError("Please enter a student ID")
      return
    }

    if (cart.length === 0) {
      setError("Cart is empty")
      return
    }

    setIsProcessing(true)
    setError("")
    setSuccessMessage("")

    try {
      // Process direct checkout
      const result = await processDirectCheckout(
        studentId,
        cart.map(({ item, quantity }) => ({
          itemId: item.id,
          itemName: item.name,
          quantity,
          category: item.category,
          unit: item.unit,
        })),
      )

      if (result.success) {
        // Show success message
        setSuccessMessage(`Successfully checked out items for student ${studentId}`)
        toast({
          title: "Checkout Successful",
          description: `Items have been checked out for student ${studentId}`,
          variant: "default",
        })

        // Clear cart and student ID
        setCart([])
        setStudentId("")

        // Refresh inventory data
        refreshData()
      } else {
        setError(result.error || "Failed to process checkout")
      }
    } catch (error) {
      console.error("Error processing checkout:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Format quantity for display
  const formatQuantity = (quantity: number, unit: string | null | undefined) => {
    if (unit === "kg" || unit === "lb") {
      // Use the formatWeight function for consistent decimal display
      return formatWeight(quantity)
    }
    // For items, show whole numbers
    return Math.round(quantity).toString()
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Direct Checkout</h1>
            <p className="text-lg text-primary mt-2">Process items for students directly</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Checkout</h2>
          <p className="text-muted-foreground">Process items for students without creating orders</p>
        </div>
        <Button variant="outline" onClick={refreshData} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Items
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-8 h-10 min-w-[200px] text-base font-normal"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search items"
                    style={{ fontSize: "16px", lineHeight: "1.5" }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Tabs
                  defaultValue="all"
                  className="w-full sm:w-auto"
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <TabsList className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1 overflow-x-auto">
                    <TabsTrigger value="all">All</TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-10 w-10 rounded-full ${getColorForCategory(
                              item.category,
                            )} flex items-center justify-center`}
                          >
                            <span className="text-xs font-bold uppercase text-black dark:text-black">
                              {item.category.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription>{item.categoryName || getCategoryName(item.category)}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {item.isWeighed ? (
                                <span className="flex items-center">
                                  <Scale className="h-3 w-3 mr-1" />
                                  {item.unit}
                                </span>
                              ) : (
                                "Per Item"
                              )}
                            </Badge>
                            <p className="text-sm">
                              Available:{" "}
                              <span className="font-medium">
                                {item.isWeighed ? formatWeight(item.quantity) : item.quantity}
                              </span>
                              {item.unit && <span> {item.unit}</span>}
                            </p>
                            {item.hasLimit !== false && (
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                Limit: {item.studentLimit} {item.unit || (item.studentLimit === 1 ? "item" : "items")}
                              </p>
                            )}
                            {item.cost && (
                              <p className="text-sm text-muted-foreground">
                                Cost: ${item.cost.toFixed(2)} per {item.unit || "item"}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            disabled={item.quantity <= 0}
                            className="h-8 px-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No items found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Checkouts */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-xl">Recent Checkouts</CardTitle>
              <CardDescription>Recently processed checkouts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCheckouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-4 text-left">Time</th>
                        <th className="py-2 px-4 text-left">Student</th>
                        <th className="py-2 px-4 text-left">Item</th>
                        <th className="py-2 px-4 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCheckouts.map((checkout) => (
                        <tr key={checkout.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{formatDate(checkout.timestamp)}</td>
                          <td className="py-2 px-4">{checkout.user_id}</td>
                          <td className="py-2 px-4">{checkout.item_name}</td>
                          <td className="py-2 px-4 text-right">
                            {checkout.unit === "kg" || checkout.unit === "lb"
                              ? formatWeight(checkout.quantity)
                              : checkout.quantity}{" "}
                            {checkout.unit || "items"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No recent checkouts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Admin Checkout
              </CardTitle>
              <CardDescription>Process items for a student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Direct Checkout</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="h-10 text-base"
                    style={{ fontSize: "16px", lineHeight: "1.5" }}
                  />
                  <p className="text-xs text-muted-foreground">Enter student ID to process direct checkout</p>
                </div>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatQuantity(quantity, item.unit)} {item.unit || "item"}
                          {quantity !== 1 && !item.unit && "s"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center">{formatQuantity(quantity, item.unit)}</span>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => addToCart(item)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={cart.length === 0 || !studentId.trim() || isProcessing}
                onClick={handleDirectCheckout}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Processing...
                  </span>
                ) : (
                  "Process Direct Checkout"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Last refreshed indicator */}
      <div className="text-xs text-muted-foreground text-right">
        Last database fetch: {lastRefreshed.toLocaleTimeString()}
      </div>

      {/* Quantity Dialog for Weighed Items */}
      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Quantity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({selectedItem?.unit})</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedItem?.quantity}
                  placeholder={`Enter ${selectedItem?.unit} amount`}
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                  className="h-10 text-base"
                  style={{ fontSize: "16px", lineHeight: "1.5" }}
                />
                <span>{selectedItem?.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {selectedItem ? formatWeight(selectedItem.quantity) : ""} {selectedItem?.unit}
              </p>
              {selectedItem && selectedItem.hasLimit !== false && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Limit: {selectedItem.studentLimit}{" "}
                  {selectedItem.unit || (selectedItem.studentLimit === 1 ? "item" : "items")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomQuantity}>Add to Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
