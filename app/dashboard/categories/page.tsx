"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the Category type
interface Category {
  id: string
  name: string
  description: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    // Load categories from localStorage
    const storedCategories = localStorage.getItem("inventory_categories")
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories))
      } catch (error) {
        console.error("Error parsing categories:", error)
      }
    } else {
      // Initialize with default categories
      const defaultCategories: Category[] = [
        { id: "essentials", name: "Essentials", description: "Basic food items" },
        { id: "grains", name: "Grains", description: "Rice, pasta, and other grains" },
        { id: "canned", name: "Canned Goods", description: "Canned foods and preserved items" },
        { id: "produce", name: "Produce", description: "Fresh fruits and vegetables" },
        { id: "dairy", name: "Dairy", description: "Milk, cheese, and other dairy products" },
        { id: "south-asian", name: "South Asian", description: "South Asian food items" },
        { id: "other", name: "Other", description: "Miscellaneous items" },
      ]
      setCategories(defaultCategories)
      localStorage.setItem("inventory_categories", JSON.stringify(defaultCategories))
    }
  }, [])

  const saveCategories = (updatedCategories: Category[]) => {
    localStorage.setItem("inventory_categories", JSON.stringify(updatedCategories))
    setCategories(updatedCategories)
  }

  const handleAddCategory = () => {
    setError("")
    setSuccess("")

    if (!newCategory.name.trim()) {
      setError("Category name is required")
      return
    }

    // Check for duplicate names
    if (categories.some((cat) => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
      setError("A category with this name already exists")
      return
    }

    const id = newCategory.name.toLowerCase().replace(/\s+/g, "-")
    const newCategoryWithId = { ...newCategory, id }

    const updatedCategories = [...categories, newCategoryWithId]
    saveCategories(updatedCategories)

    setNewCategory({ name: "", description: "" })
    setSuccess("Category added successfully")
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setError("")
    setSuccess("")
  }

  const handleSaveEdit = () => {
    if (!editingCategory) return

    setError("")
    setSuccess("")

    if (!editingCategory.name.trim()) {
      setError("Category name is required")
      return
    }

    // Check for duplicate names (excluding the current category)
    if (
      categories.some(
        (cat) => cat.id !== editingCategory.id && cat.name.toLowerCase() === editingCategory.name.toLowerCase(),
      )
    ) {
      setError("A category with this name already exists")
      return
    }

    const updatedCategories = categories.map((cat) => (cat.id === editingCategory.id ? editingCategory : cat))

    saveCategories(updatedCategories)
    setEditingCategory(null)
    setSuccess("Category updated successfully")
  }

  const handleDeleteCategory = (id: string) => {
    setError("")
    setSuccess("")

    // Don't allow deleting default categories
    const defaultCategories = ["essentials", "grains", "canned", "produce", "dairy", "south-asian", "other"]
    if (defaultCategories.includes(id)) {
      setError("Cannot delete default categories")
      return
    }

    if (confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      const updatedCategories = categories.filter((cat) => cat.id !== id)
      saveCategories(updatedCategories)
      setSuccess("Category deleted successfully")
    }
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
    setError("")
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Category Management</h1>
            <p className="text-lg text-primary mt-2">Create and manage item categories</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Add/Edit Category Form */}
        <Card className="md:col-span-1 border-t-4 border-primary">
          <CardHeader>
            <CardTitle>{editingCategory ? "Edit Category" : "Add New Category"}</CardTitle>
            <CardDescription>
              {editingCategory ? "Update category details" : "Create a new category for inventory items"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({ ...editingCategory, name: e.target.value })
                      : setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  placeholder="Enter category name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={editingCategory ? editingCategory.description : newCategory.description}
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({ ...editingCategory, description: e.target.value })
                      : setNewCategory({ ...newCategory, description: e.target.value })
                  }
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {editingCategory ? (
                  <>
                    <Button onClick={handleSaveEdit} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddCategory} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="md:col-span-2 border-t-4 border-primary">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage existing categories</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            disabled={[
                              "essentials",
                              "grains",
                              "canned",
                              "produce",
                              "dairy",
                              "south-asian",
                              "other",
                            ].includes(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
