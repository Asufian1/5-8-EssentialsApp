import type { InventoryItem, Category, Transaction, StudentCheckout, Order, OrderItem } from "./types"

// Sample data for local development
const sampleCategories: Category[] = [
  { id: "essentials", name: "Essentials", description: "Basic food items" },
  { id: "grains", name: "Grains", description: "Rice, pasta, and other grains" },
  { id: "canned", name: "Canned Goods", description: "Canned foods and preserved items" },
  { id: "produce", name: "Produce", description: "Fresh fruits and vegetables" },
  { id: "dairy", name: "Dairy", description: "Milk, cheese, and other dairy products" },
  { id: "south-asian", name: "South Asian", description: "South Asian food items" },
  { id: "other", name: "Other", description: "Miscellaneous items" },
]

const sampleInventoryItems: InventoryItem[] = [
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
    cost: 2.5,
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
    cost: 1.25,
  },
  {
    id: "3",
    name: "Pasta",
    category: "grains",
    quantity: 40,
    studentLimit: 2,
    limitDuration: 7,
    limitDurationMinutes: 0,
    unit: "item",
    isWeighed: false,
    hasLimit: true,
    cost: 1.75,
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
    hasLimit: true,
    cost: 1.5,
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
    hasLimit: true,
    cost: 3.25,
  },
]

// Helper function to get data from localStorage or use sample data
function getLocalData<T>(key: string, sampleData: T[]): T[] {
  if (typeof window === "undefined") {
    return sampleData
  }

  try {
    const storedData = localStorage.getItem(key)
    return storedData ? JSON.parse(storedData) : sampleData
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error)
    return sampleData
  }
}

// Helper function to save data to localStorage
function saveLocalData<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  return getLocalData<Category>("categories", sampleCategories)
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const categories = await getCategories()
  return categories.find((category) => category.id === id) || null
}

export async function createCategory(category: Category): Promise<Category> {
  const categories = await getCategories()
  categories.push(category)
  saveLocalData("categories", categories)
  return category
}

// Inventory Items
export async function getInventoryItems(): Promise<InventoryItem[]> {
  return getLocalData<InventoryItem>("inventoryItems", sampleInventoryItems)
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  const items = await getInventoryItems()
  return items.find((item) => item.id === id) || null
}

export async function createInventoryItem(item: InventoryItem): Promise<InventoryItem> {
  const items = await getInventoryItems()
  items.push(item)
  saveLocalData("inventoryItems", items)
  return item
}

// Add this function to match the import in the inventory page
export async function addInventoryItem(item: InventoryItem): Promise<InventoryItem> {
  return createInventoryItem(item)
}

export async function updateInventoryItem(item: InventoryItem): Promise<InventoryItem | null> {
  const items = await getInventoryItems()
  const index = items.findIndex((i) => i.id === item.id)

  if (index === -1) {
    return null
  }

  items[index] = { ...items[index], ...item }
  saveLocalData("inventoryItems", items)
  return items[index]
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const items = await getInventoryItems()
  const filteredItems = items.filter((item) => item.id !== id)

  if (filteredItems.length === items.length) {
    return false // Item not found
  }

  saveLocalData("inventoryItems", filteredItems)
  return true
}

export function formatTimeRestriction(days: number, minutes: number): string {
  if (days === 0 && minutes === 0) {
    return "No time restriction"
  }

  const parts = []
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`)
  }

  return parts.join(" and ")
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  return getLocalData<Transaction>("transactions", [])
}

export async function createTransaction(transaction: Transaction): Promise<Transaction> {
  const transactions = await getTransactions()
  transactions.push(transaction)
  saveLocalData("transactions", transactions)
  return transaction
}

// Student Checkouts
export async function getStudentCheckouts(): Promise<StudentCheckout[]> {
  return getLocalData<StudentCheckout>("studentCheckouts", [])
}

export async function createStudentCheckout(checkout: StudentCheckout): Promise<StudentCheckout> {
  const checkouts = await getStudentCheckouts()
  checkouts.push(checkout)
  saveLocalData("studentCheckouts", checkouts)
  return checkout
}

export async function getStudentCheckoutsByStudentId(studentId: string): Promise<StudentCheckout[]> {
  const checkouts = await getStudentCheckouts()
  return checkouts.filter((checkout) => checkout.student_id === studentId)
}

// Orders
export async function getOrders(): Promise<Order[]> {
  return getLocalData<Order>("orders", [])
}

export async function createOrder(order: Order): Promise<Order> {
  const orders = await getOrders()
  orders.push(order)
  saveLocalData("orders", orders)
  return order
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders()
  return orders.find((order) => order.id === id) || null
}

// Order Items
export async function getOrderItems(): Promise<OrderItem[]> {
  return getLocalData<OrderItem>("orderItems", [])
}

export async function createOrderItem(orderItem: OrderItem): Promise<OrderItem> {
  const orderItems = await getOrderItems()
  orderItems.push(orderItem)
  saveLocalData("orderItems", orderItems)
  return orderItem
}

export async function getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
  const orderItems = await getOrderItems()
  return orderItems.filter((item) => item.order_id === orderId)
}
