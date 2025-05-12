"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Database } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase"

export function SeedAnalyticsData() {
  const [isSeeding, setIsSeeding] = useState(false)

  const seedData = async () => {
    try {
      setIsSeeding(true)
      toast({
        title: "Seeding analytics data...",
        description: "This may take a few moments.",
      })

      const supabase = getSupabaseClient()

      // Generate categories if they don't exist
      const categories = [
        { id: "essentials", name: "Essentials", description: "Basic food items" },
        { id: "grains", name: "Grains", description: "Rice, pasta, and other grains" },
        { id: "canned", name: "Canned Goods", description: "Canned foods and preserved items" },
        { id: "produce", name: "Produce", description: "Fresh fruits and vegetables" },
        { id: "dairy", name: "Dairy", description: "Milk, cheese, and other dairy products" },
        { id: "south-asian", name: "South Asian", description: "South Asian food items" },
        { id: "beverages", name: "Beverages", description: "Drinks and beverages" },
        { id: "snacks", name: "Snacks", description: "Snack foods" },
        { id: "hygiene", name: "Hygiene", description: "Personal hygiene products" },
        { id: "household", name: "Household", description: "Household items" },
      ]

      // Insert categories
      for (const category of categories) {
        const { error } = await supabase.from("categories").upsert(category, { onConflict: "id" })

        if (error) {
          console.error("Error inserting category:", error)
        }
      }

      // Generate inventory items with cost data
      const items = [
        {
          id: "1",
          name: "Rice",
          category_id: "grains",
          quantity: 50,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "kg",
          is_weighed: true,
          has_limit: true,
          cost: 2.5,
          supplier: "Local Supplier",
        },
        {
          id: "2",
          name: "Beans",
          category_id: "essentials",
          quantity: 30,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.25,
          supplier: "Food Bank",
        },
        {
          id: "3",
          name: "Pasta",
          category_id: "grains",
          quantity: 40,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.75,
          supplier: "Grocery Store",
        },
        {
          id: "4",
          name: "Canned Soup",
          category_id: "canned",
          quantity: 25,
          student_limit: 3,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.5,
          supplier: "Food Bank",
        },
        {
          id: "5",
          name: "Cereal",
          category_id: "essentials",
          quantity: 20,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 3.25,
          supplier: "Grocery Store",
        },
        {
          id: "6",
          name: "Milk",
          category_id: "dairy",
          quantity: 15,
          student_limit: 1,
          limit_duration: 3,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 2.75,
          supplier: "Local Dairy",
        },
        {
          id: "7",
          name: "Bread",
          category_id: "essentials",
          quantity: 25,
          student_limit: 1,
          limit_duration: 3,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 2.0,
          supplier: "Local Bakery",
        },
        {
          id: "8",
          name: "Eggs",
          category_id: "dairy",
          quantity: 20,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 3.5,
          supplier: "Local Farm",
        },
        {
          id: "9",
          name: "Potatoes",
          category_id: "produce",
          quantity: 30,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "kg",
          is_weighed: true,
          has_limit: true,
          cost: 1.2,
          supplier: "Local Farm",
        },
        {
          id: "10",
          name: "Onions",
          category_id: "produce",
          quantity: 25,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "kg",
          is_weighed: true,
          has_limit: true,
          cost: 1.0,
          supplier: "Local Farm",
        },
        {
          id: "11",
          name: "Lentils",
          category_id: "south-asian",
          quantity: 35,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "kg",
          is_weighed: true,
          has_limit: true,
          cost: 2.2,
          supplier: "International Foods",
        },
        {
          id: "12",
          name: "Canned Beans",
          category_id: "canned",
          quantity: 40,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.1,
          supplier: "Food Bank",
        },
        {
          id: "13",
          name: "Juice",
          category_id: "beverages",
          quantity: 18,
          student_limit: 1,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 2.5,
          supplier: "Grocery Store",
        },
        {
          id: "14",
          name: "Granola Bars",
          category_id: "snacks",
          quantity: 45,
          student_limit: 3,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 0.75,
          supplier: "Grocery Store",
        },
        {
          id: "15",
          name: "Toothpaste",
          category_id: "hygiene",
          quantity: 15,
          student_limit: 1,
          limit_duration: 30,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 3.0,
          supplier: "Pharmacy",
        },
        {
          id: "16",
          name: "Soap",
          category_id: "hygiene",
          quantity: 20,
          student_limit: 1,
          limit_duration: 14,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.5,
          supplier: "Pharmacy",
        },
        {
          id: "17",
          name: "Paper Towels",
          category_id: "household",
          quantity: 12,
          student_limit: 1,
          limit_duration: 14,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 4.0,
          supplier: "Grocery Store",
        },
        {
          id: "18",
          name: "Apples",
          category_id: "produce",
          quantity: 40,
          student_limit: 3,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 0.5,
          supplier: "Local Farm",
        },
        {
          id: "19",
          name: "Bananas",
          category_id: "produce",
          quantity: 35,
          student_limit: 3,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 0.3,
          supplier: "Grocery Store",
        },
        {
          id: "20",
          name: "Yogurt",
          category_id: "dairy",
          quantity: 22,
          student_limit: 2,
          limit_duration: 7,
          limit_duration_minutes: 0,
          unit: "item",
          is_weighed: false,
          has_limit: true,
          cost: 1.25,
          supplier: "Local Dairy",
        },
      ]

      // Insert inventory items
      for (const item of items) {
        const { error } = await supabase.from("inventory_items").upsert(item, { onConflict: "id" })

        if (error) {
          console.error("Error inserting inventory item:", error)
        }
      }

      // Generate student IDs
      const studentIds = [
        "student1",
        "student2",
        "student3",
        "student4",
        "student5",
        "student6",
        "student7",
        "student8",
        "student9",
        "student10",
        "student11",
        "student12",
        "student13",
        "student14",
        "student15",
      ]

      // Generate transactions
      const transactions = []
      const now = new Date()

      // Initial stock transactions (in)
      for (const item of items) {
        const timestamp = new Date(now)
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 60)) // Random date in last 60 days

        transactions.push({
          id: `seed-in-${item.id}`,
          type: "in",
          item_id: item.id,
          item_name: item.name,
          quantity: item.quantity,
          user_id: "admin",
          timestamp: timestamp.toISOString(),
          unit: item.unit,
          cost: item.cost,
          total_cost: item.cost * item.quantity,
        })
      }

      // Generate out transactions with varying frequency based on popularity
      const popularItems = ["1", "3", "7", "11", "14", "18", "19"] // IDs of popular items
      const moderateItems = ["2", "4", "5", "6", "8", "12", "13", "20"] // IDs of moderately popular items
      const unpopularItems = ["9", "10", "15", "16", "17"] // IDs of less popular items

      // Function to generate random transactions for an item
      const generateItemTransactions = (itemId, frequency) => {
        const item = items.find((i) => i.id === itemId)
        if (!item) return []

        const itemTransactions = []
        const transactionCount = Math.floor(Math.random() * frequency + frequency / 2) // Randomize around the frequency

        for (let i = 0; i < transactionCount; i++) {
          const timestamp = new Date(now)
          timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30)) // Random date in last 30 days
          timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)) // Random time

          const quantity = Math.min(Math.ceil(Math.random() * item.student_limit), 3)
          const studentId = studentIds[Math.floor(Math.random() * studentIds.length)]

          itemTransactions.push({
            id: `seed-out-${itemId}-${i}-${Date.now()}`,
            type: "out",
            item_id: itemId,
            item_name: item.name,
            quantity: quantity,
            user_id: studentId,
            timestamp: timestamp.toISOString(),
            unit: item.unit,
          })
        }

        return itemTransactions
      }

      // Generate transactions based on popularity
      for (const itemId of popularItems) {
        transactions.push(...generateItemTransactions(itemId, 25)) // High frequency
      }

      for (const itemId of moderateItems) {
        transactions.push(...generateItemTransactions(itemId, 15)) // Medium frequency
      }

      for (const itemId of unpopularItems) {
        transactions.push(...generateItemTransactions(itemId, 5)) // Low frequency
      }

      // Insert all transactions
      for (const transaction of transactions) {
        const { error } = await supabase.from("transactions").upsert(transaction, { onConflict: "id" })

        if (error) {
          console.error("Error inserting transaction:", error)
        }
      }

      // Generate student checkouts based on out transactions
      const studentCheckouts = transactions
        .filter((t) => t.type === "out")
        .map((t) => ({
          student_id: t.user_id,
          item_id: t.item_id,
          quantity: t.quantity,
          timestamp: t.timestamp,
          unit: t.unit,
        }))

      // Insert student checkouts
      for (const checkout of studentCheckouts) {
        const { error } = await supabase.from("student_checkouts").insert(checkout)

        if (error) {
          console.error("Error inserting student checkout:", error)
        }
      }

      toast({
        title: "Analytics data seeded successfully!",
        description: `Created ${items.length} inventory items and ${transactions.length} transactions.`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error seeding analytics data:", error)
      toast({
        title: "Error seeding data",
        description: "Check the console for details.",
        variant: "destructive",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Button onClick={seedData} disabled={isSeeding} variant="outline" className="flex items-center gap-2">
      {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
      {isSeeding ? "Seeding Data..." : "Seed Analytics Data"}
    </Button>
  )
}
