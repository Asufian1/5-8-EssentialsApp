"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Plus, Search, Minus } from "lucide-react"
import type { InventoryItem } from "@/lib/types"
import { addInventoryItem, getInventoryItems, updateInventoryItem } from "@/lib/data"

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [userType, setUserType] = useState("")

  // New item form state
  const [newItem, setNewItem] = useState({
    name: "",
    category: "essentials",
    quantity: 0,
  })

  // Add quantity form state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [quantityToAdd, setQuantityToAdd] = useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Remove quantity form state
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [quantityToRemove, setQuantityToRemove] = useState(0)

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType || "")

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

  const handleAddNewItem = () => {
    if (!newItem.name || newItem.quantity <= 0) {
      alert("Please enter a valid item name and quantity")
      return
    }

    addInventoryItem({
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      quantity: newItem.quantity,
    })

    // Reset form and reload inventory
    setNewItem({
      name: "",
      category: "essentials",
      quantity: 0,
    })

    loadInventory()
  }

  const handleAddQuantity = () => {
    if (!selectedItem || quantityToAdd <= 0) {
      alert("Please select a valid item and quantity")
      return
    }

    const updatedItem = {
      ...selectedItem,
      quantity: selectedItem.quantity + quantityToAdd,
    }

    updateInventoryItem(updatedItem)

    // Reset form and reload inventory
    setSelectedItem(null)
    setQuantityToAdd(0)
    setIsAddDialogOpen(false)

    loadInventory()
  }

  const handleRemoveQuantity = () => {
    if (!selectedItem || quantityToRemove <= 0) {
      alert("Please select a valid item and quantity")
      return
    }

    if (quantityToRemove > selectedItem.quantity) {
      alert(`Cannot remove more than the available quantity (${selectedItem.quantity})`)
      return
    }

    const updatedItem = {
      ...selectedItem,
      quantity: selectedItem.quantity - quantityToRemove,
    }

    updateInventoryItem(updatedItem)

    // Reset form and reload inventory
    setSelectedItem(null)
    setQuantityToRemove(0)
    setIsRemoveDialogOpen(false)

    loadInventory()
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
            <h1 className="text-2xl md:text-3xl font-bold text-white">Inventory Management</h1>
            <p className="text-lg text-primary mt-2">Manage and track all food items in the store</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Items</h2>
          <p className="text-muted-foreground">View and manage all items in the food store</p>
        </div>

        {userType === "staff" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black hover:bg-primary/90">
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

                <div className="grid gap-2">
                  <Label htmlFor="quantity">Initial Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity || ""}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number.parseInt(e.target.value) || 0 })}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleAddNewItem} className="bg-primary text-black hover:bg-primary/90">
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                {userType === "staff" && <TableHead className="text-right">Actions</TableHead>}
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
                          <span className="text-xs font-bold uppercase">{item.category.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                      {item.quantity < 10 && <span className="ml-2 text-xs text-red-500 font-medium">Low Stock</span>}
                    </TableCell>
                    {userType === "staff" && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAddQuantityDialog(item)}>
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openRemoveQuantityDialog(item)}>
                            <Minus className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={userType === "staff" ? 4 : 3} className="text-center py-4">
                    No items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
              <Label htmlFor="add-quantity">Quantity to Add</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                value={quantityToAdd || ""}
                onChange={(e) => setQuantityToAdd(Number.parseInt(e.target.value) || 0)}
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
              <Label htmlFor="remove-quantity">Quantity to Remove</Label>
              <Input
                id="remove-quantity"
                type="number"
                min="1"
                value={quantityToRemove || ""}
                onChange={(e) => setQuantityToRemove(Number.parseInt(e.target.value) || 0)}
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
    </div>
  )
}

