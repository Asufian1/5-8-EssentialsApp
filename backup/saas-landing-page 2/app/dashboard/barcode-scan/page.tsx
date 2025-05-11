"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Barcode, Search, Plus, RefreshCw, ArrowLeft } from "lucide-react"
import { getInventoryItems, addInventoryItem, updateInventoryItem, formatQuantityWithUnit } from "@/lib/data"
import type { InventoryItem } from "@/lib/types"
import Link from "next/link"

export default function BarcodeScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "search"

  const [showScanner, setShowScanner] = useState(false)
  const [barcode, setBarcode] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    id: "", // Using id as barcode
    category: "essentials",
    quantity: 1,
    studentLimit: 1,
    limitDuration: 7,
    limitDurationMinutes: 0,
    unit: "item",
    isWeighed: false,
  })

  useEffect(() => {
    // Load inventory items
    const items = getInventoryItems()
    setInventoryItems(items)
  }, [])

  const getItemByBarcode = (barcode: string): InventoryItem | null => {
    return inventoryItems.find((item) => item.id === barcode) || null
  }

  const handleScan = (scannedBarcode: string) => {
    setBarcode(scannedBarcode)
    setShowScanner(false)

    if (mode === "search" || mode === "update") {
      const foundItem = getItemByBarcode(scannedBarcode)
      setItem(foundItem || null)

      if (!foundItem) {
        setMessage({
          text: `No item found with barcode ${scannedBarcode}`,
          type: "error",
        })
      } else {
        setMessage(null)
      }

      if (mode === "update" && foundItem) {
        setQuantity(1) // Reset quantity for updates
      }
    } else if (mode === "add") {
      // Check if item with this barcode already exists
      const existingItem = getItemByBarcode(scannedBarcode)

      if (existingItem) {
        setMessage({
          text: `Item with barcode ${scannedBarcode} already exists`,
          type: "error",
        })
        setItem(existingItem)
      } else {
        setNewItem({
          ...newItem,
          id: scannedBarcode, // Using id as barcode
        })
        setMessage(null)
      }
    }
  }

  const handleManualSearch = () => {
    if (!barcode.trim()) {
      setMessage({
        text: "Please enter a barcode",
        type: "error",
      })
      return
    }

    handleScan(barcode)
  }

  const handleUpdateQuantity = (action: "add" | "remove") => {
    if (!item) return

    try {
      const newQuantity = action === "add" ? item.quantity + quantity : item.quantity - quantity

      if (newQuantity < 0) {
        setMessage({
          text: "Cannot remove more than available quantity",
          type: "error",
        })
        return
      }

      const updatedItem = {
        ...item,
        quantity: newQuantity,
      }

      updateInventoryItem(updatedItem)

      // Refresh inventory items
      const items = getInventoryItems()
      setInventoryItems(items)

      // Update the current item
      setItem(updatedItem)

      setMessage({
        text: `Successfully ${action === "add" ? "added" : "removed"} ${quantity} ${item.unit || "items"}`,
        type: "success",
      })
    } catch (error) {
      setMessage({
        text: "Failed to update quantity",
        type: "error",
      })
    }
  }

  const handleAddNewItem = () => {
    if (!newItem.name || !newItem.id) {
      setMessage({
        text: "Name and barcode are required",
        type: "error",
      })
      return
    }

    try {
      const itemToAdd: InventoryItem = {
        id: newItem.id,
        name: newItem.name || "",
        category: newItem.category || "essentials",
        quantity: newItem.quantity || 1,
        studentLimit: newItem.studentLimit || 1,
        limitDuration: newItem.limitDuration || 7,
        limitDurationMinutes: newItem.limitDurationMinutes || 0,
        unit: newItem.unit || "item",
        isWeighed: newItem.isWeighed || false,
      }

      addInventoryItem(itemToAdd)

      // Refresh inventory items
      const items = getInventoryItems()
      setInventoryItems(items)

      setMessage({
        text: `Successfully added ${itemToAdd.name} to inventory`,
        type: "success",
      })

      // Reset form
      setNewItem({
        name: "",
        id: "",
        category: "essentials",
        quantity: 1,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      })
      setBarcode("")
    } catch (error) {
      setMessage({
        text: "Failed to add item",
        type: "error",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/inventory">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Barcode Scanner</h1>
      </div>

      <Tabs defaultValue={mode} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="search" onClick={() => router.push("/dashboard/barcode-scan?mode=search")}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="update" onClick={() => router.push("/dashboard/barcode-scan?mode=update")}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Update
          </TabsTrigger>
          <TabsTrigger value="add" onClick={() => router.push("/dashboard/barcode-scan?mode=add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </TabsTrigger>
        </TabsList>

        {showScanner ? (
          <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        ) : (
          <>
            <div className="flex items-end gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="barcode">Barcode</Label>
                <div className="flex mt-1">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter barcode"
                    className="rounded-r-none"
                  />
                  <Button onClick={() => setShowScanner(true)} className="rounded-l-none" variant="secondary">
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleManualSearch}>Search</Button>
            </div>

            {message && (
              <div
                className={`p-4 mb-6 rounded-md ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <TabsContent value="search">
              {item && (
                <Card>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>Barcode: {item.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Quantity:</span>
                        <span>{formatQuantityWithUnit(item.quantity, item.unit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Limit:</span>
                        <span>{formatQuantityWithUnit(item.studentLimit, item.unit)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => router.push(`/dashboard/inventory?itemId=${item.id}`)} className="w-full">
                      View in Inventory
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="update">
              {item ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>Barcode: {item.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Quantity:</span>
                        <span>{formatQuantityWithUnit(item.quantity, item.unit)}</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity to Update</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    <Button onClick={() => handleUpdateQuantity("add")} className="flex-1">
                      Add
                    </Button>
                    <Button
                      onClick={() => handleUpdateQuantity("remove")}
                      variant="outline"
                      className="flex-1"
                      disabled={item.quantity < 1}
                    >
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="text-black dark:text-black font-medium">
                    Scan or enter a barcode to update item quantity
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="add">
              {item ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Item Already Exists</CardTitle>
                    <CardDescription>Barcode: {item.id}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Quantity:</span>
                        <span>{formatQuantityWithUnit(item.quantity, item.unit)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => router.push(`/dashboard/inventory?itemId=${item.id}`)} className="w-full">
                      View in Inventory
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Add New Item</CardTitle>
                    <CardDescription>Enter item details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-barcode">Barcode</Label>
                        <Input
                          id="new-barcode"
                          value={newItem.id}
                          onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                          placeholder="Barcode"
                          disabled={!!barcode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Name</Label>
                        <Input
                          id="new-name"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          placeholder="Item name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-category">Category</Label>
                        <select
                          id="new-category"
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="essentials">Essentials</option>
                          <option value="grains">Grains</option>
                          <option value="dairy">Dairy</option>
                          <option value="produce">Produce</option>
                          <option value="canned">Canned</option>
                          <option value="south-asian">South Asian</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-quantity">Initial Quantity</Label>
                        <Input
                          id="new-quantity"
                          type="number"
                          min="1"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-unit">Unit</Label>
                        <select
                          id="new-unit"
                          value={newItem.unit}
                          onChange={(e) => {
                            const unit = e.target.value as "item" | "kg" | "lb"
                            setNewItem({
                              ...newItem,
                              unit: unit,
                              isWeighed: unit === "kg" || unit === "lb",
                            })
                          }}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="item">Item</option>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="lb">Pound (lb)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-student-limit">Student Limit</Label>
                        <Input
                          id="new-student-limit"
                          type="number"
                          min="1"
                          value={newItem.studentLimit}
                          onChange={(e) =>
                            setNewItem({ ...newItem, studentLimit: Number.parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-limit-duration">Limit Duration (Days)</Label>
                        <Input
                          id="new-limit-duration"
                          type="number"
                          min="0"
                          value={newItem.limitDuration}
                          onChange={(e) =>
                            setNewItem({ ...newItem, limitDuration: Number.parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleAddNewItem} className="w-full">
                      Add Item
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
