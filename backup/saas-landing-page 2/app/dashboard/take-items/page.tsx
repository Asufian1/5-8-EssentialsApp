"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, ShoppingCart, Plus, Minus, Scale, RefreshCw, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { InventoryItem } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

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

  const router = useRouter()

  useEffect(() => {
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

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find((cartItem) => cartItem.item.id === itemId)

    if (existingItem && existingItem.quantity > 1) {
      // Decrement quantity
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
    // Save cart to localStorage for the checkout page
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
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
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
                              Available: <span className="font-medium">{item.quantity}</span>
                            </p>
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
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Your Cart
              </CardTitle>
              <CardDescription>Items you've selected</CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-4">
                  {cart.map(({ item, quantity }) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {quantity} {item.unit || "item"}
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
                        <span className="w-4 text-center">{quantity}</span>
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
              <Button className="w-full" disabled={cart.length === 0} onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Last refreshed indicator */}
      <div className="text-xs text-muted-foreground text-right">
        Last database fetch: {lastRefreshed.toLocaleTimeString()}
      </div>
    </div>
  )
}
