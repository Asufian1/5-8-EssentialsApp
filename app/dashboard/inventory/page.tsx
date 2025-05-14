"use client"

import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Minus, Settings, Scale, Trash2, AlertTriangle, Barcode, Edit, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import type { InventoryItem } from "@/lib/types"
import { formatTimeRestriction } from "@/lib/data-local"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { SeedDatabase } from "@/components/seed-database"
import { SupabaseConnectionTest } from "@/components/supabase-connection-test"
import { isSupabaseConfigured, getSupabaseClient } from "@/lib/supabase"

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [userType, setUserType] = useState("")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // New item form state
  const [newItem, setNewItem] = useState({
    name: "",
    category: "essentials",
    quantity: 0,
    studentLimit: 1,
    limitDuration: 7,
    limitDurationMinutes: 0,
    unit: "item" as "item" | "kg" | "lb" | null,
    isWeighed: false,
    hasLimit: true,
    cost: 0,
  })

  // Add quantity form state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantityToAdd, setQuantityToAdd] = useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Remove quantity form state
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [quantityToRemove, setQuantityToRemove] = useState(0)

  // Limits form state
  const [isLimitsDialogOpen, setIsLimitsDialogOpen] = useState(false)
  const [studentLimit, setStudentLimit] = useState(1)
  const [limitDuration, setLimitDuration] = useState(7)
  const [limitDurationMinutes, setLimitDurationMinutes] = useState(0)
  const [hasLimit, setHasLimit] = useState(true)

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  // Edit item dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType || "")

    // Check for barcode parameter in URL
    const params = new URLSearchParams(window.location.search)
    const barcodeParam = params.get("barcode")

    if (barcodeParam) {
      // If barcode is provided, open the add item dialog
      const dialogTrigger = document.querySelector('[data-dialog-trigger="add-item"]') as HTMLButtonElement
      if (dialogTrigger) {
        dialogTrigger.click()

        // Set the barcode as the ID in the new item form
        setNewItem((prev) => ({
          ...prev,
          id: barcodeParam,
        }))
      }
    }

    // Load inventory data and categories
    loadInventory()
    loadCategories()
  }, [lastRefreshed])

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

  const loadInventory = async () => {
    try {
      setIsLoading(true)

      // Use Supabase directly
      const supabase = getSupabaseClient()
      const { data, error: fetchError } = await supabase
        .from("inventory_items")
        .select("*, categories(name)")
        .order("name")

      if (fetchError) {
        throw fetchError
      }

      // Transform the data to match our InventoryItem type
      const inventoryItems: InventoryItem[] = data.map((item) => ({
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
    } catch (err) {
      console.error("Error loading inventory:", err)
      setError("Failed to load inventory items")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()
      const { data, error: fetchError } = await supabase.from("categories").select("*").order("name")

      if (fetchError) {
        throw fetchError
      }

      setCategories(data)
    } catch (err) {
      console.error("Error loading categories:", err)
    }
  }

  const handleAddNewItem = async () => {
    if (!newItem.name || newItem.quantity <= 0) {
      alert("Please enter a valid item name and quantity")
      return
    }

    try {
      // Ensure unit is one of the allowed values
      let unit: "item" | "kg" | "lb" | null = "item"
      if (newItem.isWeighed && (newItem.unit === "kg" || newItem.unit === "lb")) {
        unit = newItem.unit
      }

      const newItemId = newItem.id || Date.now().toString()

      // Use Supabase directly
      const supabase = getSupabaseClient()

      // Insert the new item
      const { error: insertError } = await supabase.from("inventory_items").insert({
        id: newItemId,
        name: newItem.name,
        category_id: newItem.category,
        quantity: newItem.quantity,
        student_limit: newItem.studentLimit,
        limit_duration: newItem.limitDuration,
        limit_duration_minutes: newItem.limitDurationMinutes,
        unit: unit,
        is_weighed: newItem.isWeighed,
        has_limit: newItem.hasLimit,
        cost: newItem.cost,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        throw insertError
      }

      // Add transaction record
      const { error: txError } = await supabase.from("transactions").insert({
        id: `tx-${Date.now()}`,
        type: "in",
        item_id: newItemId,
        item_name: newItem.name,
        quantity: newItem.quantity,
        user_id: "admin",
        timestamp: new Date().toISOString(),
        unit: unit,
        cost: newItem.cost,
        total_cost: newItem.cost * newItem.quantity,
      })

      if (txError) {
        console.warn("Could not add transaction record:", txError)
      }

      // Reset form and reload inventory
      setNewItem({
        name: "",
        category: "essentials",
        quantity: 0,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item" as "item" | "kg" | "lb" | null,
        isWeighed: false,
        hasLimit: true,
        cost: 0,
      })

      // Refresh the inventory
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Error adding new item:", err)
      alert("Failed to add new item")
    }
  }

  const handleAddQuantity = async () => {
    if (!selectedItem || quantityToAdd <= 0) {
      alert("Please select a valid item and quantity")
      return
    }

    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()

      // Get current quantity
      const { data: currentItem, error: fetchError } = await supabase
        .from("inventory_items")
        .select("quantity")
        .eq("id", selectedItem.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const newQuantity = Number(currentItem.quantity) + quantityToAdd

      // Update the item
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.id)

      if (updateError) {
        throw updateError
      }

      // Add transaction record
      const { error: txError } = await supabase.from("transactions").insert({
        id: `tx-${Date.now()}`,
        type: "in",
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity: quantityToAdd,
        user_id: "admin",
        timestamp: new Date().toISOString(),
        unit: selectedItem.unit,
        cost: selectedItem.cost,
        total_cost: selectedItem.cost ? selectedItem.cost * quantityToAdd : undefined,
      })

      if (txError) {
        console.warn("Could not add transaction record:", txError)
      }

      // Reset form and reload inventory
      setSelectedItem(null)
      setQuantityToAdd(0)
      setIsAddDialogOpen(false)

      // Refresh the inventory
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Error adding quantity:", err)
      alert("Failed to update quantity")
    }
  }

  const handleRemoveQuantity = async () => {
    if (!selectedItem || quantityToRemove <= 0) {
      alert("Please select a valid item and quantity")
      return
    }

    if (quantityToRemove > selectedItem.quantity) {
      alert(`Cannot remove more than the available quantity (${selectedItem.quantity})`)
      return
    }

    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()

      // Get current quantity
      const { data: currentItem, error: fetchError } = await supabase
        .from("inventory_items")
        .select("quantity")
        .eq("id", selectedItem.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      const newQuantity = Number(currentItem.quantity) - quantityToRemove

      // Update the item
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.id)

      if (updateError) {
        throw updateError
      }

      // Add transaction record
      const { error: txError } = await supabase.from("transactions").insert({
        id: `tx-${Date.now()}`,
        type: "out",
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity: quantityToRemove,
        user_id: "admin",
        timestamp: new Date().toISOString(),
        unit: selectedItem.unit,
      })

      if (txError) {
        console.warn("Could not add transaction record:", txError)
      }

      // Reset form and reload inventory
      setSelectedItem(null)
      setQuantityToRemove(0)
      setIsRemoveDialogOpen(false)

      // Refresh the inventory
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Error removing quantity:", err)
      alert("Failed to update quantity")
    }
  }

  const handleUpdateLimits = async () => {
    if (!selectedItem) {
      alert("No item selected")
      return
    }

    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()

      // Update the item
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          student_limit: studentLimit,
          limit_duration: limitDuration,
          limit_duration_minutes: limitDurationMinutes,
          has_limit: hasLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItem.id)

      if (updateError) {
        throw updateError
      }

      // Reset form and reload inventory
      setSelectedItem(null)
      setIsLimitsDialogOpen(false)

      // Refresh the inventory
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Error updating limits:", err)
      alert("Failed to update limits")
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) {
      return
    }

    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()

      // First, check if there are any related transactions
      const { data: transactions, error: txCheckError } = await supabase
        .from("transactions")
        .select("id")
        .eq("item_id", itemToDelete.id)
        .limit(1)

      if (txCheckError) {
        console.error("Error checking transactions:", txCheckError)
      }

      // If there are related transactions, we need to delete them first
      if (transactions && transactions.length > 0) {
        // Delete related transactions first
        const { error: txDeleteError } = await supabase.from("transactions").delete().eq("item_id", itemToDelete.id)

        if (txDeleteError) {
          console.error("Error deleting related transactions:", txDeleteError)
          throw new Error(`Could not delete related transactions: ${txDeleteError.message}`)
        }
      }

      // Check for student checkouts
      const { data: checkouts, error: checkoutError } = await supabase
        .from("student_checkouts")
        .select("student_id")
        .eq("item_id", itemToDelete.id)
        .limit(1)

      if (checkoutError) {
        console.error("Error checking student checkouts:", checkoutError)
      }

      // If there are related checkouts, delete them
      if (checkouts && checkouts.length > 0) {
        const { error: checkoutDeleteError } = await supabase
          .from("student_checkouts")
          .delete()
          .eq("item_id", itemToDelete.id)

        if (checkoutDeleteError) {
          console.error("Error deleting related checkouts:", checkoutDeleteError)
          throw new Error(`Could not delete related checkouts: ${checkoutDeleteError.message}`)
        }
      }

      // Now delete the item
      const { error: deleteError } = await supabase.from("inventory_items").delete().eq("id", itemToDelete.id)

      if (deleteError) {
        console.error("Supabase delete error:", deleteError)
        throw new Error(deleteError.message)
      }

      setIsDeleteDialogOpen(false)
      setItemToDelete(null)

      // Show success message
      alert(`Successfully deleted ${itemToDelete.name}`)

      // Refresh the inventory
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Error deleting item:", err)
      alert(`Failed to delete item: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleEditItem = async () => {
    if (!editItem) {
      return
    }

    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()

      // Update the item
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          name: editItem.name,
          category_id: editItem.category,
          unit: editItem.unit,
          is_weighed: editItem.isWeighed,
          cost: editItem.cost,
          supplier: editItem.supplier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editItem.id)

      if (updateError) {
        throw updateError
      }

      setIsEditDialogOpen(false)
      setEditItem(null)

      // Refresh the inventory
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Error updating item:", err)
      alert("Failed to update item")
    }
  }

  const openAddQuantityDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setQuantityToAdd(0)
    setIsAddDialogOpen(true)
  }

  const openRemoveQuantityDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setQuantityToRemove(0)
    setIsRemoveDialogOpen(true)
  }

  const openLimitsDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setStudentLimit(item.studentLimit)
    setLimitDuration(item.limitDuration)
    setLimitDurationMinutes(item.limitDurationMinutes || 0)
    setHasLimit(item.hasLimit !== undefined ? item.hasLimit : true)
    setIsLimitsDialogOpen(true)
  }

  const openDeleteDialog = (item: InventoryItem) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const openEditDialog = (item: InventoryItem) => {
    setEditItem({ ...item })
    setIsEditDialogOpen(true)
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

  // Add a new function to seed random prices for inventory items
  const handleSeedRandomPrices = async () => {
    try {
      // Use Supabase directly
      const supabase = getSupabaseClient()

      // Get all inventory items
      const { data: inventoryItems, error: fetchError } = await supabase.from("inventory_items").select("id")

      if (fetchError) {
        throw fetchError
      }

      // Update each item with a random price
      for (const item of inventoryItems) {
        // Generate a random price between $0.50 and $15.00
        const randomPrice = (Math.random() * 14.5 + 0.5).toFixed(2)

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({
            cost: Number.parseFloat(randomPrice),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id)

        if (updateError) {
          console.warn(`Error updating price for item ${item.id}:`, updateError)
        }
      }

      // Refresh the inventory
      setLastRefreshed(new Date())

      // Show success message
      alert("Random prices have been added to all inventory items!")
    } catch (err) {
      console.error("Error seeding random prices:", err)
      alert("Failed to add random prices to inventory items")
    }
  }

  // Function to manually refresh the inventory
  const refreshInventory = () => {
    setLastRefreshed(new Date())
  }

  // Check if Supabase is configured
  const supabaseConfigured = isSupabaseConfigured()

  // If Supabase is not configured, show a warning
  if (!supabaseConfigured) {
    return (
      <div className="space-y-6">
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Supabase Not Configured
            </CardTitle>
            <CardDescription className="text-amber-700">
              Your Supabase connection is not properly configured. Please set up your Supabase connection to use the
              full functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 mb-4">
              The application is currently using local storage as a fallback. Your data will be stored in your browser
              and will not persist across devices.
            </p>
            <Link href="/dashboard/supabase-setup">
              <Button variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                Set Up Supabase Connection
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Suspense fallback={<div>Loading inventory...</div>}>
          <InventoryContent />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Inventory Management</h1>
            <p className="text-lg text-primary mt-2">Manage and track all food items in the store</p>
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

      {/* Add Supabase Connection Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>Test your Supabase connection and view available environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <SupabaseConnectionTest />
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Items</h2>
          <p className="text-muted-foreground">View and manage all items in the food store</p>
        </div>

        {userType === "staff" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshInventory} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Inventory
            </Button>
            <Link href="/dashboard/barcode-scan">
              <Button variant="outline" className="flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                Barcode Scanner
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-black hover:bg-primary/90" data-dialog-trigger="add-item">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>Enter the details of the new item to add to inventory</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Enter item name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isWeighed"
                      checked={newItem.isWeighed}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isWeighed: checked })}
                    />
                    <Label htmlFor="isWeighed" className="flex items-center">
                      <Scale className="h-4 w-4 mr-2" />
                      Weighed Item
                    </Label>
                  </div>

                  {newItem.isWeighed && (
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit of Measurement</Label>
                      <Select
                        value={newItem.unit}
                        onValueChange={(value: string) => {
                          // Validate the value before setting it
                          if (value === "kg" || value === "lb" || value === "item") {
                            setNewItem({ ...newItem, unit: value as "item" | "kg" | "lb" })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="lb">Pounds (lb)</SelectItem>
                          <SelectItem value="item">Items</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="quantity">
                      Initial Quantity {newItem.isWeighed ? `(${newItem.unit})` : "(items)"}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={newItem.isWeighed ? "0.1" : "1"}
                      step={newItem.isWeighed ? "0.1" : "1"}
                      value={newItem.quantity || ""}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cost">Cost per Unit ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.cost || ""}
                      onChange={(e) => setNewItem({ ...newItem, cost: Number.parseFloat(e.target.value) || 0 })}
                      placeholder="Enter cost per unit"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasLimit"
                      checked={newItem.hasLimit}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, hasLimit: checked })}
                    />
                    <Label htmlFor="hasLimit">Enable Item Limits</Label>
                  </div>

                  {newItem.hasLimit && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="studentLimit">
                          Student Limit {newItem.isWeighed ? `(${newItem.unit} per checkout)` : "(per checkout)"}
                        </Label>
                        <Input
                          id="studentLimit"
                          type="number"
                          min={newItem.isWeighed ? "0.1" : "1"}
                          step={newItem.isWeighed ? "0.1" : "1"}
                          value={newItem.studentLimit || ""}
                          onChange={(e) =>
                            setNewItem({ ...newItem, studentLimit: Number.parseFloat(e.target.value) || 1 })
                          }
                          placeholder="Enter student limit"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="limitDuration">Limit Duration (days)</Label>
                          <Input
                            id="limitDuration"
                            type="number"
                            min="0"
                            value={newItem.limitDuration || ""}
                            onChange={(e) =>
                              setNewItem({ ...newItem, limitDuration: Number.parseInt(e.target.value) || 0 })
                            }
                            placeholder="Enter days"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="limitDurationMinutes">Additional Minutes</Label>
                          <Input
                            id="limitDurationMinutes"
                            type="number"
                            min="0"
                            value={newItem.limitDurationMinutes || ""}
                            onChange={(e) =>
                              setNewItem({ ...newItem, limitDurationMinutes: Number.parseInt(e.target.value) || 0 })
                            }
                            placeholder="Enter minutes"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Students can only take this item once within this time period
                      </p>
                    </>
                  )}
                </div>

                <DialogFooter>
                  <Button onClick={handleAddNewItem} className="bg-primary text-black hover:bg-primary/90">
                    Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Scale className="h-4 w-4 mr-1" />
                  Seed Prices
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seed Random Prices</DialogTitle>
                  <DialogDescription>
                    This will add random prices to all inventory items. This is useful for testing price-related
                    features.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button onClick={handleSeedRandomPrices} className="bg-primary text-black hover:bg-primary/90">
                    Seed Random Prices
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <SeedDatabase />
          </div>
        )}
      </div>

      <Card className="border-t-4 border-primary">
        <CardHeader>
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

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  {userType === "staff" && (
                    <>
                      <TableHead className="text-center">Student Limits</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-10 w-10 rounded-full ${getColorForCategory(item.category)} flex items-center justify-center`}
                          >
                            <span className="text-xs font-bold uppercase text-black dark:text-black">
                              {item.category.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.isWeighed && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Scale className="h-3 w-3 mr-1" />
                                <span>Weighed in {item.unit}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{item.categoryName || item.category}</TableCell>
                      <TableCell className="text-right">
                        {item.isWeighed ? (
                          <span>
                            {item.quantity.toFixed(1)} {item.unit}
                          </span>
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                        {item.quantity < 10 && <span className="ml-2 text-xs text-red-500 font-medium">Low Stock</span>}
                      </TableCell>
                      {userType === "staff" && (
                        <>
                          <TableCell className="text-center">
                            {item.hasLimit ? (
                              <span className="text-sm">
                                Max{" "}
                                {item.isWeighed ? `${item.studentLimit.toFixed(1)} ${item.unit}` : item.studentLimit}{" "}
                                per student /{" "}
                                {formatTimeRestriction(item.limitDuration, item.limitDurationMinutes || 0)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No limits</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                                <Edit className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openAddQuantityDialog(item)}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openRemoveQuantityDialog(item)}>
                                <Minus className="h-3 w-3 mr-1" /> Remove
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openLimitsDialog(item)}>
                                <Settings className="h-3 w-3 mr-1" /> Limits
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openDeleteDialog(item)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={userType === "staff" ? 5 : 3} className="text-center py-4">
                      No items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Quantity Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>Add more quantity to {selectedItem?.name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-quantity">
                Quantity to Add {selectedItem?.isWeighed ? `(${selectedItem?.unit})` : ""}
              </Label>
              <Input
                id="add-quantity"
                type="number"
                min={selectedItem?.isWeighed ? "0.1" : "1"}
                step={selectedItem?.isWeighed ? "0.1" : "1"}
                value={quantityToAdd || ""}
                onChange={(e) => setQuantityToAdd(Number.parseFloat(e.target.value) || 0)}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddQuantity} className="bg-primary text-black hover:bg-primary/90">
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Quantity Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Stock</DialogTitle>
            <DialogDescription>Remove quantity from {selectedItem?.name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remove-quantity">
                Quantity to Remove {selectedItem?.isWeighed ? `(${selectedItem?.unit})` : ""}
              </Label>
              <Input
                id="remove-quantity"
                type="number"
                min={selectedItem?.isWeighed ? "0.1" : "1"}
                step={selectedItem?.isWeighed ? "0.1" : "1"}
                value={quantityToRemove || ""}
                onChange={(e) => setQuantityToRemove(Number.parseFloat(e.target.value) || 0)}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleRemoveQuantity} className="bg-primary text-black hover:bg-primary/90">
              Remove Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Limits Dialog */}
      <Dialog open={isLimitsDialogOpen} onOpenChange={setIsLimitsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Limits</DialogTitle>
            <DialogDescription>Set limits for {selectedItem?.name}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch id="has-limit" checked={hasLimit} onCheckedChange={setHasLimit} />
              <Label htmlFor="has-limit">Enable Item Limits</Label>
            </div>

            {hasLimit && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="student-limit">
                    Maximum Quantity Per Student {selectedItem?.isWeighed ? `(${selectedItem?.unit})` : ""}
                  </Label>
                  <Input
                    id="student-limit"
                    type="number"
                    min={selectedItem?.isWeighed ? "0.1" : "1"}
                    step={selectedItem?.isWeighed ? "0.1" : "1"}
                    value={studentLimit || ""}
                    onChange={(e) => setStudentLimit(Number.parseFloat(e.target.value) || 1)}
                    placeholder="Enter limit"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum amount of this item a student can take in a single checkout
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="limit-duration">Time Restriction (days)</Label>
                    <Input
                      id="limit-duration"
                      type="number"
                      min="0"
                      value={limitDuration || ""}
                      onChange={(e) => setLimitDuration(Number.parseInt(e.target.value) || 0)}
                      placeholder="Enter days"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="limit-duration-minutes">Additional Minutes</Label>
                    <Input
                      id="limit-duration-minutes"
                      type="number"
                      min="0"
                      value={limitDurationMinutes || ""}
                      onChange={(e) => setLimitDurationMinutes(Number.parseInt(e.target.value) || 0)}
                      placeholder="Enter minutes"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Number of days and minutes before a student can take this item again
                </p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleUpdateLimits} className="bg-primary text-black hover:bg-primary/90">
              Update Limits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {itemToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              This will also delete all related transaction records and checkout history for this item.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update the details for {editItem?.name}</DialogDescription>
          </DialogHeader>

          {editItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  placeholder="Enter item name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editItem.category}
                  onValueChange={(value) => setEditItem({ ...editItem, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isWeighed"
                  checked={editItem.isWeighed}
                  onChange={(checked) => setEditItem({ ...editItem, isWeighed: checked })}
                />
                <Label htmlFor="edit-isWeighed" className="flex items-center">
                  <Scale className="h-4 w-4 mr-2" />
                  Weighed Item
                </Label>
              </div>

              {editItem.isWeighed && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-unit">Unit of Measurement</Label>
                  <Select
                    value={editItem.unit || "item"}
                    onValueChange={(value: string) => {
                      if (value === "kg" || value === "lb" || value === "item") {
                        setEditItem({ ...editItem, unit: value as "item" | "kg" | "lb" })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="lb">Pounds (lb)</SelectItem>
                      <SelectItem value="item">Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="edit-cost">Cost per Unit ($)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editItem.cost || ""}
                  onChange={(e) => setEditItem({ ...editItem, cost: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="Enter cost per unit"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-supplier">Supplier (Optional)</Label>
                <Input
                  id="edit-supplier"
                  value={editItem.supplier || ""}
                  onChange={(e) => setEditItem({ ...editItem, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} className="bg-primary text-black hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

async function InventoryContent() {
  // Always use local data for now until we confirm Supabase works
  const supabase = getSupabaseClient()
  const { data: inventoryItems, error } = await supabase
    .from("inventory_items")
    .select("*, categories(name)")
    .order("name")

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Error Loading Inventory</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Database Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Rest of your inventory display code...
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory Items</h1>
      {/* Display inventory items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventoryItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>Category: {item.categories?.name || item.category_id}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Quantity: {item.quantity} {item.unit}
              </p>
              <p>Cost: ${item.cost ? Number(item.cost).toFixed(2) : "0.00"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
