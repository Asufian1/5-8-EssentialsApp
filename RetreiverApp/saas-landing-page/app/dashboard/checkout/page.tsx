"use client"
//added usability for checking items out for students and staff 

import { Label } from "@/components/ui/label"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingBasket, Minus, Plus, X, Mail, UserCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/lib/types"
import { getInventoryItems, takeItems } from "@/lib/data"

export default function CheckoutPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [studentId, setStudentId] = useState("")
  const [showEmailAlert, setShowEmailAlert] = useState(false)
  const [checkoutComplete, setCheckoutComplete] = useState(false)

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

  const loadInventory = () => {
    const inventoryItems = getInventoryItems()
    setItems(inventoryItems)
    setFilteredItems(inventoryItems)
  }

  const addToCart = (item: InventoryItem) => {
    // Check if item is already in cart
    const existingItem = cart.find((cartItem) => cartItem.item.id === item.id)

    if (existingItem) {
      // If item exists, update quantity
      const updatedCart = cart.map((cartItem) =>
        cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
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
    if (inventoryItem && quantity > inventoryItem.quantity) {
      alert(`Only ${inventoryItem.quantity} items available in stock`)
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
      alert("Cart is empty")
      return
    }

    if (!studentId.trim()) {
      alert("Please enter a student ID")
      return
    }

    // Process the checkout
    takeItems(
      cart.map((cartItem) => ({
        itemId: cartItem.item.id,
        itemName: cartItem.item.name,
        quantity: cartItem.quantity,
        user: studentId,
      })),
    )

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
                  onChange={(e) => setStudentId(e.target.value)}
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
                          disabled={cartItem.quantity >= cartItem.item.quantity}
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
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div
                    className={`relative h-40 ${getColorForCategory(item.category)} flex items-center justify-center`}
                  >
                    <h3 className="font-bold text-xl">{item.name}</h3>
                    <div className="absolute top-2 right-2 bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
                      {item.quantity} in stock
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addToCart(item)}
                      disabled={item.quantity === 0}
                    >
                      {item.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
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

