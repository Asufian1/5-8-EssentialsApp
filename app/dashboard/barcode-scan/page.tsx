"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, Barcode } from "lucide-react"
import { supabaseConfig } from "@/lib/supabase-config"

// Direct API approach
const API_URL = supabaseConfig.supabaseUrl
const API_KEY = supabaseConfig.supabaseAnonKey

// Simple fetch wrapper
async function fetchSupabase(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`
  const headers = {
    ...options.headers,
    apikey: API_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }

  try {
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
    console.error(`Fetch error for ${url}:`, error)
    throw error
  }
}

export default function BarcodeScanPage() {
  // Basic state
  const [showScanner, setShowScanner] = useState(false)
  const [barcode, setBarcode] = useState("")
  const [itemName, setItemName] = useState("")
  const [category, setCategory] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("0.00")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info" | null; text: string }>({
    type: null,
    text: "",
  })
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [dbConnected, setDbConnected] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null)

  // Load categories on mount
  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  // Check database connection
  const checkDatabaseConnection = async () => {
    setIsCheckingConnection(true)

    try {
      const data = await fetchSupabase("/rest/v1/categories?select=count")
      setDbConnected(true)
      setMessage({
        type: "success",
        text: "Database connected successfully!",
      })
      loadCategories()
    } catch (err) {
      setDbConnected(false)
      setMessage({
        type: "error",
        text: "Exception connecting to database: " + String(err),
      })
    } finally {
      setIsCheckingConnection(false)
      setLastConnectionCheck(new Date())
    }
  }

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await fetchSupabase("/rest/v1/categories?select=id,name&order=name")
      setCategories(data || [])
    } catch (err) {
      console.error("Failed to load categories:", err)
    }
  }

  // Handle barcode scan - Fixed to prevent refreshing
  const handleScan = (scannedBarcode: string) => {
    console.log("Barcode scanned:", scannedBarcode)

    // Close the scanner first
    setShowScanner(false)

    // Set the barcode value
    setBarcode(scannedBarcode)

    // Look up the item directly instead of triggering a button click
    lookupItem(scannedBarcode)
  }

  // Look up item
  const lookupItem = async (barcodeToLookup: string) => {
    if (!barcodeToLookup) {
      setMessage({
        type: "error",
        text: "Please enter a barcode to look up.",
      })
      return
    }

    setIsLoading(true)
    setMessage({ type: "info", text: "Looking up item..." })

    try {
      const items = await fetchSupabase(`/rest/v1/inventory_items?id=eq.${encodeURIComponent(barcodeToLookup)}`)

      if (!items || items.length === 0) {
        setMessage({
          type: "info",
          text: "No item found with this barcode. You can add it as a new item.",
        })
        setItemName("")
        setCategory("")
        setQuantity("1")
        setPrice("0.00")
      } else {
        const data = items[0]
        setItemName(data.name || "")
        setCategory(data.category_id || "")
        setQuantity((data.quantity || 0).toString())
        setPrice((data.cost || 0).toString())
        setMessage({
          type: "success",
          text: "Item found! You can update it or scan another barcode.",
        })
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Exception looking up item: " + String(err),
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!barcode || !itemName || !category) {
      setMessage({
        type: "error",
        text: "Please fill in all required fields (barcode, name, and category).",
      })
      return
    }

    setIsLoading(true)
    setMessage({ type: "info", text: "Saving item..." })

    try {
      // Check if item exists
      const existingItems = await fetchSupabase(
        `/rest/v1/inventory_items?id=eq.${encodeURIComponent(barcode)}&select=id,quantity`,
      )
      const existingItem = existingItems.length > 0 ? existingItems[0] : null

      if (existingItem) {
        // Update existing item
        const updatedItem = {
          name: itemName,
          category_id: category,
          quantity: Number.parseInt(quantity),
          cost: Number.parseFloat(price),
          updated_at: new Date().toISOString(),
        }

        await fetchSupabase(`/rest/v1/inventory_items?id=eq.${encodeURIComponent(existingItem.id)}`, {
          method: "PATCH",
          body: JSON.stringify(updatedItem),
        })

        // Create transaction record for update
        const transaction = {
          id: `tx-${Date.now()}-${existingItem.id}`,
          type: "in",
          item_id: existingItem.id,
          item_name: itemName,
          quantity: Number.parseInt(quantity) - (existingItem.quantity || 0),
          user_id: "admin",
          timestamp: new Date().toISOString(),
          cost: Number.parseFloat(price),
        }

        await fetchSupabase("/rest/v1/transactions", {
          method: "POST",
          body: JSON.stringify(transaction),
        })

        setMessage({
          type: "success",
          text: "Item updated successfully!",
        })
      } else {
        // Insert new item
        const newItem = {
          id: barcode,
          name: itemName,
          category_id: category,
          quantity: Number.parseInt(quantity),
          cost: Number.parseFloat(price),
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
        }

        await fetchSupabase("/rest/v1/inventory_items", {
          method: "POST",
          body: JSON.stringify(newItem),
        })

        // Create transaction record for new item
        const transaction = {
          id: `tx-${Date.now()}-${barcode}`,
          type: "in",
          item_id: barcode,
          item_name: itemName,
          quantity: Number.parseInt(quantity),
          user_id: "admin",
          timestamp: new Date().toISOString(),
          cost: Number.parseFloat(price),
        }

        await fetchSupabase("/rest/v1/transactions", {
          method: "POST",
          body: JSON.stringify(transaction),
        })

        setMessage({
          type: "success",
          text: "Item added successfully!",
        })
      }

      // Clear form for next item
      setBarcode("")
      setItemName("")
      setCategory("")
      setQuantity("1")
      setPrice("0.00")
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Error saving item: " + (err.message || "Unknown error"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Barcode Scanner</h1>

      {/* Database connection status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Database Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {isCheckingConnection ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin text-muted-foreground" />
                <span>Checking database connection...</span>
              </>
            ) : dbConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                <span className="text-green-700 dark:text-green-400">
                  Database connected
                  {lastConnectionCheck && (
                    <span className="text-xs ml-2">(Last checked: {lastConnectionCheck.toLocaleTimeString()})</span>
                  )}
                </span>
                <Button size="sm" variant="outline" onClick={checkDatabaseConnection} className="ml-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Connection
                </Button>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                <span className="text-red-700 dark:text-red-400 mr-4">Database not connected</span>
                <Button size="sm" variant="outline" onClick={checkDatabaseConnection} className="ml-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </>
            )}
          </div>
          {message.type && (
            <div
              className={`mt-2 p-2 rounded-md text-sm ${
                message.type === "error"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : message.type === "success"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {showScanner ? (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan or Enter Barcode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter or scan barcode"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" onClick={() => setShowScanner(true)} disabled={isLoading}>
                    <Barcode className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    id="lookup-button"
                    type="button"
                    variant="outline"
                    onClick={() => lookupItem(barcode)}
                    disabled={!barcode || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      "Look Up"
                    )}
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Enter item name"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Item"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
