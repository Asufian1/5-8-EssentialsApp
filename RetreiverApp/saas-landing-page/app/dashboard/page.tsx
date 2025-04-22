"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingBasket, Minus, Plus, X, Mail, AlertTriangle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem, Order } from "@/lib/types"
import { getInventoryItems, takeItems, canStudentTakeItem, getOrders, formatTimeRestriction } from "@/lib/data"

export default function TakeItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [username, setUsername] = useState("")
  const [showEmailAlert, setShowEmailAlert] = useState(false)
  const [itemLimits, setItemLimits] = useState<
    Record<string, { allowed: boolean; reason?: string; availableQuantity?: number }>
  >({})
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [showOrderPlacedAlert, setShowOrderPlacedAlert] = useState(false)

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    setUsername(storedUsername || "")

    // Load inventory data
    loadInventory()

    // Load pending orders
    loadPendingOrders(storedUsername || "")
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
    // Check limits for each item
    if (username) {
      const limits: Record<string, { allowed: boolean; reason?: string; availableQuantity?: number }> = {}

      items.forEach((item) => {
        limits[item.id] = canStudentTakeItem(username, item.id, 1)
      })

      setItemLimits(limits)
    }
  }, [items, username])

  const loadInventory = () => {
    const inventoryItems = getInventoryItems()
    setItems(inventoryItems)
    setFilteredItems(inventoryItems)
  }

  const loadPendingOrders = (studentId: string) => {
    const allOrders = getOrders()
    const studentPendingOrders = allOrders.filter(
      (order) => order.studentId === studentId && order.status === "pending",
    )
    setPendingOrders(studentPendingOrders)
  }

  const addToCart = (item: InventoryItem) => {
    // Check if student can take this item
    const checkResult = canStudentTakeItem(username, item.id, 1)
    if (!checkResult.allowed) {
      alert(checkResult.reason || "You cannot take this item at this time")
      return
    }

    // Check if item is already in cart
    const existingItem = cart.find((cartItem) => cartItem.item.id === item.id)

    if (existingItem) {
      // Check if adding one more would exceed the limit
      const newQuantity = existingItem.quantity + 1
      const limitCheck = canStudentTakeItem(username, item.id, newQuantity)

      if (!limitCheck.allowed) {
        alert(limitCheck.reason || `You can only take up to ${item.studentLimit} of this item`)
        return
      }

      // If item exists and within limits, update quantity
      const updatedCart = cart.map((cartItem) =>
        cartItem.item.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem,
      )
      setCart(updatedCart)
    } else {
      // If item doesn't exist, add to cart with quantity 1
      setCart([...cart, { item, quantity: 1 }])
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
    const limitCheck = canStudentTakeItem(username, itemId, quantity)
    if (!limitCheck.allowed) {
      alert(limitCheck.reason || `You can only take up to ${inventoryItem.studentLimit} of this item`)
      return
    }

    if (inventoryItem && quantity > inventoryItem.quantity) {
      alert(`Only ${inventoryItem.quantity} items available in stock`)
      return
    }

    const updatedCart = cart.map((cartItem) => (cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem))
    setCart(updatedCart)
  }

  // Function to simulate sending an email notification
  const sendEmailNotification = (username: string, cartItems: { item: InventoryItem; quantity: number }[]) => {
    console.log("Sending email notification to asufian1@umbc.edu")
    console.log(`Student: ${username}`)
    console.log("Items:")
    cartItems.forEach((cartItem) => {
      console.log(`- ${cartItem.item.name} (${cartItem.item.category}): ${cartItem.quantity}`)
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
      alert("Your cart is empty")
      return
    }

    // Process the checkout
    const result = takeItems(
      cart.map((cartItem) => ({
        itemId: cartItem.item.id,
        itemName: cartItem.item.name,
        quantity: cartItem.quantity,
        user: username,
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
    sendEmailNotification(username, cart)

    // Show order placed alert
    setShowOrderPlacedAlert(true)
    setTimeout(() => {
      setShowOrderPlacedAlert(false)
    }, 5000)

    // Reset cart and reload inventory
    setCart([])
    loadInventory()

    // Reload pending orders
    loadPendingOrders(username)
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

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Take Food Items</h1>
            <p className="text-lg text-primary mt-2">Select items you need from our inventory</p>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <Card className="border-t-4 border-primary">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-3 rounded-full">
              <ShoppingBasket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Retriever's Essentials Location</h3>
              <p className="text-muted-foreground">UMBC Commons Building, Second Floor, Next to the Bookstore</p>
              <p className="text-muted-foreground mt-1">Open Monday-Friday, 10AM-4PM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email notification alert */}
      {showEmailAlert && (
        <Alert className="bg-green-50 border-green-200">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertTitle>Order Notification Sent</AlertTitle>
          <AlertDescription>
            Your order details have been sent to the store administrator at asufian1@umbc.edu
          </AlertDescription>
        </Alert>
      )}

      {/* Order placed alert */}
      {showOrderPlacedAlert && (
        <Alert className="bg-green-50 border-green-200">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertTitle>Order Placed Successfully</AlertTitle>
          <AlertDescription>
            Your order has been placed and is pending fulfillment. You'll be notified when it's ready for pickup.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <Card className="border-t-4 border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-amber-500" />
              Your Pending Orders
            </CardTitle>
            <CardDescription>
              You have {pendingOrders.length} pending {pendingOrders.length === 1 ? "order" : "orders"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Order #{order.id.substring(0, 8)}...</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.itemName}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-amber-50 p-2 rounded-md flex items-center">
                    <Clock className="h-4 w-4 text-amber-600 mr-2" />
                    <p className="text-sm text-amber-600">
                      Your order is being prepared. You'll be notified when it's ready for pickup.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <div className="w-full md:w-64 space-y-4">
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
                Your Cart
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
                          onClick={() => updateCartItemQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{cartItem.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() => updateCartItemQuantity(cartItem.item.id, cartItem.quantity + 1)}
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
                  <p className="mt-2 text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground">Add items from the available items list</p>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                className="w-full bg-primary text-black hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout
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
                const itemLimit = itemLimits[item.id]
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
                        {item.quantity} in stock
                      </div>
                      {item.studentLimit > 0 && (
                        <div className="absolute top-2 left-2 bg-white/80 text-black text-xs font-bold px-2 py-1 rounded-full">
                          Limit: {item.studentLimit} per student
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Time restriction: {formatTimeRestriction(item.limitDuration, item.limitDurationMinutes || 0)}
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
                        disabled={item.quantity === 0 || isRestricted}
                      >
                        {item.quantity === 0 ? "Out of Stock" : isRestricted ? "Restricted" : "Add to Cart"}
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
