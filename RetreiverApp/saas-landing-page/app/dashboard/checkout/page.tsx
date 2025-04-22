"use client"

import type React from "react"

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingBasket, Minus, Plus, X, Mail, UserCheck, AlertTriangle, Scale } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/lib/types"
import { getInventoryItems, takeItems, canStudentTakeItem, formatQuantityWithUnit } from "@/lib/data"

export default function CheckoutPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [studentId, setStudentId] = useState("")
  const [showEmailAlert, setShowEmailAlert] = useState(false)
  const [checkoutComplete, setCheckoutComplete] = useState(false)
  const [itemLimits, setItemLimits] = useState<
    Record<string, { allowed: boolean; reason?: string; availableQuantity?: number }>
  >({})

  useEffect(() => {
    // Load inventory data
    loadInventory()
  }, [])

  useEffect(() => {
    // Filter items based on search query and category
    let filtered = [...items]

    if (searchQuery) {
      filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [items, searchQuery, categoryFilter])

  useEffect(() => {
    // Check limits for each item when student ID changes
    if (studentId) {
      const limits: Record<string, { allowed: boolean; reason?: string; availableQuantity?: number }> = {}

      items.forEach((item) => {
        limits[item.id] = canStudentTakeItem(studentId, item.id, 1)
      })

      setItemLimits(limits)
    } else {
      setItemLimits({})
    }
  }, [items, studentId])

  const loadInventory = () => {
    const inventoryItems = getInventoryItems()
    setItems(inventoryItems)
    setFilteredItems(inventoryItems)
  }

  const addToCart = (item: InventoryItem) => {
    if (!studentId.trim()) {
      alert("Please enter a student ID first")
      return
    }

    // Check if student can take this item
    const checkResult = canStudentTakeItem(studentId, item.id, 1)
    if (!checkResult.allowed) {
      alert(checkResult.reason || "This student cannot take this item at this time")
      return
    }

    // Check if item is already in cart
    const existingItem = cart.find((cartItem) => cartItem.item.id === item.id)

    if (existingItem) {
      // Check if adding one more would exceed the limit
      const newQuantity = item.isWeighed
        ? existingItem.quantity + 0.1 // Add 0.1 for weighed items
        : existingItem.quantity + 1 // Add 1 for regular items

      const limitCheck = canStudentTakeItem(studentId, item.id, newQuantity)

      if (!limitCheck.allowed) {
        alert(
          limitCheck.reason || `Student can only take up to ${formatQuantityWithUnit(item.studentLimit, item.unit)}`,
        )
        return
      }

      // If item exists and within limits, update quantity
      const updatedCart = cart.map((cartItem) =>
        cartItem.item.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem,
      )
      setCart(updatedCart)
    } else {
      // If item doesn't exist, add to cart with quantity 1 or 0.1 for weighed items
      const initialQuantity = item.isWeighed ? 0.1 : 1
      setCart([...cart, { item, quantity: initialQuantity }])
    }
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((cartItem) => cartItem.item.id !== itemId))
  }

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    // Check if quantity is available in inventory
    const inventoryItem = items.find((item) => item.id === itemId)
    if (!inventoryItem) return

    // Check if quantity exceeds student limit
    const limitCheck = canStudentTakeItem(studentId, itemId, quantity)
    if (!limitCheck.allowed) {
      alert(
        limitCheck.reason ||
          `Student can only take up to ${formatQuantityWithUnit(inventoryItem.studentLimit, inventoryItem.unit)}`,
      )
      return
    }

    if (inventoryItem && quantity > inventoryItem.quantity) {
      alert(`Only ${formatQuantityWithUnit(inventoryItem.quantity, inventoryItem.unit)} available in stock`)
      return
    }

    const updatedCart = cart.map((cartItem) => (cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem))
    setCart(updatedCart)
  }

  // Function to simulate sending an email notification
  const sendEmailNotification = (studentId: string, cartItems: { item: InventoryItem; quantity: number }[]) => {
    console.log("Sending email notification to asufian1@umbc.edu")
    console.log(`Student ID: ${studentId}`)
    console.log("Items:")
    cartItems.forEach((cartItem) => {
      console.log(
        `- ${cartItem.item.name} (${cartItem.item.category}): ${formatQuantityWithUnit(cartItem.quantity, cartItem.item.unit)}`,
      )
    })

    // In a real implementation, this would use an email API
    // For now, we'll just show an alert to simulate the email being sent
    setShowEmailAlert(true)
    setTimeout(() => {
      setShowEmailAlert(false)
    }, 5000)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty")
      return
    }

    if (!studentId.trim()) {
      alert("Please enter a student ID")
      return
    }

    // Process the checkout
    const result = takeItems(
      cart.map((cartItem) => ({
        itemId: cartItem.item.id,
        itemName: cartItem.item.name,
        quantity: cartItem.quantity,
        user: studentId,
        unit: cartItem.item.unit,
      })),
    )

    if (!result.success) {
      // Handle errors
      if (result.errors) {
        const errorMessages = Object.values(result.errors).join("\n")
        alert(`Checkout failed:\n${errorMessages}`)
      } else {
        alert("Checkout failed. Please try again.")
      }
      return
    }

    // Send email notification
    sendEmailNotification(studentId, cart)

    // Show checkout complete message
    setCheckoutComplete(true)

    // Reset cart and reload inventory
    setCart([])
    loadInventory()

    // Reset checkout complete message after a delay
    setTimeout(() => {
      setCheckoutComplete(false)
    }, 5000)
  }

  // Function to get color based on category
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

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentId(e.target.value)
    // Clear cart when student ID changes
    if (cart.length > 0) {
      setCart([])
    }
  }

  const formatTimeRestriction = (limitDuration: number, limitDurationMinutes: number) => {
    if (limitDuration > 0) {
      return `${limitDuration} days`
    } else if (limitDurationMinutes > 0) {
      return `${limitDurationMinutes} minutes`
    } else {
      return "No time restriction"
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Student Checkout</h1>
            <p className="text-lg text-primary mt-2">Help students check out items in person</p>
          </div>
        </div>
      </div>

      {/* Email notification alert */}
      {showEmailAlert && (
        <Alert className="bg-green-50 border-green-200">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertTitle>Order Notification Sent</AlertTitle>
          <AlertDescription>Order details for student {studentId} have been sent to asufian1@umbc.edu</AlertDescription>
        </Alert>
      )}

      {/* Checkout complete alert */}
      {checkoutComplete && (
        <Alert className="bg-green-50 border-green-200">
          <UserCheck className="h-4 w-4 text-green-600" />
          <AlertTitle>Checkout Complete</AlertTitle>
          <AlertDescription>Student {studentId} has successfully checked out items</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters and Cart */}
        <div className="w-full md:w-64 space-y-4">
          {/* Student ID Input */}
          <Card className="border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Enter the student's ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="Enter student ID"
                  value={studentId}
                  onChange={handleStudentIdChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Filter Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Category</p>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="essentials">Essentials</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="canned">Canned Goods</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="south-asian">South Asian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className="border-t-4 border-primary sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBasket className="mr-2 h-5 w-5 text-primary" />
                Student's Cart
              </CardTitle>
              <CardDescription>
                {cart.length} {cart.length === 1 ? "item" : "items"} selected
              </CardDescription>
            </CardHeader>

            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-auto pr-2">
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cartItem.item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{cartItem.item.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => {
                            const decrementAmount = cartItem.item.isWeighed ? 0.1 : 1
                            updateCartItemQuantity(cartItem.item.id, cartItem.quantity - decrementAmount)
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center text-sm">
                          {cartItem.item.isWeighed ? cartItem.quantity.toFixed(1) : cartItem.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => {
                            const incrementAmount = cartItem.item.isWeighed ? 0.1 : 1
                            updateCartItemQuantity(cartItem.item.id, cartItem.quantity + incrementAmount)
                          }}
                          disabled={
                            cartItem.quantity >= cartItem.item.quantity ||
                            cartItem.quantity >= cartItem.item.studentLimit
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFromCart(cartItem.item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBasket className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">Cart is empty</p>
                  <p className="text-sm text-muted-foreground">Add items from the available items list</p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full bg-primary text-black hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={cart.length === 0 || !studentId.trim()}
              >
                Complete Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Items Grid */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Available Items</h2>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const itemLimit = studentId ? itemLimits[item.id] : null
                const isRestricted = itemLimit && !itemLimit.allowed

                return (
                  <Card
                    key={item.id}
                    className={`overflow-hidden hover:shadow-md transition-shadow ${isRestricted ? "border-amber-300" : ""}`}
                  >
                    <div
                      className={`relative h-40 ${getColorForCategory(item.category)} flex items-center justify-center`}
                    >
                      <h3 className="font-bold text-xl">{item.name}</h3>
                      <div className="absolute top-2 right-2 bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
                        {item.isWeighed ? `${item.quantity.toFixed(2)} ${item.unit}` : `${item.quantity} in stock`}
                      </div>
                      {item.studentLimit > 0 && (
                        <div className="absolute top-2 left-2 bg-white/80 text-black text-xs font-bold px-2 py-1 rounded-full">
                          Limit: {item.isWeighed ? `${item.studentLimit.toFixed(2)} ${item.unit}` : item.studentLimit}{" "}
                          per student
                        </div>
                      )}
                      {item.isWeighed && (
                        <div className="absolute bottom-2 left-2 bg-white/80 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <Scale className="h-3 w-3 mr-1" />
                          Weighed Item
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Time restriction: {formatTimeRestriction(item.limitDuration, item.limitDurationMinutes)}
                      </p>

                      {isRestricted && (
                        <div className="mt-2 flex items-center text-amber-600 text-sm">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span>{itemLimit.reason}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => addToCart(item)}
                        disabled={item.quantity === 0 || isRestricted || !studentId}
                      >
                        {!studentId
                          ? "Enter Student ID"
                          : item.quantity === 0
                            ? "Out of Stock"
                            : isRestricted
                              ? "Restricted"
                              : "Add to Cart"}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No items found matching your criteria</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
