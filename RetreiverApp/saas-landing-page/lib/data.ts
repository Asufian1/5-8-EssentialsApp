import type { InventoryItem, TakeItemRequest, Transaction } from "./types"

// Manages an inventory system using localStorage, including sample data initialization, CRUD operations, and transaction logging.


// Local storage keys
const INVENTORY_KEY = "inventory_items"
const TRANSACTIONS_KEY = "inventory_transactions"

// Initialize with sample data if not exists
export const initializeData = () => {
  // Check if inventory data exists
  if (!localStorage.getItem(INVENTORY_KEY)) {
    // Sample inventory data
    const sampleInventory: InventoryItem[] = [
      { id: "1", name: "Rice", category: "grains", quantity: 50 },
      { id: "2", name: "Beans", category: "essentials", quantity: 30 },
      { id: "3", name: "Pasta", category: "essentials", quantity: 40 },
      { id: "4", name: "Canned Soup", category: "canned", quantity: 25 },
      { id: "5", name: "Cereal", category: "essentials", quantity: 20 },
      { id: "6", name: "Milk", category: "dairy", quantity: 15 },
      { id: "7", name: "Bread", category: "essentials", quantity: 10 },
      { id: "8", name: "Eggs", category: "dairy", quantity: 24 },
      { id: "9", name: "Apples", category: "produce", quantity: 30 },
      { id: "10", name: "Potatoes", category: "produce", quantity: 40 },
      { id: "11", name: "Lentils", category: "south-asian", quantity: 35 },
      { id: "12", name: "Chickpeas", category: "south-asian", quantity: 28 },
      { id: "13", name: "Basmati Rice", category: "south-asian", quantity: 45 },
      { id: "14", name: "Canned Tomatoes", category: "canned", quantity: 20 },
      { id: "15", name: "Oatmeal", category: "essentials", quantity: 18 },
      { id: "16", name: "Quinoa", category: "grains", quantity: 22 },
      { id: "17", name: "Yogurt", category: "dairy", quantity: 18 },
      { id: "18", name: "Bananas", category: "produce", quantity: 35 },
      { id: "19", name: "Masala Spice Mix", category: "south-asian", quantity: 15 },
      { id: "20", name: "Canned Beans", category: "canned", quantity: 30 },
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
      },
      {
        id: "t2",
        type: "in",
        itemId: "2",
        itemName: "Beans",
        quantity: 30,
        user: "admin",
        timestamp: today.toISOString(),
      },
      {
        id: "t3",
        type: "out",
        itemId: "1",
        itemName: "Rice",
        quantity: 2,
        user: "student1",
        timestamp: yesterday.toISOString(),
      },
      {
        id: "t4",
        type: "out",
        itemId: "2",
        itemName: "Beans",
        quantity: 1,
        user: "student2",
        timestamp: yesterday.toISOString(),
      },
      {
        id: "t5",
        type: "out",
        itemId: "1",
        itemName: "Rice",
        quantity: 3,
        user: "student3",
        timestamp: twoDaysAgo.toISOString(),
      },
      {
        id: "t6",
        type: "out",
        itemId: "13",
        itemName: "Basmati Rice",
        quantity: 2,
        user: "student4",
        timestamp: yesterday.toISOString(),
      },
      {
        id: "t7",
        type: "out",
        itemId: "11",
        itemName: "Lentils",
        quantity: 3,
        user: "student2",
        timestamp: today.toISOString(),
      },
      {
        id: "t8",
        type: "out",
        itemId: "19",
        itemName: "Masala Spice Mix",
        quantity: 1,
        user: "student5",
        timestamp: today.toISOString(),
      },
    ]

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(sampleTransactions))
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

// Take items from inventory (student checkout)
export const takeItems = (items: TakeItemRequest[]): void => {
  const inventory = getInventoryItems()

  // Update inventory quantities
  items.forEach((item) => {
    const inventoryItem = inventory.find((i) => i.id === item.itemId)
    if (inventoryItem) {
      inventoryItem.quantity -= item.quantity
    }
  })

  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory))

  // Add transaction records
  items.forEach((item) => {
    addTransaction({
      id: Date.now().toString(),
      type: "out",
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      user: item.user,
      timestamp: new Date().toISOString(),
    })
  })
}

