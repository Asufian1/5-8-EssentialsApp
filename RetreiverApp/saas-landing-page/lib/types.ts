export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  studentLimit: number // Maximum quantity a student can take
  limitDuration: number // Time in days before a student can take this item again
  limitDurationMinutes: number // Additional minutes for time restriction
  unit: "item" | "kg" | "lb" | null // Unit of measurement
  isWeighed: boolean // Whether this item is measured by weight
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
