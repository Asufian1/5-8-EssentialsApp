"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Scale,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  X,
  Info,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { processDirectCheckout } from "@/lib/data-db"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatWeight } from "@/lib/utils"

export default function TakeItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // New state for quantity dialog
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [customQuantity, setCustomQuantity] = useState("")

  const router = useRouter()

  useEffect(() => {
    // Check if user is admin/staff - ONLY these types should enable admin mode
    const userType = localStorage.getItem("userType")

    // Explicitly check for admin/staff types
    if (userType === "staff" || userType === "admin") {
      setIsAdminMode(true)
    } else {
      // For any other value (including "student" or null/undefined), ensure admin mode is OFF
      setIsAdminMode(false)
    }

    // Rest of the function remains the same
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError("")

        // Load inventory items directly from Supabase
        const supabase = getSupabaseClient()

        // Fetch inventory items
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventory_items")
          .select("*, categories(name)")
          .order("name")

        if (inventoryError) {
          throw inventoryError
        }

        // Transform the data to match our InventoryItem type
        const inventoryItems: InventoryItem[] = inventoryData.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category_id,
          categoryName: item.categories?.name,
          quantity: Number(item.quantity),
          studentLimit: Number(item.student_limit),
          limitDuration: item.limit_duration,
          limitDurationMinutes: item.limit_duration_minutes,
          unit: item.unit as "item" | "kg" | "lb" | null,
          isWeighed: item.is_weighed,
          hasLimit: item.has_limit,
          cost: item.cost ? Number(item.cost) : undefined,
          supplier: item.supplier || undefined,
        }))

        setItems(inventoryItems)
        setFilteredItems(inventoryItems)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name")

        if (categoriesError) {
          throw categoriesError
        }

        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Failed to load items from the database")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [lastRefreshed, router])

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
    // Check if adding this item would exceed the student limit
    const existingItem = cart.find((cartItem) => cartItem.item.id === item.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const newQuantity = currentQuantity + (item.isWeighed ? 0 : 1) // For weighed items, we'll handle this in the dialog

    // Check if adding would exceed the limit (skip for admin mode)
    if (!isAdminMode && item.hasLimit !== false && newQuantity > item.studentLimit) {
      toast({
        title: "Item limit reached",
        description: `You can only take up to ${item.studentLimit} ${item.unit || "units"} of ${item.name}`,
        variant: "destructive",
      })
      return
    }

    // For weighed items, open the quantity dialog
    if (item.isWeighed) {
      setSelectedItem(item)
      setCustomQuantity("")
      setQuantityDialogOpen(true)
      return
    }

    // For non-weighed items, proceed as before
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

    // Check if adding would exceed the student limit (skip for admin mode)
    const existingItem = cart.find((cartItem) => cartItem.item.id === selectedItem.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const newQuantity = currentQuantity + quantity

    if (!isAdminMode && selectedItem.hasLimit !== false && newQuantity > selectedItem.studentLimit) {
      toast({
        title: "Item limit reached",
        description: `You can only take up to ${selectedItem.studentLimit} ${selectedItem.unit || "units"} of ${
          selectedItem.name
        }`,
        variant: "destructive",
      })
      setQuantityDialogOpen(false)
      return
    }

    // Add to cart with custom quantity
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

  const handleCheckout = () => {
    if (isAdminMode && studentId.trim()) {
      // Process direct checkout for admin
      handleDirectCheckout()
    } else {
      // Regular checkout flow - save cart to localStorage for the checkout page
      localStorage.setItem(
        "cart",
        JSON.stringify(
          cart.map(({ item, quantity }) => ({
            ...item,
            quantity,
          })),
        ),
      )

      // Navigate to checkout page
      router.push("/dashboard/checkout")
    }
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

  // Format quantity for display
  const formatQuantity = (quantity: number, unit: string | null | undefined) => {
    if (unit === "kg" || unit === "lb") {
      // Use the formatWeight function for consistent decimal display
      return formatWeight(quantity)
    }
    // For items, show whole numbers
    return Math.round(quantity).toString()
  }

  // Check if an item is at its limit in the cart
  const isItemAtLimit = (item: InventoryItem) => {
    if (isAdminMode || item.hasLimit === false) return false

    const cartItem = cart.find((cartItem) => cartItem.item.id === item.id)
    return cartItem && cartItem.quantity >= item.studentLimit
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Browse Food Items</h1>
            <p className="text-lg text-primary mt-2">Select items to add to your cart</p>
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
          <h2 className="text-2xl font-bold">Available Items</h2>
          <p className="text-muted-foreground">Browse and select items from our inventory</p>
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
                  <TabsList className="grid grid-cols-3 sm:grid-cols-7">
                    <TabsTrigger value="all">All</TabsTrigger>
                    {categories.slice(0, 6).map((category) => (
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
                              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
                                <Info className="h-3 w-3 mr-1" />
                                Limit: {item.studentLimit} {item.unit || (item.studentLimit === 1 ? "item" : "items")}
                              </p>
                            )}
                            {item.cost && isAdminMode && (
                              <p className="text-sm text-muted-foreground">
                                Cost: ${item.cost.toFixed(2)} per {item.unit || "item"}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            disabled={item.quantity <= 0 || isItemAtLimit(item)}
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
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAdminMode ? "Admin Checkout" : "Your Cart"}
              </CardTitle>
              <CardDescription>Items you've selected</CardDescription>
            </CardHeader>
            <CardContent>
              {isAdminMode && (
                <div className="mb-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Admin Direct Checkout</span>
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
              )}

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
                        {!isAdminMode && item.hasLimit !== false && quantity >= item.studentLimit && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">Limit reached</p>
                        )}
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => addToCart(item)}
                          disabled={!isAdminMode && item.hasLimit !== false && quantity >= item.studentLimit}
                        >
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
                disabled={cart.length === 0 || (isAdminMode && !studentId.trim()) || isProcessing}
                onClick={handleCheckout}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Processing...
                  </span>
                ) : isAdminMode ? (
                  "Process Direct Checkout"
                ) : (
                  "Proceed to Checkout"
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
              {selectedItem && selectedItem.hasLimit !== false && !isAdminMode && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
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
