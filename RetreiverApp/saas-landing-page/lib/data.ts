import type { InventoryItem, TakeItemRequest, Transaction, StudentCheckout, Order } from "./types"

// Local storage keys
const INVENTORY_KEY = "inventory_items"
const TRANSACTIONS_KEY = "inventory_transactions"
const STUDENT_CHECKOUTS_KEY = "student_checkouts"
const ORDERS_KEY = "student_orders"

// Initialize with sample data if not exists
export const initializeData = () => {
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
      },
      {
        id: "3",
        name: "Pasta",
        category: "essentials",
        quantity: 40,
        studentLimit: 2,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "4",
        name: "Canned Soup",
        category: "canned",
        quantity: 25,
        studentLimit: 3,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "5",
        name: "Cereal",
        category: "essentials",
        quantity: 20,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "6",
        name: "Milk",
        category: "dairy",
        quantity: 15,
        studentLimit: 1,
        limitDuration: 0,
        limitDurationMinutes: 30,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "7",
        name: "Bread",
        category: "essentials",
        quantity: 10,
        studentLimit: 1,
        limitDuration: 3,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "8",
        name: "Eggs",
        category: "dairy",
        quantity: 24,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "9",
        name: "Apples",
        category: "produce",
        quantity: 30,
        studentLimit: 3,
        limitDuration: 3,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "10",
        name: "Potatoes",
        category: "produce",
        quantity: 40,
        studentLimit: 2,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "11",
        name: "Lentils",
        category: "south-asian",
        quantity: 35,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "kg",
        isWeighed: true,
      },
      {
        id: "12",
        name: "Chickpeas",
        category: "south-asian",
        quantity: 28,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "kg",
        isWeighed: true,
      },
      {
        id: "13",
        name: "Basmati Rice",
        category: "south-asian",
        quantity: 45,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "kg",
        isWeighed: true,
      },
      {
        id: "14",
        name: "Canned Tomatoes",
        category: "canned",
        quantity: 20,
        studentLimit: 2,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "15",
        name: "Oatmeal",
        category: "essentials",
        quantity: 18,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "kg",
        isWeighed: true,
      },
      {
        id: "16",
        name: "Quinoa",
        category: "grains",
        quantity: 22,
        studentLimit: 1,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "kg",
        isWeighed: true,
      },
      {
        id: "17",
        name: "Yogurt",
        category: "dairy",
        quantity: 18,
        studentLimit: 2,
        limitDuration: 0,
        limitDurationMinutes: 45,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "18",
        name: "Bananas",
        category: "produce",
        quantity: 35,
        studentLimit: 3,
        limitDuration: 3,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "19",
        name: "Masala Spice Mix",
        category: "south-asian",
        quantity: 15,
        studentLimit: 1,
        limitDuration: 14,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
      {
        id: "20",
        name: "Canned Beans",
        category: "canned",
        quantity: 30,
        studentLimit: 2,
        limitDuration: 7,
        limitDurationMinutes: 0,
        unit: "item",
        isWeighed: false,
      },
    ]

    localStorage.setItem(INVENTORY_KEY, JSON.stringify(sampleInventory))
  }

  // Check if transactions data exists
  if (!localStorage.getItem(TRANSACTIONS_KEY)) {
    // Sample transaction data
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const sampleTransactions: Transaction[] = [
      {
        id: "t1",
        type: "in",
        itemId: "1",
        itemName: "Rice",
        quantity: 50,
        user: "admin",
        timestamp: today.toISOString(),
        unit: "kg",
      },
      {
        id: "t2",
        type: "in",
        itemId: "2",
        itemName: "Beans",
        quantity: 30,
        user: "admin",
        timestamp: today.toISOString(),
        unit: "item",
      },
      {
        id: "t3",
        type: "out",
        itemId: "1",
        itemName: "Rice",
        quantity: 2,
        user: "student1",
        timestamp: yesterday.toISOString(),
        unit: "kg",
      },
      {
        id: "t4",
        type: "out",
        itemId: "2",
        itemName: "Beans",
        quantity: 1,
        user: "student2",
        timestamp: yesterday.toISOString(),
        unit: "item",
      },
      {
        id: "t5",
        type: "out",
        itemId: "1",
        itemName: "Rice",
        quantity: 3,
        user: "student3",
        timestamp: twoDaysAgo.toISOString(),
        unit: "kg",
      },
      {
        id: "t6",
        type: "out",
        itemId: "13",
        itemName: "Basmati Rice",
        quantity: 2,
        user: "student4",
        timestamp: yesterday.toISOString(),
        unit: "kg",
      },
      {
        id: "t7",
        type: "out",
        itemId: "11",
        itemName: "Lentils",
        quantity: 3,
        user: "student2",
        timestamp: today.toISOString(),
        unit: "kg",
      },
      {
        id: "t8",
        type: "out",
        itemId: "19",
        itemName: "Masala Spice Mix",
        quantity: 1,
        user: "student5",
        timestamp: today.toISOString(),
        unit: "item",
      },
    ]

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(sampleTransactions))
  }

  // Initialize student checkouts if not exists
  if (!localStorage.getItem(STUDENT_CHECKOUTS_KEY)) {
    const sampleCheckouts: StudentCheckout[] = []
    localStorage.setItem(STUDENT_CHECKOUTS_KEY, JSON.stringify(sampleCheckouts))
  }

  // Initialize orders if not exists
  if (!localStorage.getItem(ORDERS_KEY)) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const sampleOrders: Order[] = [
      {
        id: "o1",
        studentId: "student1",
        items: [
          { itemId: "1", itemName: "Rice", quantity: 1, category: "grains", unit: "kg" },
          { itemId: "5", itemName: "Cereal", quantity: 1, category: "essentials", unit: "item" },
        ],
        status: "fulfilled",
        createdAt: yesterday.toISOString(),
        fulfilledAt: today.toISOString(),
        notified: true,
      },
      {
        id: "o2",
        studentId: "student2",
        items: [
          { itemId: "2", itemName: "Beans", quantity: 2, category: "essentials", unit: "item" },
          { itemId: "11", itemName: "Lentils", quantity: 1, category: "south-asian", unit: "kg" },
        ],
        status: "pending",
        createdAt: today.toISOString(),
        notified: false,
      },
      {
        id: "o3",
        studentId: "student3",
        items: [
          { itemId: "13", itemName: "Basmati Rice", quantity: 1, category: "south-asian", unit: "kg" },
          { itemId: "19", itemName: "Masala Spice Mix", quantity: 1, category: "south-asian", unit: "item" },
        ],
        status: "pending",
        createdAt: today.toISOString(),
        notified: false,
      },
    ]

    localStorage.setItem(ORDERS_KEY, JSON.stringify(sampleOrders))
  }
}

// Get all inventory items
export const getInventoryItems = (): InventoryItem[] => {
  initializeData()
  const items = localStorage.getItem(INVENTORY_KEY)
  return items ? JSON.parse(items) : []
}

// Get a single inventory item by ID
export const getInventoryItem = (id: string): InventoryItem | null => {
  const items = getInventoryItems()
  return items.find((item) => item.id === id) || null
}

// Add a new inventory item
export const addInventoryItem = (item: InventoryItem): void => {
  const items = getInventoryItems()
  items.push(item)
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))

  // Add transaction record
  addTransaction({
    id: Date.now().toString(),
    type: "in",
    itemId: item.id,
    itemName: item.name,
    quantity: item.quantity,
    user: localStorage.getItem("username") || "unknown",
    timestamp: new Date().toISOString(),
    unit: item.unit,
  })
}

// Update an existing inventory item
export const updateInventoryItem = (updatedItem: InventoryItem): void => {
  const items = getInventoryItems()
  const index = items.findIndex((item) => item.id === updatedItem.id)

  if (index !== -1) {
    // Get the old quantity to calculate the difference
    const oldQuantity = items[index].quantity
    const quantityAdded = updatedItem.quantity - oldQuantity

    // Update the item
    items[index] = updatedItem
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))

    // Add transaction record if quantity was added
    if (quantityAdded > 0) {
      addTransaction({
        id: Date.now().toString(),
        type: "in",
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        quantity: quantityAdded,
        user: localStorage.getItem("username") || "unknown",
        timestamp: new Date().toISOString(),
        unit: updatedItem.unit,
      })
    }
  }
}

// Get all transactions
export const getTransactions = (): Transaction[] => {
  initializeData()
  const transactions = localStorage.getItem(TRANSACTIONS_KEY)
  return transactions ? JSON.parse(transactions) : []
}

// Add a new transaction
export const addTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions()
  transactions.push(transaction)
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
}

// Get student checkouts
export const getStudentCheckouts = (): StudentCheckout[] => {
  initializeData()
  const checkouts = localStorage.getItem(STUDENT_CHECKOUTS_KEY)
  return checkouts ? JSON.parse(checkouts) : []
}

// Add student checkout
export const addStudentCheckout = (checkout: StudentCheckout): void => {
  const checkouts = getStudentCheckouts()
  checkouts.push(checkout)
  localStorage.setItem(STUDENT_CHECKOUTS_KEY, JSON.stringify(checkouts))
}

// Get all orders
export const getOrders = (): Order[] => {
  initializeData()
  const orders = localStorage.getItem(ORDERS_KEY)
  return orders ? JSON.parse(orders) : []
}

// Add a new order
export const addOrder = (order: Order): void => {
  const orders = getOrders()
  orders.push(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

// Update an existing order
export const updateOrder = (updatedOrder: Order): void => {
  const orders = getOrders()
  const index = orders.findIndex((order) => order.id === updatedOrder.id)

  if (index !== -1) {
    orders[index] = updatedOrder
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  }
}

// Format time restriction for display
export const formatTimeRestriction = (days: number, minutes: number): string => {
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

// Calculate time remaining in minutes
export const calculateTimeRemaining = (timestamp: string, days: number, minutes: number): number => {
  const checkoutTime = new Date(timestamp).getTime()
  const currentTime = Date.now()

  // Total restriction in milliseconds
  const restrictionMs = days * 24 * 60 * 60 * 1000 + minutes * 60 * 1000

  // Time elapsed since checkout
  const elapsedMs = currentTime - checkoutTime

  // Time remaining
  const remainingMs = restrictionMs - elapsedMs

  // Convert to minutes
  return Math.ceil(remainingMs / (60 * 1000))
}

// Format remaining time for display
export const formatRemainingTime = (minutes: number): string => {
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

// Format quantity with unit
export const formatQuantityWithUnit = (quantity: number, unit: string | null | undefined): string => {
  if (!unit || unit === "item") {
    return `${quantity} ${quantity === 1 ? "item" : "items"}`
  }

  // Format decimal places for weight units
  const formattedQuantity = Number.isInteger(quantity) ? quantity : quantity.toFixed(2)
  return `${formattedQuantity} ${unit}`
}

// Check if student can take an item based on limits
export const canStudentTakeItem = (
  studentId: string,
  itemId: string,
  requestedQuantity: number,
): {
  allowed: boolean
  reason?: string
  availableQuantity?: number
} => {
  // Get the item
  const item = getInventoryItem(itemId)
  if (!item) {
    return { allowed: false, reason: "Item not found" }
  }

  // Check if there's enough quantity in stock
  if (item.quantity < requestedQuantity) {
    return { allowed: false, reason: "Not enough quantity in stock", availableQuantity: item.quantity }
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
  const checkouts = getStudentCheckouts()
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
}

// Take items from inventory (student checkout)
export const takeItems = (
  items: TakeItemRequest[],
): { success: boolean; errors?: Record<string, string>; orderId?: string } => {
  const inventory = getInventoryItems()
  const errors: Record<string, string> = {}
  let hasErrors = false

  // Check limits for all items first
  for (const item of items) {
    const checkResult = canStudentTakeItem(item.user, item.itemId, item.quantity)
    if (!checkResult.allowed) {
      errors[item.itemId] = checkResult.reason || "Cannot take this item"
      hasErrors = true
    }
  }

  // If any errors, return without processing
  if (hasErrors) {
    return { success: false, errors }
  }

  // Update inventory quantities
  items.forEach((item) => {
    const inventoryItem = inventory.find((i) => i.id === item.itemId)
    if (inventoryItem) {
      inventoryItem.quantity -= item.quantity
    }
  })

  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory))

  // Add transaction records and student checkouts
  const now = new Date().toISOString()

  items.forEach((item) => {
    const inventoryItem = inventory.find((i) => i.id === item.itemId)

    // Add transaction
    addTransaction({
      id: Date.now().toString(),
      type: "out",
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      user: item.user,
      timestamp: now,
      unit: inventoryItem?.unit,
    })

    // Add student checkout record
    addStudentCheckout({
      studentId: item.user,
      itemId: item.itemId,
      quantity: item.quantity,
      timestamp: now,
      unit: inventoryItem?.unit,
    })
  })

  // Create a new order
  const orderId = `order-${Date.now()}`
  const newOrder: Order = {
    id: orderId,
    studentId: items[0].user,
    items: items.map((item) => {
      const inventoryItem = inventory.find((i) => i.id === item.itemId)
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        category: inventoryItem?.category || "unknown",
        unit: inventoryItem?.unit,
      }
    }),
    status: "pending",
    createdAt: now,
    notified: false,
  }

  addOrder(newOrder)

  return { success: true, orderId }
}

// Mark an order as fulfilled
export const fulfillOrder = (orderId: string): { success: boolean; order?: Order } => {
  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) {
    return { success: false }
  }

  const order = orders[orderIndex]

  // Update order status
  order.status = "fulfilled"
  order.fulfilledAt = new Date().toISOString()
  order.notified = true

  // Save updated order
  orders[orderIndex] = order
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))

  return { success: true, order }
}

// Cancel an order
export const cancelOrder = (orderId: string): { success: boolean } => {
  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) {
    return { success: false }
  }

  const order = orders[orderIndex]

  // Return items to inventory
  const inventory = getInventoryItems()

  order.items.forEach((item) => {
    const inventoryItem = inventory.find((i) => i.id === item.itemId)
    if (inventoryItem) {
      inventoryItem.quantity += item.quantity
    }
  })

  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory))

  // Update order status
  order.status = "cancelled"

  // Save updated order
  orders[orderIndex] = order
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))

  return { success: true }
}