import type { InventoryItem, Transaction, StudentCheckout, Order } from "./types"
import { getSupabaseClient } from "./supabase"

// Helper to determine if we're running in a browser environment
const isBrowser = typeof window !== "undefined"

// Local storage keys for fallback in browser when Supabase is not available
const INVENTORY_KEY = "inventory_items"
const TRANSACTIONS_KEY = "inventory_transactions"
const STUDENT_CHECKOUTS_KEY = "student_checkouts"
const ORDERS_KEY = "student_orders"
const CATEGORIES_KEY = "inventory_categories"

// Initialize with sample data if not exists
export const initializeData = () => {
  if (!isBrowser) return

  // Check if inventory data exists
  if (!localStorage.getItem(INVENTORY_KEY)) {
    // Sample inventory data
    const sampleInventory: InventoryItem[] = [
      {
        id: "1",
        name: "Rice",
        category: "grains",
        quantity: 50,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "kg",
        isWeighed: true,
        hasLimit: true,
      },
      {
        id: "2",
        name: "Beans",
        category: "essentials",
        quantity: 30,
        studentLimit: 2,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
        hasLimit: true,
      },
      // More sample items would be here...
    ]

    localStorage.setItem(INVENTORY_KEY, JSON.stringify(sampleInventory))
  }

  // Initialize categories if not exists
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    const defaultCategories = [
      { id: "essentials", name: "Essentials", description: "Basic food items" },
      { id: "grains", name: "Grains", description: "Rice, pasta, and other grains" },
      { id: "canned", name: "Canned Goods", description: "Canned foods and preserved items" },
      { id: "produce", name: "Produce", description: "Fresh fruits and vegetables" },
      { id: "dairy", name: "Dairy", description: "Milk, cheese, and other dairy products" },
      { id: "south-asian", name: "South Asian", description: "South Asian food items" },
      { id: "other", name: "Other", description: "Miscellaneous items" },
    ]
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories))
  }

  // Initialize other data stores as needed
  if (!localStorage.getItem(TRANSACTIONS_KEY)) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]))
  }

  if (!localStorage.getItem(STUDENT_CHECKOUTS_KEY)) {
    localStorage.setItem(STUDENT_CHECKOUTS_KEY, JSON.stringify([]))
  }

  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]))
  }
}

// Get all inventory items
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("inventory_items").select("*, categories(name)").order("name")

        if (error) throw error

        return data.map((item) => ({
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
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        initializeData()
        const items = localStorage.getItem(INVENTORY_KEY)
        return items ? JSON.parse(items) : []
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("inventory_items").select("*, categories(name)").order("name")

      if (error) throw error

      return data.map((item) => ({
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
    }
  } catch (error) {
    console.error("Error fetching inventory items:", error)
    return []
  }
}

// Get a single inventory item by ID
export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("inventory_items")
          .select("*, categories(name)")
          .eq("id", id)
          .single()

        if (error) throw error

        return {
          id: data.id,
          name: data.name,
          category: data.category_id,
          categoryName: data.categories?.name,
          quantity: Number(data.quantity),
          studentLimit: Number(data.student_limit),
          limitDuration: data.limit_duration,
          limitDurationMinutes: data.limit_duration_minutes,
          unit: data.unit as "item" | "kg" | "lb" | null,
          isWeighed: data.is_weighed,
          hasLimit: data.has_limit,
          cost: data.cost ? Number(data.cost) : undefined,
          supplier: data.supplier || undefined,
        }
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const items = await getInventoryItems()
        return items.find((item) => item.id === id) || null
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("inventory_items").select("*, categories(name)").eq("id", id).single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        category: data.category_id,
        categoryName: data.categories?.name,
        quantity: Number(data.quantity),
        studentLimit: Number(data.student_limit),
        limitDuration: data.limit_duration,
        limitDurationMinutes: data.limit_duration_minutes,
        unit: data.unit as "item" | "kg" | "lb" | null,
        isWeighed: data.is_weighed,
        hasLimit: data.has_limit,
        cost: data.cost ? Number(data.cost) : undefined,
        supplier: data.supplier || undefined,
      }
    }
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return null
  }
}

// Add a new inventory item
export async function addInventoryItem(item: InventoryItem): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase.from("inventory_items").insert({
          id: item.id,
          name: item.name,
          category_id: item.category,
          quantity: item.quantity,
          student_limit: item.studentLimit,
          limit_duration: item.limitDuration,
          limit_duration_minutes: item.limitDurationMinutes,
          unit: item.unit,
          is_weighed: item.isWeighed,
          has_limit: item.hasLimit !== undefined ? item.hasLimit : true,
          cost: item.cost,
          supplier: item.supplier,
        })

        if (error) throw error

        // Add transaction record
        await addTransaction({
          id: Date.now().toString(),
          type: "in",
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          user: "admin", // TODO: Get actual username
          timestamp: new Date().toISOString(),
          unit: item.unit,
          cost: item.cost,
          totalCost: item.cost ? item.cost * item.quantity : undefined,
        })
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const items = await getInventoryItems()
        items.push(item)
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))

        // Add transaction record
        await addTransaction({
          id: Date.now().toString(),
          type: "in",
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          user: "admin", // TODO: Get actual username
          timestamp: new Date().toISOString(),
          unit: item.unit,
          cost: item.cost,
          totalCost: item.cost ? item.cost * item.quantity : undefined,
        })
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("inventory_items").insert({
        id: item.id,
        name: item.name,
        category_id: item.category,
        quantity: item.quantity,
        student_limit: item.studentLimit,
        limit_duration: item.limitDuration,
        limit_duration_minutes: item.limitDurationMinutes,
        unit: item.unit,
        is_weighed: item.isWeighed,
        has_limit: item.hasLimit !== undefined ? item.hasLimit : true,
        cost: item.cost,
        supplier: item.supplier,
      })

      if (error) throw error

      // Add transaction record
      await addTransaction({
        id: Date.now().toString(),
        type: "in",
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        user: "admin", // TODO: Get actual username
        timestamp: new Date().toISOString(),
        unit: item.unit,
        cost: item.cost,
        totalCost: item.cost ? item.cost * item.quantity : undefined,
      })
    }
  } catch (error) {
    console.error("Error adding inventory item:", error)
    throw error
  }
}

// Update an existing inventory item
export async function updateInventoryItem(updatedItem: InventoryItem): Promise<void> {
  try {
    // Get the old quantity to calculate the difference
    const oldItem = await getInventoryItem(updatedItem.id)
    if (!oldItem) {
      throw new Error(`Item with ID ${updatedItem.id} not found`)
    }

    const quantityAdded = updatedItem.quantity - oldItem.quantity

    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase
          .from("inventory_items")
          .update({
            name: updatedItem.name,
            category_id: updatedItem.category,
            quantity: updatedItem.quantity,
            student_limit: updatedItem.studentLimit,
            limit_duration: updatedItem.limitDuration,
            limit_duration_minutes: updatedItem.limitDurationMinutes,
            unit: updatedItem.unit,
            is_weighed: updatedItem.isWeighed,
            has_limit: updatedItem.hasLimit !== undefined ? updatedItem.hasLimit : true,
            cost: updatedItem.cost,
            supplier: updatedItem.supplier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", updatedItem.id)

        if (error) throw error

        // Add transaction record if quantity was added
        if (quantityAdded > 0) {
          await addTransaction({
            id: Date.now().toString(),
            type: "in",
            itemId: updatedItem.id,
            itemName: updatedItem.name,
            quantity: quantityAdded,
            user: "admin", // TODO: Get actual username
            timestamp: new Date().toISOString(),
            unit: updatedItem.unit,
            cost: updatedItem.cost,
            totalCost: updatedItem.cost ? updatedItem.cost * quantityAdded : undefined,
          })
        }
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const items = await getInventoryItems()
        const index = items.findIndex((item) => item.id === updatedItem.id)

        if (index !== -1) {
          items[index] = updatedItem
          localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))

          // Add transaction record if quantity was added
          if (quantityAdded > 0) {
            await addTransaction({
              id: Date.now().toString(),
              type: "in",
              itemId: updatedItem.id,
              itemName: updatedItem.name,
              quantity: quantityAdded,
              user: "admin", // TODO: Get actual username
              timestamp: new Date().toISOString(),
              unit: updatedItem.unit,
              cost: updatedItem.cost,
              totalCost: updatedItem.cost ? updatedItem.cost * quantityAdded : undefined,
            })
          }
        }
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("inventory_items")
        .update({
          name: updatedItem.name,
          category_id: updatedItem.category,
          quantity: updatedItem.quantity,
          student_limit: updatedItem.studentLimit,
          limit_duration: updatedItem.limitDuration,
          limit_duration_minutes: updatedItem.limitDurationMinutes,
          unit: updatedItem.unit,
          is_weighed: updatedItem.isWeighed,
          has_limit: updatedItem.hasLimit !== undefined ? updatedItem.hasLimit : true,
          cost: updatedItem.cost,
          supplier: updatedItem.supplier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedItem.id)

      if (error) throw error

      // Add transaction record if quantity was added
      if (quantityAdded > 0) {
        await addTransaction({
          id: Date.now().toString(),
          type: "in",
          itemId: updatedItem.id,
          itemName: updatedItem.name,
          quantity: quantityAdded,
          user: "admin", // TODO: Get actual username
          timestamp: new Date().toISOString(),
          unit: updatedItem.unit,
          cost: updatedItem.cost,
          totalCost: updatedItem.cost ? updatedItem.cost * quantityAdded : undefined,
        })
      }
    }
  } catch (error) {
    console.error("Error updating inventory item:", error)
    throw error
  }
}

// Delete an inventory item
export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase.from("inventory_items").delete().eq("id", id)

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const items = await getInventoryItems()
        const filteredItems = items.filter((item) => item.id !== id)
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(filteredItems))
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("inventory_items").delete().eq("id", id)

      if (error) throw error
    }
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    throw error
  }
}

// Get all transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("transactions").select("*").order("timestamp", { ascending: false })

        if (error) throw error

        return data.map((transaction) => ({
          id: transaction.id,
          type: transaction.type as "in" | "out",
          itemId: transaction.item_id,
          itemName: transaction.item_name,
          quantity: Number(transaction.quantity),
          user: transaction.user_id,
          timestamp: transaction.timestamp,
          unit: transaction.unit as "item" | "kg" | "lb" | null,
          cost: transaction.cost ? Number(transaction.cost) : undefined,
          totalCost: transaction.total_cost ? Number(transaction.total_cost) : undefined,
        }))
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        initializeData()
        const transactions = localStorage.getItem(TRANSACTIONS_KEY)
        return transactions ? JSON.parse(transactions) : []
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("transactions").select("*").order("timestamp", { ascending: false })

      if (error) throw error

      return data.map((transaction) => ({
        id: transaction.id,
        type: transaction.type as "in" | "out",
        itemId: transaction.item_id,
        itemName: transaction.item_name,
        quantity: Number(transaction.quantity),
        user: transaction.user_id,
        timestamp: transaction.timestamp,
        unit: transaction.unit as "item" | "kg" | "lb" | null,
        cost: transaction.cost ? Number(transaction.cost) : undefined,
        totalCost: transaction.total_cost ? Number(transaction.total_cost) : undefined,
      }))
    }
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return []
  }
}

// Add a new transaction
export async function addTransaction(transaction: Transaction): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase.from("transactions").insert({
          id: transaction.id,
          type: transaction.type,
          item_id: transaction.itemId,
          item_name: transaction.itemName,
          quantity: transaction.quantity,
          user_id: transaction.user,
          timestamp: transaction.timestamp,
          unit: transaction.unit,
          cost: transaction.cost,
          total_cost: transaction.totalCost,
        })

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const transactions = await getTransactions()
        transactions.push(transaction)
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("transactions").insert({
        id: transaction.id,
        type: transaction.type,
        item_id: transaction.itemId,
        item_name: transaction.itemName,
        quantity: transaction.quantity,
        user_id: transaction.user,
        timestamp: transaction.timestamp,
        unit: transaction.unit,
        cost: transaction.cost,
        total_cost: transaction.totalCost,
      })

      if (error) throw error
    }
  } catch (error) {
    console.error("Error adding transaction:", error)
    throw error
  }
}

// Get student checkouts
export async function getStudentCheckouts(): Promise<StudentCheckout[]> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("student_checkouts")
          .select("*")
          .order("timestamp", { ascending: false })

        if (error) throw error

        return data.map((checkout) => ({
          studentId: checkout.student_id,
          itemId: checkout.item_id,
          quantity: Number(checkout.quantity),
          timestamp: checkout.timestamp,
          unit: checkout.unit as "item" | "kg" | "lb" | null,
        }))
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        initializeData()
        const checkouts = localStorage.getItem(STUDENT_CHECKOUTS_KEY)
        return checkouts ? JSON.parse(checkouts) : []
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("student_checkouts")
        .select("*")
        .order("timestamp", { ascending: false })

      if (error) throw error

      return data.map((checkout) => ({
        studentId: checkout.student_id,
        itemId: checkout.item_id,
        quantity: Number(checkout.quantity),
        timestamp: checkout.timestamp,
        unit: checkout.unit as "item" | "kg" | "lb" | null,
      }))
    }
  } catch (error) {
    console.error("Error fetching student checkouts:", error)
    return []
  }
}

// Add student checkout
export async function addStudentCheckout(checkout: StudentCheckout): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase.from("student_checkouts").insert({
          student_id: checkout.studentId,
          item_id: checkout.itemId,
          quantity: checkout.quantity,
          timestamp: checkout.timestamp,
          unit: checkout.unit,
        })

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const checkouts = await getStudentCheckouts()
        checkouts.push(checkout)
        localStorage.setItem(STUDENT_CHECKOUTS_KEY, JSON.stringify(checkouts))
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("student_checkouts").insert({
        student_id: checkout.studentId,
        item_id: checkout.itemId,
        quantity: checkout.quantity,
        timestamp: checkout.timestamp,
        unit: checkout.unit,
      })

      if (error) throw error
    }
  } catch (error) {
    console.error("Error adding student checkout:", error)
    throw error
  }
}

// Get all orders
export async function getOrders(): Promise<Order[]> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })

        if (ordersError) throw ordersError

        const orders: Order[] = []

        for (const order of ordersData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id)

          if (itemsError) throw itemsError

          orders.push({
            id: order.id,
            studentId: order.student_id,
            items: itemsData.map((item) => ({
              itemId: item.item_id,
              itemName: item.item_name,
              quantity: Number(item.quantity),
              category: item.category,
              unit: item.unit as "item" | "kg" | "lb" | null,
            })),
            status: order.status as "pending" | "fulfilled" | "cancelled",
            createdAt: order.created_at,
            fulfilledAt: order.fulfilled_at,
            notified: order.notified,
            error: order.error,
          })
        }

        return orders
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        initializeData()
        const orders = localStorage.getItem(ORDERS_KEY)
        return orders ? JSON.parse(orders) : []
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      const orders: Order[] = []

      for (const order of ordersData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", order.id)

        if (itemsError) throw itemsError

        orders.push({
          id: order.id,
          studentId: order.student_id,
          items: itemsData.map((item) => ({
            itemId: item.item_id,
            itemName: item.item_name,
            quantity: Number(item.quantity),
            category: item.category,
            unit: item.unit as "item" | "kg" | "lb" | null,
          })),
          status: order.status as "pending" | "fulfilled" | "cancelled",
          createdAt: order.created_at,
          fulfilledAt: order.fulfilled_at,
          notified: order.notified,
          error: order.error,
        })
      }

      return orders
    }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

// Add a new order
export async function addOrder(order: Order): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()

        // Insert the order
        const { error: orderError } = await supabase.from("orders").insert({
          id: order.id,
          student_id: order.studentId,
          status: order.status,
          created_at: order.createdAt,
          fulfilled_at: order.fulfilledAt,
          notified: order.notified,
          error: order.error,
        })

        if (orderError) throw orderError

        // Insert order items
        for (const item of order.items) {
          const { error: itemError } = await supabase.from("order_items").insert({
            order_id: order.id,
            item_id: item.itemId,
            item_name: item.itemName,
            quantity: item.quantity,
            category: item.category,
            unit: item.unit,
          })

          if (itemError) throw itemError
        }
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const orders = await getOrders()
        orders.push(order)
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()

      // Insert the order
      const { error: orderError } = await supabase.from("orders").insert({
        id: order.id,
        student_id: order.studentId,
        status: order.status,
        created_at: order.createdAt,
        fulfilled_at: order.fulfilledAt,
        notified: order.notified,
        error: order.error,
      })

      if (orderError) throw orderError

      // Insert order items
      for (const item of order.items) {
        const { error: itemError } = await supabase.from("order_items").insert({
          order_id: order.id,
          item_id: item.itemId,
          item_name: item.itemName,
          quantity: item.quantity,
          category: item.category,
          unit: item.unit,
        })

        if (itemError) throw itemError
      }
    }
  } catch (error) {
    console.error("Error adding order:", error)
    throw error
  }
}

// Update an existing order
export async function updateOrder(updatedOrder: Order): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase
          .from("orders")
          .update({
            student_id: updatedOrder.studentId,
            status: updatedOrder.status,
            fulfilled_at: updatedOrder.fulfilledAt,
            notified: updatedOrder.notified,
            error: updatedOrder.error,
          })
          .eq("id", updatedOrder.id)

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const orders = await getOrders()
        const index = orders.findIndex((order) => order.id === updatedOrder.id)

        if (index !== -1) {
          orders[index] = updatedOrder
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
        }
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .update({
          student_id: updatedOrder.studentId,
          status: updatedOrder.status,
          fulfilled_at: updatedOrder.fulfilledAt,
          notified: updatedOrder.notified,
          error: updatedOrder.error,
        })
        .eq("id", updatedOrder.id)

      if (error) throw error
    }
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

// Get categories
export async function getCategories() {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.from("categories").select("*").order("name")

        if (error) throw error

        return data
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        initializeData()
        const categories = localStorage.getItem(CATEGORIES_KEY)
        return categories ? JSON.parse(categories) : []
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error

      return data
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

// Add a category
export async function addCategory(category: { id: string; name: string; description: string }): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase.from("categories").insert({
          id: category.id,
          name: category.name,
          description: category.description,
        })

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const categories = await getCategories()
        categories.push(category)
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("categories").insert({
        id: category.id,
        name: category.name,
        description: category.description,
      })

      if (error) throw error
    }
  } catch (error) {
    console.error("Error adding category:", error)
    throw error
  }
}

// Update a category
export async function updateCategory(category: { id: string; name: string; description: string }): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase
          .from("categories")
          .update({
            name: category.name,
            description: category.description,
          })
          .eq("id", category.id)

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const categories = await getCategories()
        const index = categories.findIndex((cat) => cat.id === category.id)

        if (index !== -1) {
          categories[index] = category
          localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
        }
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("categories")
        .update({
          name: category.name,
          description: category.description,
        })
        .eq("id", category.id)

      if (error) throw error
    }
  } catch (error) {
    console.error("Error updating category:", error)
    throw error
  }
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { error } = await supabase.from("categories").delete().eq("id", id)

        if (error) throw error
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const categories = await getCategories()
        const filteredCategories = categories.filter((cat) => cat.id !== id)
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filteredCategories))
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error
    }
  } catch (error) {
    console.error("Error deleting category:", error)
    throw error
  }
}

// Mark an order as fulfilled and update inventory
export async function fulfillOrder(orderId: string): Promise<{ success: boolean; order?: Order }> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()

        // Get the order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single()

        if (orderError) throw orderError

        // Get order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderId)

        if (itemsError) throw itemsError

        // Check if we have enough inventory for all items
        for (const item of itemsData) {
          const { data: inventoryData, error: inventoryError } = await supabase
            .from("inventory_items")
            .select("quantity")
            .eq("id", item.item_id)
            .single()

          if (inventoryError) throw inventoryError

          if (Number(inventoryData.quantity) < Number(item.quantity)) {
            return {
              success: false,
              order: {
                id: orderData.id,
                studentId: orderData.student_id,
                items: itemsData.map((i) => ({
                  itemId: i.item_id,
                  itemName: i.item_name,
                  quantity: Number(i.quantity),
                  category: i.category,
                  unit: i.unit as "item" | "kg" | "lb" | null,
                })),
                status: orderData.status as "pending" | "fulfilled" | "cancelled",
                createdAt: orderData.created_at,
                fulfilledAt: orderData.fulfilled_at,
                notified: orderData.notified,
                error: `Not enough ${item.item_name} in inventory`,
              },
            }
          }
        }

        // Update inventory quantities
        for (const item of itemsData) {
          const { error: updateError } = await supabase.rpc("decrement_inventory", {
            item_id_param: item.item_id,
            quantity_param: Number(item.quantity),
          })

          if (updateError) throw updateError
        }

        // Add transaction records and student checkouts
        const now = new Date().toISOString()

        for (const item of itemsData) {
          // Add transaction
          const { error: transactionError } = await supabase.from("transactions").insert({
            id: `tx-${Date.now()}-${item.item_id}`,
            type: "out",
            item_id: item.item_id,
            item_name: item.item_name,
            quantity: Number(item.quantity),
            user_id: orderData.student_id,
            timestamp: now,
            unit: item.unit,
          })

          if (transactionError) throw transactionError

          // Add student checkout record
          const { error: checkoutError } = await supabase.from("student_checkouts").insert({
            student_id: orderData.student_id,
            item_id: item.item_id,
            quantity: Number(item.quantity),
            timestamp: now,
            unit: item.unit,
          })

          if (checkoutError) throw checkoutError
        }

        // Update order status
        const { error: updateOrderError } = await supabase
          .from("orders")
          .update({
            status: "fulfilled",
            fulfilled_at: now,
            notified: true,
          })
          .eq("id", orderId)

        if (updateOrderError) throw updateOrderError

        return {
          success: true,
          order: {
            id: orderData.id,
            studentId: orderData.student_id,
            items: itemsData.map((i) => ({
              itemId: i.item_id,
              itemName: i.item_name,
              quantity: Number(i.quantity),
              category: i.category,
              unit: i.unit as "item" | "kg" | "lb" | null,
            })),
            status: "fulfilled",
            createdAt: orderData.created_at,
            fulfilledAt: now,
            notified: true,
          },
        }
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage implementation
        const orders = await getOrders()
        const orderIndex = orders.findIndex((order) => order.id === orderId)

        if (orderIndex === -1) {
          return { success: false }
        }

        const order = orders[orderIndex]
        const inventory = await getInventoryItems()

        // Check if we have enough inventory for all items
        for (const item of order.items) {
          const inventoryItem = inventory.find((i) => i.id === item.itemId)
          if (!inventoryItem || inventoryItem.quantity < item.quantity) {
            return {
              success: false,
              order: {
                ...order,
                error: `Not enough ${item.itemName} in inventory`,
              },
            }
          }
        }

        // Update inventory quantities
        for (const item of order.items) {
          const inventoryItemIndex = inventory.findIndex((i) => i.id === item.itemId)
          if (inventoryItemIndex !== -1) {
            inventory[inventoryItemIndex].quantity -= item.quantity
          }
        }

        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory))

        // Add transaction records and student checkouts
        const now = new Date().toISOString()

        for (const item of order.items) {
          const inventoryItem = inventory.find((i) => i.id === item.itemId)
          const validUnit = inventoryItem ? inventoryItem.unit : "item"

          // Add transaction
          await addTransaction({
            id: `tx-${Date.now()}-${item.itemId}`,
            type: "out",
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
            user: order.studentId,
            timestamp: now,
            unit: validUnit,
          })

          // Add student checkout record
          await addStudentCheckout({
            studentId: order.studentId,
            itemId: item.itemId,
            quantity: item.quantity,
            timestamp: now,
            unit: validUnit,
          })
        }

        // Update order status
        order.status = "fulfilled"
        order.fulfilledAt = now
        order.notified = true

        // Save updated order
        orders[orderIndex] = order
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))

        return { success: true, order }
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()

      // Get the order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError) throw orderError

      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)

      if (itemsError) throw itemsError

      // Check if we have enough inventory for all items
      for (const item of itemsData) {
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventory_items")
          .select("quantity")
          .eq("id", item.item_id)
          .single()

        if (inventoryError) throw inventoryError

        if (Number(inventoryData.quantity) < Number(item.quantity)) {
          return {
            success: false,
            order: {
              id: orderData.id,
              studentId: orderData.student_id,
              items: itemsData.map((i) => ({
                itemId: i.item_id,
                itemName: i.item_name,
                quantity: Number(i.quantity),
                category: i.category,
                unit: i.unit as "item" | "kg" | "lb" | null,
              })),
              status: orderData.status as "pending" | "fulfilled" | "cancelled",
              createdAt: orderData.created_at,
              fulfilledAt: orderData.fulfilled_at,
              notified: orderData.notified,
              error: `Not enough ${item.item_name} in inventory`,
            },
          }
        }
      }

      // Update inventory quantities
      for (const item of itemsData) {
        const { error: updateError } = await supabase.rpc("decrement_inventory", {
          item_id_param: item.item_id,
          quantity_param: Number(item.quantity),
        })

        if (updateError) throw updateError
      }

      // Add transaction records and student checkouts
      const now = new Date().toISOString()

      for (const item of itemsData) {
        // Add transaction
        const { error: transactionError } = await supabase.from("transactions").insert({
          id: `tx-${Date.now()}-${item.item_id}`,
          type: "out",
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: Number(item.quantity),
          user_id: orderData.student_id,
          timestamp: now,
          unit: item.unit,
        })

        if (transactionError) throw transactionError

        // Add student checkout record
        const { error: checkoutError } = await supabase.from("student_checkouts").insert({
          student_id: orderData.student_id,
          item_id: item.item_id,
          quantity: Number(item.quantity),
          timestamp: now,
          unit: item.unit,
        })

        if (checkoutError) throw checkoutError
      }

      // Update order status
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update({
          status: "fulfilled",
          fulfilled_at: now,
          notified: true,
        })
        .eq("id", orderId)

      if (updateOrderError) throw updateOrderError

      return {
        success: true,
        order: {
          id: orderData.id,
          studentId: orderData.student_id,
          items: itemsData.map((i) => ({
            itemId: i.item_id,
            itemName: i.item_name,
            quantity: Number(i.quantity),
            category: i.category,
            unit: i.unit as "item" | "kg" | "lb" | null,
          })),
          status: "fulfilled",
          createdAt: orderData.created_at,
          fulfilledAt: now,
          notified: true,
        },
      }
    }
  } catch (error) {
    console.error("Error fulfilling order:", error)
    return { success: false }
  }
}

// Check if student can take an item based on limits
export async function canStudentTakeItem(
  studentId: string,
  itemId: string,
  requestedQuantity: number,
): Promise<{
  allowed: boolean
  reason?: string
  availableQuantity?: number
}> {
  try {
    // Get the item
    const item = await getInventoryItem(itemId)
    if (!item) {
      return { allowed: false, reason: "Item not found" }
    }

    // Check if there's enough quantity in stock
    if (item.quantity < requestedQuantity) {
      return {
        allowed: false,
        reason: "Not enough quantity in stock",
        availableQuantity: item.quantity,
      }
    }

    // If the item has no limits, allow it
    if (item.hasLimit === false) {
      return { allowed: true }
    }

    // Check student limit
    if (requestedQuantity > item.studentLimit) {
      return {
        allowed: false,
        reason: `Limited to ${formatQuantityWithUnit(item.studentLimit, item.unit)}`,
        availableQuantity: item.studentLimit,
      }
    }

    // Check time-based restriction
    const checkouts = await getStudentCheckouts()
    const studentCheckouts = checkouts.filter(
      (checkout) => checkout.studentId === studentId && checkout.itemId === itemId,
    )

    if (studentCheckouts.length > 0) {
      // Find the most recent checkout
      const latestCheckout = studentCheckouts.reduce((latest, current) => {
        return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      }, studentCheckouts[0])

      // Calculate total restriction in minutes
      const totalRestrictionMinutes = item.limitDuration * 24 * 60 + item.limitDurationMinutes

      // Calculate minutes since last checkout
      const minutesSinceLastCheckout = (Date.now() - new Date(latestCheckout.timestamp).getTime()) / (1000 * 60)

      if (minutesSinceLastCheckout < totalRestrictionMinutes) {
        const remainingMinutes = Math.ceil(totalRestrictionMinutes - minutesSinceLastCheckout)
        return {
          allowed: false,
          reason: formatRemainingTime(remainingMinutes),
        }
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error("Error checking if student can take item:", error)
    return { allowed: false, reason: "An error occurred while checking item availability" }
  }
}

// Process direct checkout for admin users
export async function processDirectCheckout(
  studentId: string,
  items: { itemId: string; itemName: string; quantity: number; category: string; unit?: string | null }[],
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()

        // Check if we have enough inventory for all items
        for (const item of items) {
          const { data: inventoryData, error: inventoryError } = await supabase
            .from("inventory_items")
            .select("quantity")
            .eq("id", item.itemId)
            .single()

          if (inventoryError) throw inventoryError

          if (Number(inventoryData.quantity) < item.quantity) {
            return {
              success: false,
              error: `Not enough ${item.itemName} in inventory`,
            }
          }
        }

        // Update inventory quantities
        for (const item of items) {
          const { error: updateError } = await supabase.rpc("decrement_inventory", {
            item_id_param: item.itemId,
            quantity_param: item.quantity,
          })

          if (updateError) throw updateError
        }

        // Add transaction records and student checkouts
        const now = new Date().toISOString()

        for (const item of items) {
          // Add transaction
          const { error: transactionError } = await supabase.from("transactions").insert({
            id: `tx-${Date.now()}-${item.itemId}`,
            type: "out",
            item_id: item.itemId,
            item_name: item.itemName,
            quantity: item.quantity,
            user_id: studentId,
            timestamp: now,
            unit: item.unit,
          })

          if (transactionError) throw transactionError

          // Add student checkout record
          const { error: checkoutError } = await supabase.from("student_checkouts").insert({
            student_id: studentId,
            item_id: item.itemId,
            quantity: item.quantity,
            timestamp: now,
            unit: item.unit,
          })

          if (checkoutError) throw checkoutError
        }

        return { success: true }
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const inventory = await getInventoryItems()

        // Check if we have enough inventory for all items
        for (const item of items) {
          const inventoryItem = inventory.find((i) => i.id === item.itemId)
          if (!inventoryItem || inventoryItem.quantity < item.quantity) {
            return {
              success: false,
              error: `Not enough ${item.itemName} in inventory`,
            }
          }
        }

        // Update inventory quantities
        for (const item of items) {
          const inventoryItemIndex = inventory.findIndex((i) => i.id === item.itemId)
          if (inventoryItemIndex !== -1) {
            inventory[inventoryItemIndex].quantity -= item.quantity
          }
        }

        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory))

        // Add transaction records and student checkouts
        const now = new Date().toISOString()

        for (const item of items) {
          const inventoryItem = inventory.find((i) => i.id === item.itemId)
          const validUnit = inventoryItem ? inventoryItem.unit : "item"

          // Add transaction
          await addTransaction({
            id: `tx-${Date.now()}-${item.itemId}`,
            type: "out",
            itemId: item.itemId,
            itemName: item.itemName,
            quantity: item.quantity,
            user: studentId,
            timestamp: now,
            unit: item.unit,
          })

          // Add student checkout record
          await addStudentCheckout({
            studentId: studentId,
            itemId: item.itemId,
            quantity: item.quantity,
            timestamp: now,
            unit: item.unit,
          })
        }

        return { success: true }
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()

      // Check if we have enough inventory for all items
      for (const item of items) {
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventory_items")
          .select("quantity")
          .eq("id", item.itemId)
          .single()

        if (inventoryError) throw inventoryError

        if (Number(inventoryData.quantity) < item.quantity) {
          return {
            success: false,
            error: `Not enough ${item.itemName} in inventory`,
          }
        }
      }

      // Update inventory quantities
      for (const item of items) {
        const { error: updateError } = await supabase.rpc("decrement_inventory", {
          item_id_param: item.itemId,
          quantity_param: item.quantity,
        })

        if (updateError) throw updateError
      }

      // Add transaction records and student checkouts
      const now = new Date().toISOString()

      for (const item of items) {
        // Add transaction
        const { error: transactionError } = await supabase.from("transactions").insert({
          id: `tx-${Date.now()}-${item.itemId}`,
          type: "out",
          item_id: item.itemId,
          item_name: item.itemName,
          quantity: item.quantity,
          user_id: studentId,
          timestamp: now,
          unit: item.unit,
        })

        if (transactionError) throw transactionError

        // Add student checkout record
        const { error: checkoutError } = await supabase.from("student_checkouts").insert({
          student_id: studentId,
          item_id: item.itemId,
          quantity: item.quantity,
          timestamp: now,
          unit: item.unit,
        })

        if (checkoutError) throw checkoutError
      }

      return { success: true }
    }
  } catch (error) {
    console.error("Error processing direct checkout:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Check if a student has recently placed an order
export async function hasRecentOrder(studentId: string): Promise<{ hasRecent: boolean; timeRemaining?: number }> {
  try {
    if (isBrowser) {
      try {
        // Try to use Supabase first
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("orders")
          .select("created_at")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) throw error

        if (data.length === 0) {
          return { hasRecent: false }
        }

        // Check if the order was placed within the last 30 minutes (1800000 ms)
        const orderTime = new Date(data[0].created_at).getTime()
        const currentTime = Date.now()
        const timeDifference = currentTime - orderTime
        const cooldownPeriod = 30 * 60 * 1000 // 30 minutes in milliseconds

        if (timeDifference < cooldownPeriod) {
          const timeRemaining = Math.ceil((cooldownPeriod - timeDifference) / 60000) // Convert to minutes
          return { hasRecent: true, timeRemaining }
        }

        return { hasRecent: false }
      } catch (error) {
        console.error("Supabase error, falling back to localStorage:", error)
        // Fallback to localStorage
        const orders = await getOrders()
        const studentOrders = orders.filter((order) => order.studentId === studentId)

        if (studentOrders.length === 0) {
          return { hasRecent: false }
        }

        // Find the most recent order
        const latestOrder = studentOrders.reduce((latest, current) => {
          return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        }, studentOrders[0])

        // Check if the order was placed within the last 30 minutes (1800000 ms)
        const orderTime = new Date(latestOrder.createdAt).getTime()
        const currentTime = Date.now()
        const timeDifference = currentTime - orderTime
        const cooldownPeriod = 30 * 60 * 1000 // 30 minutes in milliseconds

        if (timeDifference < cooldownPeriod) {
          const timeRemaining = Math.ceil((cooldownPeriod - timeDifference) / 60000) // Convert to minutes
          return { hasRecent: true, timeRemaining }
        }

        return { hasRecent: false }
      }
    } else {
      // Server-side code
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      if (data.length === 0) {
        return { hasRecent: false }
      }

      // Check if the order was placed within the last 30 minutes (1800000 ms)
      const orderTime = new Date(data[0].created_at).getTime()
      const currentTime = Date.now()
      const timeDifference = currentTime - orderTime
      const cooldownPeriod = 30 * 60 * 1000 // 30 minutes in milliseconds

      if (timeDifference < cooldownPeriod) {
        const timeRemaining = Math.ceil((cooldownPeriod - timeDifference) / 60000) // Convert to minutes
        return { hasRecent: true, timeRemaining }
      }

      return { hasRecent: false }
    }
  } catch (error) {
    console.error("Error checking for recent orders:", error)
    return { hasRecent: false }
  }
}

// Create an order
export async function createOrder(
  studentId: string,
  items: {
    itemId: string
    itemName: string
    quantity: number
    category: string
    unit?: "item" | "kg" | "lb" | null
  }[],
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Check if student has placed an order recently
    const recentOrderCheck = await hasRecentOrder(studentId)
    if (recentOrderCheck.hasRecent) {
      return {
        success: false,
        error: `You've already placed an order recently. Please wait ${recentOrderCheck.timeRemaining} minutes before placing another order.`,
      }
    }

    const orderId = `order-${Date.now()}`
    const now = new Date().toISOString()

    const newOrder: Order = {
      id: orderId,
      studentId: studentId,
      items: items,
      status: "pending",
      createdAt: now,
      notified: false,
    }

    await addOrder(newOrder)

    return { success: true, orderId }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: "An unexpected error occurred while creating your order" }
  }
}

// Helper functions
export function formatQuantityWithUnit(quantity: number, unit: string | null | undefined): string {
  const validUnit = validateUnit(unit)

  if (!validUnit || validUnit === "item") {
    return `${quantity} ${quantity === 1 ? "item" : "items"}`
  }

  // Format decimal places for weight units
  const formattedQuantity = Number.isInteger(quantity) ? quantity : quantity.toFixed(2)
  return `${formattedQuantity} ${validUnit}`
}

export function validateUnit(unit: string | null | undefined): "item" | "kg" | "lb" | null {
  if (unit === "kg" || unit === "lb" || unit === "item") {
    return unit
  }
  return "item" // Default to "item" if invalid
}

export function formatTimeRestriction(days: number, minutes: number): string {
  if (days === 0 && minutes === 0) return "No restriction"

  const parts = []
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? "s" : ""}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`)
  }

  return parts.join(" and ")
}

export function formatRemainingTime(minutes: number): string {
  if (minutes <= 0) return "Available now"

  if (minutes < 60) {
    return `Available in ${minutes} minute${minutes !== 1 ? "s" : ""}`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours < 24) {
    let result = `Available in ${hours} hour${hours !== 1 ? "s" : ""}`
    if (remainingMinutes > 0) {
      result += ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`
    }
    return result
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  let result = `Available in ${days} day${days !== 1 ? "s" : ""}`
  if (remainingHours > 0 || remainingMinutes > 0) {
    result += " and "
    if (remainingHours > 0) {
      result += `${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`
      if (remainingMinutes > 0) {
        result += ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`
      }
    } else if (remainingMinutes > 0) {
      result += `${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`
    }
  }

  return result
}
