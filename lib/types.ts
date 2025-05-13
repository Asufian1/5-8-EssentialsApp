export interface InventoryItem {
  id: string
  name: string
  category: string
  categoryName?: string
  quantity: number
  studentLimit: number // Maximum quantity a student can take
  limitDuration: number // Time in days before a student can take this item again
  limitDurationMinutes: number // Additional minutes for time restriction
  unit: "item" | "kg" | "lb" | null // Unit of measurement
  isWeighed: boolean // Whether this item is measured by weight
  hasLimit?: boolean // Whether this item has a limit
  cost?: number // Cost per unit
  lastRestockDate?: string // Date of last restock
  supplier?: string // Supplier information
  price?: number // Selling price (if applicable)
}

export interface Transaction {
  id: string
  type: "in" | "out"
  itemId: string
  itemName: string
  quantity: number
  user: string
  timestamp: string
  unit?: "item" | "kg" | "lb" | null
  cost?: number // Cost per unit for this transaction
  totalCost?: number // Total cost for this transaction
}

export interface TakeItemRequest {
  itemId: string
  itemName: string
  quantity: number
  user: string
  unit?: "item" | "kg" | "lb" | null
}

export interface StudentCheckout {
  studentId: string
  itemId: string
  quantity: number
  timestamp: string
  unit?: "item" | "kg" | "lb" | null
}

export interface Order {
  id: string
  studentId: string
  items: {
    itemId: string
    itemName: string
    quantity: number
    category: string
    unit?: "item" | "kg" | "lb" | null
  }[]
  status: "pending" | "fulfilled" | "cancelled"
  createdAt: string
  fulfilledAt?: string
  notified: boolean
  error?: string
}

// New interface for CSV import
export interface CsvImportItem {
  product: string
  weightAmount: string
  pricePerUnit: string
  orderQuantities: number
  totalCost?: number
}
