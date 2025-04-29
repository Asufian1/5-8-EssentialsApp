"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingBasket, Minus, Plus, X, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/lib/types"
import { getInventoryItems, formatTimeRestriction } from "@/lib/data"
import { useRouter } from "next/navigation"

export default function TakeItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [cart, setCart] = useState<{
    id: string
    name: string
    quantity: number
    category: string
    unit?: string | null
    studentLimit: number
  }[]>([])
  const [showOrderPlacedAlert, setShowOrderPlacedAlert] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadInventory()
  }, [])

  useEffect(() => {
    let filtered = [...items]
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }
    setFilteredItems(filtered)
  }, [items, searchQuery, categoryFilter])

  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch {
        console.error("Error loading cart from localStorage")
      }
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart))
    } catch {
      console.error("Error saving cart to localStorage")
    }
  }, [cart])

  const loadInventory = () => {
    const inventoryItems = getInventoryItems()
    setItems(inventoryItems)
    setFilteredItems(inventoryItems)
  }

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      const delta = item.isWeighed ? 0.1 : 1
      const newQuantity = existing.quantity + delta
      // enforce limit only if studentLimit > 0
      if (item.studentLimit > 0 && newQuantity > item.studentLimit) {
        alert(`Limited to ${item.studentLimit} ${item.unit || "items"} per student`)
        return
      }
      setCart(
        cart.map(c =>
          c.id === item.id ? { ...c, quantity: newQuantity } : c
        )
      )
    } else {
      const initialQuantity = item.isWeighed ? 0.1 : 1
      if (item.studentLimit > 0 && initialQuantity > item.studentLimit) {
        alert(`Limited to ${item.studentLimit} ${item.unit || "items"} per student`)
        return
      }
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          quantity: initialQuantity,
          category: item.category,
          unit: item.unit,
          studentLimit: item.studentLimit,
        },
      ])
    }
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.id !== itemId))
  }

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    const inventoryItem = items.find(i => i.id === itemId)
    if (!inventoryItem) return
    if (
      inventoryItem.studentLimit > 0 &&
      quantity > inventoryItem.studentLimit
    ) {
      alert(
        `Limited to ${inventoryItem.studentLimit} ${
          inventoryItem.unit || "items"
        } per student`
      )
      return
    }
    setCart(
      cart.map(c =>
        c.id === itemId ? { ...c, quantity } : c
      )
    )
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty")
      return
    }
    router.push("/dashboard/checkout")
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

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Take Food Items
            </h1>
            <p className="text-lg text-primary mt-2">
              Select items you need from our inventory
            </p>
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
              <p className="text-muted-foreground">
                UMBC Commons Building, Second Floor, Next to the Bookstore
              </p>
              <p className="text-muted-foreground mt-1">
                Open Monday-Friday, 10AM-4PM
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order placed alert */}
      {showOrderPlacedAlert && (
        <Alert className="bg-green-50 border-green-200">
          <Clock className="h-4 w-4 text-green-600" />
          <AlertTitle>Order Placed Successfully</AlertTitle>
          <AlertDescription>...</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters and Cart */}
        <div className="w-full md:w-64 space-y-4">
          {/* Filter Card */}
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
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Category</p>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="essentials">Essentials</SelectItem>
                    {/* ...other categories... */}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card className="border-t-4 border-primary sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBasket className="mr-2 h-5 w-5 text-primary" /> Your Cart
              </CardTitle>
              <CardDescription>
                {cart.length} {cart.length === 1 ? "item" : "items"} selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-auto pr-2">
                  {cart.map(ci => (
                    <div key={ci.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ci.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {ci.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() =>
                            updateCartItemQuantity(
                              ci.id,
                              ci.quantity - (ci.unit === "kg" || ci.unit === "lb" ? 0.1 : 1)
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">
                          {ci.unit === "kg" || ci.unit === "lb"
                            ? ci.quantity.toFixed(1)
                            : ci.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={() =>
                            updateCartItemQuantity(
                              ci.id,
                              ci.quantity + (ci.unit === "kg" || ci.unit === "lb" ? 0.1 : 1)
                            )
                          }
                          disabled={
                            ci.studentLimit > 0 && ci.quantity >= ci.studentLimit
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFromCart(ci.id)}
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
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-primary text-black hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Go to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Items Grid */}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Available Items</h2>
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div
                    className={`relative h-40 ${getColorForCategory(item.category)} flex items-center justify-center`}
                  >
                    <h3 className="font-bold text-xl">{item.name}</h3>
                    <div className="absolute top-2 right-2 bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
                      {item.isWeighed
                        ? `${item.quantity.toFixed(1)} ${item.unit}`
                        : `${item.quantity} ${item.unit || "items"}`} in stock
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
                      Time restriction: {formatTimeRestriction(
                        item.limitDuration,
                        item.limitDurationMinutes || 0
                      )}
                    </p>
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
